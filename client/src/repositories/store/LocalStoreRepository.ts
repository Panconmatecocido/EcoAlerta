// client/src/repositories/store/LocalStoreRepository.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ConfirmRedemptionResponse,
  IStoreRepository,
  RedemptionDetail,
  ReservationItem,
  ReservationResponse,
  StoreBranch,
  StoreProduct,
} from './IStoreRepository';

const STORAGE_KEYS = {
  PRODUCTS: '@ecoalerta_local_products',
  BRANCHES: '@ecoalerta_local_branches',
  RESERVATIONS: '@ecoalerta_local_reservations',
};

const DEFAULT_PRODUCTS: StoreProduct[] = [
  {
    id: 'prod-1',
    titulo: 'Bolsa de Tela Reutilizable',
    descripcion: 'Bolsa ecológica de algodón orgánico para compras diarias.',
    costoPuntos: 40,
    stock: 50,
    activo: true,
    imagenUrl: 'https://images.unsplash.com/photo-1597484661643-2f5f74293e41?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'prod-2',
    titulo: 'Botella Térmica EcoAlerta',
    descripcion: 'Botella térmica de acero inoxidable 500ml libre de BPA.',
    costoPuntos: 100,
    stock: 20,
    activo: true,
    imagenUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'prod-3',
    titulo: 'Gorra Oficial EcoAlerta',
    descripcion: 'Gorra sustentable confeccionada con materiales reciclados.',
    costoPuntos: 80,
    stock: 15,
    activo: true,
    imagenUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'prod-4',
    titulo: 'Compostera Domiciliaria 20L',
    descripcion: 'Compostera compacta aireada para tratamiento de residuos orgánicos.',
    costoPuntos: 250,
    stock: 10,
    activo: true,
    imagenUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=300&q=80',
  },
];

const DEFAULT_BRANCHES: StoreBranch[] = [
  {
    id: 'suc-1',
    nombre: 'Palacio Municipal de Pilar',
    direccion: 'Rivadavia 660, Pilar Centro',
    horario: 'Lunes a Viernes de 08:00 a 15:00 hs',
    activa: true,
  },
  {
    id: 'suc-2',
    nombre: 'Delegación Municipal Presidente Derqui',
    direccion: 'Av. De Mayo 450, Derqui',
    horario: 'Lunes a Viernes de 08:00 a 14:00 hs',
    activa: true,
  },
];

