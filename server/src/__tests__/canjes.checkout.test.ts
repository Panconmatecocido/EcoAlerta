import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Request, Response } from 'express';
import {
  prisma,
  reservarCanje,
  cancelarReserva,
  confirmarCanje,
  liberarReservasVencidas,
} from '../controllers/canjes.controller';

interface MockResponse {
  statusCode: number;
  body: any;
  status: (code: number) => Response;
  json: (payload: any) => Response;
}

const createMockResponse = (): MockResponse => {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

describe('Módulo 005: Tienda Ecológica, Reserva TTL 5 Minutos y Checkout Transaccional', () => {
  let mockUsers: Record<string, any> = {};
  let mockProductos: Record<string, any> = {};
  let mockSucursales: Record<string, any> = {};
  let mockCanjes: Record<string, any> = {};

  beforeEach(() => {
    mockUsers = {
      'user-1': {
        id: 'user-1',
        nombre: 'Vecino Ejemplar',
        email: 'vecino@mail.com',
        rol: 'CITIZEN',
        puntos: 300,
      },
      'user-pobre': {
        id: 'user-pobre',
        nombre: 'Vecino Sin Puntos',
        email: 'pobre@mail.com',
        rol: 'CITIZEN',
        puntos: 20,
      },
    };

    mockProductos = {
      'prod-termo': {
        id: 'prod-termo',
        titulo: 'Botella Térmica',
        descripcion: 'Botella de acero inoxidable',
        costoPuntos: 100,
        stock: 5,
        activo: true,
      },
      'prod-unico': {
        id: 'prod-unico',
        titulo: 'Termo Sustentable Edición Limitada',
        descripcion: 'Última unidad disponible',
        costoPuntos: 150,
        stock: 1,
        activo: true,
      },
      'prod-inactivo': {
        id: 'prod-inactivo',
        titulo: 'Bolsa Descontinuada',
        costoPuntos: 40,
        stock: 10,
        activo: false,
      },
    };

    mockSucursales = {
      'suc-pilar': {
        id: 'suc-pilar',
        nombre: 'Palacio Municipal de Pilar',
        direccion: 'Rivadavia 660, Pilar Centro',
        horario: 'Lunes a Viernes de 08:00 a 15:00 hs',
        activa: true,
      },
    };

    mockCanjes = {};

    // Mock de prisma
    (prisma as any).$transaction = async (callback: any) => {
      const tx = {
        user: {
          findUnique: async ({ where }: any) => {
            return mockUsers[where.id] ? { ...mockUsers[where.id] } : null;
          },
          update: async ({ where, data }: any) => {
            const user = mockUsers[where.id];
            if (!user) throw new Error('User not found');
            if (data.puntos?.decrement) {
              user.puntos -= data.puntos.decrement;
            }
            return { ...user };
          },
        },
        producto: {
          findUnique: async ({ where }: any) => {
            return mockProductos[where.id] ? { ...mockProductos[where.id] } : null;
          },
          update: async ({ where, data }: any) => {
            const prod = mockProductos[where.id];
            if (!prod) throw new Error('Product not found');
            if (data.stock?.decrement) {
              prod.stock -= data.stock.decrement;
            }
            if (data.stock?.increment) {
              prod.stock += data.stock.increment;
            }
            return { ...prod };
          },
        },
        sucursal: {
          findUnique: async ({ where }: any) => {
            return mockSucursales[where.id] ? { ...mockSucursales[where.id] } : null;
          },
        },
        canje: {
          findMany: async ({ where }: any) => {
            const list = Object.values(mockCanjes);
            return list.filter((c: any) => {
              if (where.estado && c.estado !== where.estado) return false;
              if (where.bloqueadoHasta?.lt) {
                return new Date(c.bloqueadoHasta) < where.bloqueadoHasta.lt;
              }
              return true;
            });
          },
          findUnique: async ({ where }: any) => {
            const canje = mockCanjes[where.id];
            return canje ? { ...canje } : null;
          },
          create: async ({ data }: any) => {
            const id = `canje-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const items = (data.items?.create || []).map((it: any, idx: number) => ({
              id: `item-${idx}`,
              productoId: it.productoId,
              cantidad: it.cantidad,
              puntosUnit: it.puntosUnit,
              producto: mockProductos[it.productoId],
            }));
            const created = {
              id,
              ...data,
              items,
              creadoEn: new Date(),
            };
            mockCanjes[id] = created;
            return { ...created };
          },
          update: async ({ where, data }: any) => {
            const canje = mockCanjes[where.id];
            if (!canje) throw new Error('Canje not found');
            Object.assign(canje, data);
            return {
              ...canje,
              sucursal: canje.sucursalId ? mockSucursales[canje.sucursalId] : null,
            };
          },
        },
      };
      return await callback(tx);
    };
  });

  it('US3: Reserva temporal descuenta stock preventivamente y fija bloqueadoHasta a +5 minutos', async () => {
    const req: any = {
      body: {
        ciudadanoId: 'user-1',
        items: [{ productoId: 'prod-termo', cantidad: 2 }],
      },
    };
    const res = createMockResponse();

    await reservarCanje(req as Request, res as any);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.tiempoRestanteSegundos, 300);
    assert.equal(mockProductos['prod-termo'].stock, 3); // 5 - 2 = 3
    assert.equal(res.body.data.estado, 'RESERVADO_PENDIENTE');

    const tiempoDiff = new Date(res.body.bloqueadoHasta).getTime() - Date.now();
    assert.ok(tiempoDiff > 295000 && tiempoDiff <= 300000);
  });

  it('US3: Rechaza reserva con 409 Conflict si la cantidad solicitada supera el stock disponible', async () => {
    const req: any = {
      body: {
        ciudadanoId: 'user-1',
        items: [{ productoId: 'prod-unico', cantidad: 2 }], // stock es solo 1
      },
    };
    const res = createMockResponse();

    await reservarCanje(req as Request, res as any);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Stock insuficiente/);
    assert.equal(mockProductos['prod-unico'].stock, 1); // No descontado
  });

  it('US3: Rechaza reserva con 400 Bad Request si el ciudadano no tiene saldo de puntos suficiente', async () => {
    const req: any = {
      body: {
        ciudadanoId: 'user-pobre', // tiene 20 pts
        items: [{ productoId: 'prod-termo', cantidad: 1 }], // cuesta 100 pts
      },
    };
    const res = createMockResponse();

    await reservarCanje(req as Request, res as any);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Puntos insuficientes/);
    assert.equal(mockProductos['prod-termo'].stock, 5); // No descontado
  });

  it('US3: Cancelación manual de la reserva restituye el stock y pasa a CANCELADO', async () => {
    // 1. Crear reserva
    const reqReserva: any = {
      body: {
        ciudadanoId: 'user-1',
        items: [{ productoId: 'prod-unico', cantidad: 1 }],
      },
    };
    const resReserva = createMockResponse();
    await reservarCanje(reqReserva as Request, resReserva as any);
    assert.equal(mockProductos['prod-unico'].stock, 0);

    const canjeId = resReserva.body.data.id;

    // 2. Cancelar reserva
    const reqCanc: any = { params: { id: canjeId } };
    const resCanc = createMockResponse();
    await cancelarReserva(reqCanc as Request, resCanc as any);

    assert.equal(resCanc.statusCode, 200);
    assert.equal(resCanc.body.success, true);
    assert.equal(mockProductos['prod-unico'].stock, 1); // Restituido
    assert.equal(mockCanjes[canjeId].estado, 'CANCELADO');
  });

  it('US3: Restitución automática del stock al expirar la reserva de 5 minutos (TTL)', async () => {
    // 1. Crear reserva
    const reqReserva: any = {
      body: {
        ciudadanoId: 'user-1',
        items: [{ productoId: 'prod-unico', cantidad: 1 }],
      },
    };
    const resReserva = createMockResponse();
    await reservarCanje(reqReserva as Request, resReserva as any);
    const canjeId = resReserva.body.data.id;
    assert.equal(mockProductos['prod-unico'].stock, 0);

    // 2. Simular paso del tiempo: cambiar bloqueadoHasta a 6 minutos en el pasado
    mockCanjes[canjeId].bloqueadoHasta = new Date(Date.now() - 6 * 60 * 1000);

    // 3. Intentar confirmar con la reserva expirada
    const reqConf: any = {
      params: { id: canjeId },
      body: { sucursalId: 'suc-pilar', ciudadanoId: 'user-1' },
    };
    const resConf = createMockResponse();
    await confirmarCanje(reqConf as Request, resConf as any);

    assert.equal(resConf.statusCode, 410); // 410 Gone
    assert.match(resConf.body.message, /ha expirado/);
    assert.equal(mockProductos['prod-unico'].stock, 1); // Restituido automáticamente
    assert.equal(mockCanjes[canjeId].estado, 'CANCELADO');
    assert.equal(mockUsers['user-1'].puntos, 300); // Puntos intactos
  });

  it('US3: Confirmación exitosa genera voucher ECO-2026-XXXX, descuenta puntos y fija 30 días de vigencia', async () => {
    // 1. Crear reserva
    const reqReserva: any = {
      body: {
        ciudadanoId: 'user-1',
        items: [{ productoId: 'prod-termo', cantidad: 2 }], // 2 * 100 = 200 pts
      },
    };
    const resReserva = createMockResponse();
    await reservarCanje(reqReserva as Request, resReserva as any);
    const canjeId = resReserva.body.data.id;

    // 2. Confirmar canje
    const reqConf: any = {
      params: { id: canjeId },
      body: { sucursalId: 'suc-pilar', ciudadanoId: 'user-1' },
    };
    const resConf = createMockResponse();
    await confirmarCanje(reqConf as Request, resConf as any);

    assert.equal(resConf.statusCode, 200);
    assert.equal(resConf.body.success, true);
    assert.match(resConf.body.codigoRetiro, /^ECO-2026-[A-Z0-9]{4}$/);
    assert.equal(resConf.body.nuevoSaldoPuntos, 100); // 300 - 200 = 100
    assert.equal(mockUsers['user-1'].puntos, 100);

    // Validar fecha de expiración (+30 días)
    const diffDias = Math.round(
      (new Date(resConf.body.fechaExpiracion).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    assert.equal(diffDias, 30);
    assert.match(resConf.body.avisoDisponibilidad, /48 hs/);
    assert.equal(mockCanjes[canjeId].estado, 'PENDIENTE_RETIRO');
  });
});
