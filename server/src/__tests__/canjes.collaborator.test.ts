// server/src/__tests__/canjes.collaborator.test.ts

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Request, Response } from 'express';
import {
  prisma,
  getCanjeByCodigo,
  confirmarEntregaCanje,
  procesarCanjesExpirados30Dias,
  procesarCanjesExpiradosEndpoint,
  getCanjesByCiudadano,
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

describe('Módulo 006: Validación de Entrega por Colaborador y Expiración a los 30 Días', () => {
  let mockUsers: Record<string, any> = {};
  let mockProductos: Record<string, any> = {};
  let mockSucursales: Record<string, any> = {};
  let mockCanjes: Record<string, any> = {};
  let transactionCalls = 0;

  beforeEach(() => {
    transactionCalls = 0;
    mockUsers = {
      'user-vecino': {
        id: 'user-vecino',
        nombre: 'Joaquín Vecino',
        email: 'vecino@mail.com',
        rol: 'CITIZEN',
        puntos: 500, // saldo inicial
      },
    };

    mockProductos = {
      'prod-botella': {
        id: 'prod-botella',
        titulo: 'Botella Térmica EcoAlerta',
        descripcion: 'Acero inoxidable 500ml',
        costoPuntos: 100,
        stock: 10,
        activo: true,
      },
      'prod-bolsa': {
        id: 'prod-bolsa',
        titulo: 'Bolsa Ecológica',
        descripcion: 'Algodón orgánico',
        costoPuntos: 40,
        stock: 20,
        activo: true,
      },
    };

    mockSucursales = {
      'suc-pilar': {
        id: 'suc-pilar',
        nombre: 'Palacio Municipal Pilar',
        direccion: 'Rivadavia 660, Pilar Centro',
        horario: 'Lunes a Viernes de 08:00 a 14:00 hs',
        activa: true,
      },
    };

    const ahora = Date.now();

    mockCanjes = {
      'canje-vigente': {
        id: 'canje-vigente',
        codigoRetiro: 'ECO-7894-K',
        totalPuntos: 100,
        estado: 'PENDIENTE_RETIRO',
        fechaExpiracion: new Date(ahora + 20 * 24 * 60 * 60 * 1000), // Vence en 20 días
        fechaEntrega: null,
        ciudadanoId: 'user-vecino',
        sucursalId: 'suc-pilar',
        creadoEn: new Date(ahora - 10 * 24 * 60 * 60 * 1000),
        items: [
          {
            id: 'item-1',
            productoId: 'prod-botella',
            cantidad: 1,
            puntosUnit: 100,
            producto: mockProductos['prod-botella'],
          },
        ],
      },
      'canje-entregado': {
        id: 'canje-entregado',
        codigoRetiro: 'ECO-2026-ENTR',
        totalPuntos: 40,
        estado: 'ENTREGADO',
        fechaExpiracion: new Date(ahora + 10 * 24 * 60 * 60 * 1000),
        fechaEntrega: new Date(ahora - 2 * 24 * 60 * 60 * 1000),
        ciudadanoId: 'user-vecino',
        sucursalId: 'suc-pilar',
        creadoEn: new Date(ahora - 5 * 24 * 60 * 60 * 1000),
        items: [
          {
            id: 'item-2',
            productoId: 'prod-bolsa',
            cantidad: 1,
            puntosUnit: 40,
            producto: mockProductos['prod-bolsa'],
          },
        ],
      },
      'canje-vencido-30d': {
        id: 'canje-vencido-30d',
        codigoRetiro: 'ECO-2026-VENC',
        totalPuntos: 200,
        estado: 'PENDIENTE_RETIRO',
        // Expiró hace 2 días (creado hace 32 días)
        fechaExpiracion: new Date(ahora - 2 * 24 * 60 * 60 * 1000),
        fechaEntrega: null,
        ciudadanoId: 'user-vecino',
        sucursalId: 'suc-pilar',
        creadoEn: new Date(ahora - 32 * 24 * 60 * 60 * 1000),
        items: [
          {
            id: 'item-3',
            productoId: 'prod-botella',
            cantidad: 2, // 2 botellas = 200 pts
            puntosUnit: 100,
            producto: mockProductos['prod-botella'],
          },
        ],
      },
    };

    // Configurar Mock de Prisma
    const txMock = {
      user: {
        findUnique: async ({ where }: any) => {
          return mockUsers[where.id] ? { ...mockUsers[where.id] } : null;
        },
        findFirst: async ({ where }: any) => {
          const list = Object.values(mockUsers);
          return list.find((u: any) => u.id === where?.id || u.email === where?.email) || null;
        },
        update: async ({ where, data }: any) => {
          const u = mockUsers[where.id];
          if (!u) throw new Error('User not found');
          if (data.puntos?.increment) u.puntos += data.puntos.increment;
          if (data.puntos?.decrement) u.puntos -= data.puntos.decrement;
          return { ...u };
        },
      },
      producto: {
        findUnique: async ({ where }: any) => {
          return mockProductos[where.id] ? { ...mockProductos[where.id] } : null;
        },
        update: async ({ where, data }: any) => {
          const prod = mockProductos[where.id];
          if (!prod) throw new Error('Product not found');
          if (data.stock?.increment) prod.stock += data.stock.increment;
          if (data.stock?.decrement) prod.stock -= data.stock.decrement;
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
            if (where?.ciudadanoId && c.ciudadanoId !== where.ciudadanoId) return false;
            if (where?.estado && c.estado !== where.estado) return false;
            if (where?.fechaExpiracion?.lt) {
              return new Date(c.fechaExpiracion) < where.fechaExpiracion.lt;
            }
            return true;
          });
        },
        findUnique: async ({ where }: any) => {
          const c = mockCanjes[where.id];
          if (!c) return null;
          return {
            ...c,
            ciudadano: mockUsers[c.ciudadanoId],
            sucursal: mockSucursales[c.sucursalId],
          };
        },
        findFirst: async ({ where }: any) => {
          const list = Object.values(mockCanjes);
          let match: any = null;

          if (where.OR && Array.isArray(where.OR)) {
            for (const cond of where.OR) {
              if (cond.codigoRetiro) {
                const target = typeof cond.codigoRetiro === 'string' ? cond.codigoRetiro : cond.codigoRetiro.equals;
                match = list.find((c: any) => c.codigoRetiro.toUpperCase() === target?.toUpperCase());
              }
              if (!match && cond.id) {
                match = list.find((c: any) => c.id === cond.id);
              }
              if (match) break;
            }
          } else if (where.codigoRetiro) {
            match = list.find((c: any) => c.codigoRetiro.toUpperCase() === where.codigoRetiro.toUpperCase());
          }

          if (!match) return null;
          return {
            ...match,
            ciudadano: mockUsers[match.ciudadanoId],
            sucursal: mockSucursales[match.sucursalId],
          };
        },
        update: async ({ where, data }: any) => {
          const c = mockCanjes[where.id];
          if (!c) throw new Error('Canje not found');
          Object.assign(c, data);
          return {
            ...c,
            ciudadano: mockUsers[c.ciudadanoId],
            sucursal: mockSucursales[c.sucursalId],
          };
        },
      },
    };

    (prisma as any).$transaction = async (callback: any) => {
      transactionCalls += 1;
      return await callback(txMock);
    };

    // Mock top-level prisma properties
    (prisma as any).canje = txMock.canje;
    (prisma as any).producto = txMock.producto;
    (prisma as any).user = txMock.user;
    (prisma as any).sucursal = txMock.sucursal;
  });

  // --- PRUEBAS US1: Búsqueda y Entrega por Colaborador ---

  it('US1: Búsqueda insensible a mayúsculas/espacios recupera voucher PENDIENTE_RETIRO con datos de vecino y sucursal', async () => {
    const req: any = {
      params: { codigoRetiro: '  eco-7894-k  ' },
    };
    const res = createMockResponse();

    await getCanjeByCodigo(req as Request, res as any);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.codigoRetiro, 'ECO-7894-K');
    assert.equal(res.body.data.estado, 'PENDIENTE_RETIRO');
    assert.equal(res.body.data.ciudadano.nombre, 'Joaquín Vecino');
    assert.equal(res.body.data.sucursal.nombre, 'Palacio Municipal Pilar');
    assert.equal(res.body.data.items.length, 1);
  });

  it('US1: Búsqueda retorna 404 si el código de retiro no existe', async () => {
    const req: any = {
      params: { codigoRetiro: 'ECO-INEXISTENTE' },
    };
    const res = createMockResponse();

    await getCanjeByCodigo(req as Request, res as any);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /No se encontró/);
  });

  it('US1: Confirmación de entrega exitosa pasa orden a ENTREGADO con fechaEntrega', async () => {
    const req: any = {
      params: { codigoRetiro: 'ECO-7894-K' },
    };
    const res = createMockResponse();

    await confirmarEntregaCanje(req as Request, res as any);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.estado, 'ENTREGADO');
    assert.ok(res.body.data.fechaEntrega instanceof Date || typeof res.body.data.fechaEntrega === 'string');
    assert.equal(mockCanjes['canje-vigente'].estado, 'ENTREGADO');
    assert.equal(transactionCalls, 1);
  });

  it('US1: Bloqueo de doble entrega - rechaza con 409 Conflict si el canje ya fue entregado', async () => {
    const req: any = {
      params: { codigoRetiro: 'ECO-2026-ENTR' }, // Ya figura como ENTREGADO
    };
    const res = createMockResponse();

    await confirmarEntregaCanje(req as Request, res as any);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /ya fue entregado anteriormente/);
  });

  // --- PRUEBAS US2: Expiración a los 30 días, Restitución de Stock y Cero Reembolso ---

  it('US2: procesarCanjesExpirados30Dias cancela canjes vencidos, restituye stock físico pero NO devuelve puntos al ciudadano', async () => {
    assert.equal(mockProductos['prod-botella'].stock, 10);
    assert.equal(mockUsers['user-vecino'].puntos, 500);
    assert.equal(mockCanjes['canje-vencido-30d'].estado, 'PENDIENTE_RETIRO');

    // Ejecutar procesamiento de expiración de 30 días
    const cantidadExpirados = await prisma.$transaction(async (tx) => {
      return await procesarCanjesExpirados30Dias(tx);
    });

    assert.equal(cantidadExpirados, 1);
    assert.equal(mockCanjes['canje-vencido-30d'].estado, 'CANCELADO');

    // 1. Stock físico restituido (10 + 2 botellas = 12)
    assert.equal(mockProductos['prod-botella'].stock, 12);

    // 2. REGLA INQUEBRANTABLE (RF-COL-03 y Principio VI): 0 puntos reembolsados
    assert.equal(mockUsers['user-vecino'].puntos, 500); // Intactos, sin aumento
  });

  it('US2: Idempotencia - procesar expiraciones consecutivas no duplica el stock restituido', async () => {
    // Primera ejecución
    await prisma.$transaction(async (tx) => {
      await procesarCanjesExpirados30Dias(tx);
    });
    assert.equal(mockProductos['prod-botella'].stock, 12);

    // Segunda ejecución inmediata
    const segundaPasada = await prisma.$transaction(async (tx) => {
      return await procesarCanjesExpirados30Dias(tx);
    });

    assert.equal(segundaPasada, 0); // No procesa de nuevo
    assert.equal(mockProductos['prod-botella'].stock, 12); // Stock no vuelve a aumentar
    assert.equal(mockUsers['user-vecino'].puntos, 500); // Puntos intactos
  });

  it('US2: Intento de entrega de voucher vencido a los 30 días es bloqueado con 409 Conflict', async () => {
    const req: any = {
      params: { codigoRetiro: 'ECO-2026-VENC' }, // Vencido hace 2 días
    };
    const res = createMockResponse();

    await confirmarEntregaCanje(req as Request, res as any);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /ha expirado/);
  });

  // --- PRUEBAS US3: Consulta de Vouchers por el Ciudadano ---

  it('US3: getCanjesByCiudadano lista vouchers del vecino con aviso de sucursal y estado actualizado tras expiración', async () => {
    const req: any = {
      params: { ciudadanoId: 'user-vecino' },
    };
    const res = createMockResponse();

    await getCanjesByCiudadano(req as Request, res as any);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 3);

    // Comprobar que el voucher vencido ya se listó como CANCELADO
    const voucherVencido = res.body.data.find((c: any) => c.codigoRetiro === 'ECO-2026-VENC');
    assert.ok(voucherVencido);
    assert.equal(voucherVencido.estado, 'CANCELADO');
  });

  it('Endpoint utilitario POST /api/canjes/procesar-expirados responde 200 y reporta cantidad procesada', async () => {
    const req: any = {};
    const res = createMockResponse();

    await procesarCanjesExpiradosEndpoint(req as Request, res as any);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.ok(typeof res.body.expirados === 'number');
    assert.match(res.body.message, /0 puntos reembolsados/);
  });
});