const DEFAULT_RESERVATIONS: LocalReservation[] = [
  {
    id: 'canje-demo-1',
    codigoRetiro: 'ECO-7894-K',
    totalPuntos: 100,
    bloqueadoHasta: new Date().toISOString(),
    ciudadanoId: 'user-1',
    estado: 'PENDIENTE_RETIRO',
    items: [{ productoId: 'prod-2', cantidad: 1, puntosUnit: 100 }],
    sucursalId: 'suc-1',
    fechaExpiracion: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    creadoEn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'canje-demo-2',
    codigoRetiro: 'ECO-2026-ENTR',
    totalPuntos: 40,
    bloqueadoHasta: new Date().toISOString(),
    ciudadanoId: 'user-1',
    estado: 'ENTREGADO',
    items: [{ productoId: 'prod-1', cantidad: 1, puntosUnit: 40 }],
    sucursalId: 'suc-1',
    fechaExpiracion: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    fechaEntrega: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    creadoEn: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'canje-demo-3',
    codigoRetiro: 'ECO-2026-EXPD',
    totalPuntos: 80,
    bloqueadoHasta: new Date().toISOString(),
    ciudadanoId: 'user-1',
    estado: 'CANCELADO',
    items: [{ productoId: 'prod-3', cantidad: 1, puntosUnit: 80 }],
    sucursalId: 'suc-2',
    fechaExpiracion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    creadoEn: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

interface LocalReservation {
  id: string;
  codigoRetiro: string;
  totalPuntos: number;
  bloqueadoHasta: string;
  ciudadanoId: string;
  estado: 'RESERVADO_PENDIENTE' | 'PENDIENTE_RETIRO' | 'ENTREGADO' | 'CANCELADO';
  items: Array<{ productoId: string; cantidad: number; puntosUnit: number }>;
  sucursalId?: string;
  fechaExpiracion?: string;
  fechaEntrega?: string;
  creadoEn?: string;
}

export class LocalStoreRepository implements IStoreRepository {
  private async getStoredProducts(): Promise<StoreProduct[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) {
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    return JSON.parse(data);
  }

  private async saveStoredProducts(products: StoreProduct[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  private async getStoredBranches(): Promise<StoreBranch[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BRANCHES);
    if (!data) {
      await AsyncStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(DEFAULT_BRANCHES));
      return DEFAULT_BRANCHES;
    }
    return JSON.parse(data);
  }

  private async saveStoredBranches(branches: StoreBranch[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
  }

  private async getStoredReservations(): Promise<LocalReservation[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    if (!data) {
      await AsyncStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(DEFAULT_RESERVATIONS));
      return DEFAULT_RESERVATIONS;
    }
    return JSON.parse(data);
  }

  private async saveStoredReservations(reservations: LocalReservation[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
  }

  // Liberar reservas locales vencidas (TTL 5 min)
  private async cleanupExpiredReservations(): Promise<void> {
    const reservations = await this.getStoredReservations();
    const products = await this.getStoredProducts();
    const now = Date.now();
    let changed = false;

    for (const res of reservations) {
      if (res.estado === 'RESERVADO_PENDIENTE' && new Date(res.bloqueadoHasta).getTime() < now) {
        res.estado = 'CANCELADO';
        changed = true;
        for (const item of res.items) {
          const prod = products.find((p) => p.id === item.productoId);
          if (prod) {
            prod.stock += item.cantidad;
          }
        }
      }
    }

    if (changed) {
      await this.saveStoredReservations(reservations);
      await this.saveStoredProducts(products);
    }
  }

  async getProducts(params?: { busqueda?: string }): Promise<StoreProduct[]> {
    await this.cleanupExpiredReservations();
    const products = await this.getStoredProducts();
    let filtered = products.filter((p) => p.activo);

    if (params?.busqueda && params.busqueda.trim() !== '') {
      const q = params.busqueda.trim().toLowerCase();
      filtered = filtered.filter(
        (p) => p.titulo.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q)
      );
    }

    return filtered;
  }

  async getProductsAdmin(params?: { busqueda?: string }): Promise<StoreProduct[]> {
    const products = await this.getStoredProducts();
    let filtered = products;

    if (params?.busqueda && params.busqueda.trim() !== '') {
      const q = params.busqueda.trim().toLowerCase();
      filtered = filtered.filter(
        (p) => p.titulo.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q)
      );
    }

    return filtered;
  }

  async createProduct(producto: Partial<StoreProduct>): Promise<StoreProduct> {
    const products = await this.getStoredProducts();
    const newProduct: StoreProduct = {
      id: `prod-${Date.now()}`,
      titulo: producto.titulo || 'Nuevo Insumo',
      descripcion: producto.descripcion || '',
      costoPuntos: Number(producto.costoPuntos) || 0,
      stock: Number(producto.stock) || 0,
      imagenUrl: producto.imagenUrl || null,
      activo: true,
      creadoEn: new Date().toISOString(),
    };
    products.unshift(newProduct);
    await this.saveStoredProducts(products);
    return newProduct;
  }

  async updateProduct(id: string, producto: Partial<StoreProduct>): Promise<StoreProduct> {
    const products = await this.getStoredProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Producto no encontrado');

    const updated = {
      ...products[idx],
      ...producto,
    };
    products[idx] = updated;
    await this.saveStoredProducts(products);
    return updated;
  }

  async deactivateProduct(id: string): Promise<StoreProduct> {
    return await this.updateProduct(id, { activo: false });
  }

  async getBranches(params?: { todas?: boolean }): Promise<StoreBranch[]> {
    const branches = await this.getStoredBranches();
    if (params?.todas) return branches;
    return branches.filter((b) => b.activa);
  }

  async createBranch(branch: Partial<StoreBranch>): Promise<StoreBranch> {
    const branches = await this.getStoredBranches();
    const newBranch: StoreBranch = {
      id: `suc-${Date.now()}`,
      nombre: branch.nombre || 'Nueva Delegación',
      direccion: branch.direccion || '',
      horario: branch.horario || 'Lunes a Viernes de 08:00 a 14:00 hs',
      activa: true,
    };
    branches.push(newBranch);
    await this.saveStoredBranches(branches);
    return newBranch;
  }

  async updateBranch(id: string, branch: Partial<StoreBranch>): Promise<StoreBranch> {
    const branches = await this.getStoredBranches();
    const idx = branches.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Sucursal no encontrada');

    const updated = {
      ...branches[idx],
      ...branch,
    };
    branches[idx] = updated;
    await this.saveStoredBranches(branches);
    return updated;
  }

  async reserveCart(ciudadanoId: string, items: ReservationItem[]): Promise<ReservationResponse> {
    await this.cleanupExpiredReservations();
    const products = await this.getStoredProducts();

    let totalPuntos = 0;
    const itemsDetalle: Array<{ productoId: string; cantidad: number; puntosUnit: number }> = [];

    for (const item of items) {
      const prod = products.find((p) => p.id === item.productoId);
      if (!prod || !prod.activo) {
        throw new Error(`Producto ${item.productoId} no disponible`);
      }
      if (prod.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para ${prod.titulo}`);
      }
      totalPuntos += prod.costoPuntos * item.cantidad;
      itemsDetalle.push({
        productoId: prod.id,
        cantidad: item.cantidad,
        puntosUnit: prod.costoPuntos,
      });
      prod.stock -= item.cantidad;
    }

    await this.saveStoredProducts(products);

    const bloqueadoHasta = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const canjeId = `canje-${Date.now()}`;
    const codigoTemporal = `RES-${Date.now().toString().slice(-4)}`;

    const nuevaReserva: LocalReservation = {
      id: canjeId,
      codigoRetiro: codigoTemporal,
      totalPuntos,
      bloqueadoHasta,
      ciudadanoId,
      estado: 'RESERVADO_PENDIENTE',
      items: itemsDetalle,
    };

    const reservations = await this.getStoredReservations();
    reservations.push(nuevaReserva);
    await this.saveStoredReservations(reservations);

    return {
      canjeId,
      codigoRetiro: codigoTemporal,
      totalPuntos,
      bloqueadoHasta,
      tiempoRestanteSegundos: 300,
      items: itemsDetalle,
    };
  }

  async cancelReservation(canjeId: string): Promise<void> {
    const reservations = await this.getStoredReservations();
    const res = reservations.find((r) => r.id === canjeId);
    if (!res || res.estado !== 'RESERVADO_PENDIENTE') return;

    const products = await this.getStoredProducts();
    for (const item of res.items) {
      const prod = products.find((p) => p.id === item.productoId);
      if (prod) prod.stock += item.cantidad;
    }

    res.estado = 'CANCELADO';
    await this.saveStoredReservations(reservations);
    await this.saveStoredProducts(products);
  }

  async confirmRedemption(
    canjeId: string,
    sucursalId: string,
    _ciudadanoId?: string
  ): Promise<ConfirmRedemptionResponse> {
    const reservations = await this.getStoredReservations();
    const res = reservations.find((r) => r.id === canjeId);
    if (!res) throw new Error('Reserva no encontrada');

    if (new Date(res.bloqueadoHasta).getTime() < Date.now()) {
      await this.cancelReservation(canjeId);
      throw new Error('El tiempo de reserva de 5 minutos ha expirado. Por favor, reinicia el canje.');
    }

    const branches = await this.getStoredBranches();
    const branch = branches.find((b) => b.id === sucursalId) || branches[0];

    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    const codigoRetiroOficial = `ECO-2026-${rand}`;
    const fechaExpiracion = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    res.estado = 'PENDIENTE_RETIRO';
    res.codigoRetiro = codigoRetiroOficial;
    res.sucursalId = branch.id;
    res.fechaExpiracion = fechaExpiracion;
    res.creadoEn = new Date().toISOString();

    await this.saveStoredReservations(reservations);

    return {
      canjeId: res.id,
      codigoRetiro: codigoRetiroOficial,
      nuevoSaldoPuntos: 0,
      fechaExpiracion,
      avisoDisponibilidad: 'Disponible a partir de 48 hs hábiles',
      sucursal: branch,
    };
  }

  async getUserRedemptions(ciudadanoId: string): Promise<any[]> {
    return await this.getCitizenRedemptions(ciudadanoId);
  }

  // --- Módulo 006: Métodos de Entrega, Búsqueda y Expiración 30 días ---

  private async cleanupExpired30DaysRedemptions(): Promise<void> {
    const reservations = await this.getStoredReservations();
    const products = await this.getStoredProducts();
    const now = Date.now();
    let changed = false;

    for (const res of reservations) {
      if (
        res.estado === 'PENDIENTE_RETIRO' &&
        res.fechaExpiracion &&
        new Date(res.fechaExpiracion).getTime() < now
      ) {
        res.estado = 'CANCELADO';
        changed = true;
        // Restituir stock físico (Principio VI y RF-COL-03: sin devolución de puntos)
        for (const item of res.items) {
          const prod = products.find((p) => p.id === item.productoId);
          if (prod) {
            prod.stock += item.cantidad;
          }
        }
      }
    }

    if (changed) {
      await this.saveStoredReservations(reservations);
      await this.saveStoredProducts(products);
    }
  }

  private async mapToRedemptionDetail(
    res: LocalReservation,
    branches?: StoreBranch[],
    products?: StoreProduct[]
  ): Promise<RedemptionDetail> {
    const allBranches = branches || (await this.getStoredBranches());
    const allProducts = products || (await this.getStoredProducts());
    const branch = allBranches.find((b) => b.id === res.sucursalId) || allBranches[0];

    return {
      id: res.id,
      codigoRetiro: res.codigoRetiro,
      totalPuntos: res.totalPuntos,
      estado: res.estado,
      fechaExpiracion: res.fechaExpiracion || null,
      fechaEntrega: res.fechaEntrega || null,
      creadoEn: res.creadoEn || new Date().toISOString(),
      ciudadano: {
        id: res.ciudadanoId,
        nombre: 'Vecino EcoAlerta',
        email: 'vecino@ecoalerta.gob.ar',
      },
      sucursal: branch
        ? {
            id: branch.id,
            nombre: branch.nombre,
            direccion: branch.direccion,
            horario: branch.horario,
          }
        : undefined,
      items: res.items.map((it) => {
        const prod = allProducts.find((p) => p.id === it.productoId);
        return {
          id: `item-${it.productoId}`,
          cantidad: it.cantidad,
          puntosUnit: it.puntosUnit,
          producto: prod
            ? {
                id: prod.id,
                titulo: prod.titulo,
                descripcion: prod.descripcion,
                costoPuntos: prod.costoPuntos,
                imagenUrl: prod.imagenUrl,
              }
            : undefined,
        };
      }),
    };
  }

  async getRedemptionByCode(codigoRetiro: string): Promise<RedemptionDetail> {
    await this.cleanupExpired30DaysRedemptions();
    const reservations = await this.getStoredReservations();
    const codigoNormalizado = codigoRetiro.trim().toUpperCase();

    const res = reservations.find(
      (r) =>
        r.codigoRetiro.trim().toUpperCase() === codigoNormalizado ||
        r.id === codigoRetiro
    );

    if (!res) {
      throw new Error(`No se encontró ningún canje con el código ${codigoNormalizado}`);
    }

    return await this.mapToRedemptionDetail(res);
  }

  async confirmDelivery(codigoRetiro: string): Promise<RedemptionDetail> {
    await this.cleanupExpired30DaysRedemptions();
    const reservations = await this.getStoredReservations();
    const codigoNormalizado = codigoRetiro.trim().toUpperCase();

    const res = reservations.find(
      (r) =>
        r.codigoRetiro.trim().toUpperCase() === codigoNormalizado ||
        r.id === codigoRetiro
    );

    if (!res) {
      throw new Error('Canje no encontrado');
    }

    if (res.estado === 'ENTREGADO') {
      throw new Error('Este premio ya fue entregado anteriormente');
    }

    const ahora = Date.now();
    if (
      res.estado === 'CANCELADO' ||
      (res.fechaExpiracion && new Date(res.fechaExpiracion).getTime() < ahora)
    ) {
      throw new Error('El código de retiro ha expirado (plazo de 30 días vencido)');
    }

    if (res.estado !== 'PENDIENTE_RETIRO') {
      throw new Error(`El canje no puede entregarse en estado ${res.estado}`);
    }

    res.estado = 'ENTREGADO';
    res.fechaEntrega = new Date().toISOString();

    await this.saveStoredReservations(reservations);
    return await this.mapToRedemptionDetail(res);
  }

  async getCitizenRedemptions(ciudadanoId: string): Promise<RedemptionDetail[]> {
    await this.cleanupExpired30DaysRedemptions();
    const reservations = await this.getStoredReservations();
    const branches = await this.getStoredBranches();
    const products = await this.getStoredProducts();

    const citizenRes = reservations.filter(
      (r) => r.ciudadanoId === ciudadanoId || ciudadanoId === 'demo-user-1'
    );

    const result: RedemptionDetail[] = [];
    for (const r of citizenRes) {
      result.push(await this.mapToRedemptionDetail(r, branches, products));
    }

    // Ordenar descendente por creadoEn
    return result.sort((a, b) => {
      const timeA = a.creadoEn ? new Date(a.creadoEn).getTime() : 0;
      const timeB = b.creadoEn ? new Date(b.creadoEn).getTime() : 0;
      return timeB - timeA;
    });
  }
}
