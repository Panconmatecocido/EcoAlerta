// client/src/repositories/store/RemoteStoreRepository.ts

import { api } from '../../services/api';
import {
  ConfirmRedemptionResponse,
  IStoreRepository,
  RedemptionDetail,
  ReservationItem,
  ReservationResponse,
  StoreBranch,
  StoreProduct,
} from './IStoreRepository';

const mapearProductoServidor = (raw: any): StoreProduct => ({
  id: String(raw.id),
  titulo: raw.titulo || raw.nombre || 'Insumo Ecológico',
  descripcion: raw.descripcion || '',
  costoPuntos: typeof raw.costoPuntos === 'number' ? raw.costoPuntos : (raw.precio || 0),
  stock: typeof raw.stock === 'number' ? raw.stock : 0,
  imagenUrl: raw.imagenUrl || raw.urlImagen || null,
  activo: raw.activo !== undefined ? Boolean(raw.activo) : true,
  municipioId: raw.municipioId,
  creadoEn: raw.creadoEn,
});

const mapearSucursalServidor = (raw: any): StoreBranch => ({
  id: String(raw.id),
  nombre: raw.nombre || 'Sucursal Municipal',
  direccion: raw.direccion || '',
  horario: raw.horario || null,
  activa: raw.activa !== undefined ? Boolean(raw.activa) : true,
  municipioId: raw.municipioId,
});

const mapearCanjeServidor = (raw: any): RedemptionDetail => ({
  id: String(raw.id),
  codigoRetiro: raw.codigoRetiro || '',
  totalPuntos: raw.totalPuntos || 0,
  estado: raw.estado || 'PENDIENTE_RETIRO',
  fechaExpiracion: raw.fechaExpiracion || null,
  fechaEntrega: raw.fechaEntrega || null,
  creadoEn: raw.creadoEn || null,
  ciudadano: raw.ciudadano
    ? {
        id: raw.ciudadano.id,
        nombre: raw.ciudadano.nombre,
        email: raw.ciudadano.email,
      }
    : undefined,
  sucursal: raw.sucursal ? mapearSucursalServidor(raw.sucursal) : undefined,
  items: Array.isArray(raw.items)
    ? raw.items.map((it: any) => ({
        id: String(it.id),
        cantidad: it.cantidad || 1,
        puntosUnit: it.puntosUnit,
        producto: it.producto ? mapearProductoServidor(it.producto) : undefined,
      }))
    : [],
});

export class RemoteStoreRepository implements IStoreRepository {
  async getProducts(params?: { busqueda?: string; municipioId?: string }): Promise<StoreProduct[]> {
    const query = new URLSearchParams();
    if (params?.busqueda) query.append('busqueda', params.busqueda);
    if (params?.municipioId) query.append('municipioId', params.municipioId);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get<{ success: boolean; data: any[] }>(`/api/productos${queryString}`);
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map(mapearProductoServidor);
  }

  async getProductsAdmin(params?: { busqueda?: string; municipioId?: string }): Promise<StoreProduct[]> {
    const query = new URLSearchParams();
    if (params?.busqueda) query.append('busqueda', params.busqueda);
    if (params?.municipioId) query.append('municipioId', params.municipioId);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get<{ success: boolean; data: any[] }>(`/api/productos/admin${queryString}`);
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map(mapearProductoServidor);
  }

  async createProduct(producto: Partial<StoreProduct>): Promise<StoreProduct> {
    const res = await api.post<{ success: boolean; data: any }>('/api/productos', producto);
    return mapearProductoServidor(res.data);
  }

  async updateProduct(id: string, producto: Partial<StoreProduct>): Promise<StoreProduct> {
    const res = await api.put<{ success: boolean; data: any }>(`/api/productos/${id}`, producto);
    return mapearProductoServidor(res.data);
  }

  async deactivateProduct(id: string): Promise<StoreProduct> {
    const res = await api.delete<{ success: boolean; data: any }>(`/api/productos/${id}`);
    return mapearProductoServidor(res.data);
  }

  async getBranches(params?: { municipioId?: string; todas?: boolean }): Promise<StoreBranch[]> {
    const query = new URLSearchParams();
    if (params?.municipioId) query.append('municipioId', params.municipioId);
    if (params?.todas) query.append('todas', 'true');

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get<{ success: boolean; data: any[] }>(`/api/sucursales${queryString}`);
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map(mapearSucursalServidor);
  }

  async createBranch(branch: Partial<StoreBranch>): Promise<StoreBranch> {
    const res = await api.post<{ success: boolean; data: any }>('/api/sucursales', branch);
    return mapearSucursalServidor(res.data);
  }

  async updateBranch(id: string, branch: Partial<StoreBranch>): Promise<StoreBranch> {
    const res = await api.put<{ success: boolean; data: any }>(`/api/sucursales/${id}`, branch);
    return mapearSucursalServidor(res.data);
  }

  async reserveCart(ciudadanoId: string, items: ReservationItem[]): Promise<ReservationResponse> {
    const res = await api.post<{
      success: boolean;
      data: any;
      tiempoRestanteSegundos: number;
      bloqueadoHasta: string;
    }>('/api/canjes/reservar', { ciudadanoId, items });

    return {
      canjeId: res.data.id,
      codigoRetiro: res.data.codigoRetiro,
      totalPuntos: res.data.totalPuntos,
      bloqueadoHasta: res.bloqueadoHasta || res.data.bloqueadoHasta,
      tiempoRestanteSegundos: res.tiempoRestanteSegundos || 300,
      items: res.data.items || [],
    };
  }

  async cancelReservation(canjeId: string): Promise<void> {
    await api.post(`/api/canjes/${canjeId}/cancelar-reserva`);
  }

  async confirmRedemption(
    canjeId: string,
    sucursalId: string,
    ciudadanoId?: string
  ): Promise<ConfirmRedemptionResponse> {
    const res = await api.post<{
      success: boolean;
      data: any;
      nuevoSaldoPuntos: number;
      codigoRetiro: string;
      fechaExpiracion: string;
      sucursal: any;
      avisoDisponibilidad: string;
    }>(`/api/canjes/${canjeId}/confirmar`, { sucursalId, ciudadanoId });

    return {
      canjeId: res.data.id || canjeId,
      codigoRetiro: res.codigoRetiro || res.data.codigoRetiro,
      nuevoSaldoPuntos: res.nuevoSaldoPuntos,
      fechaExpiracion: res.fechaExpiracion || res.data.fechaExpiracion,
      avisoDisponibilidad: res.avisoDisponibilidad || 'Disponible a partir de 48 hs hábiles',
      sucursal: mapearSucursalServidor(res.sucursal || res.data.sucursal),
    };
  }

  async getUserRedemptions(ciudadanoId: string): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>(`/api/canjes/ciudadano/${ciudadanoId}`);
    return Array.isArray(res) ? res : res.data || [];
  }

  // Métodos Módulo 006:
  async getRedemptionByCode(codigoRetiro: string): Promise<RedemptionDetail> {
    const res = await api.get<{ success: boolean; data: any }>(
      `/api/canjes/codigo/${encodeURIComponent(codigoRetiro.trim().toUpperCase())}`
    );
    const data = (res as any).data || res;
    return mapearCanjeServidor(data);
  }

  async confirmDelivery(codigoRetiro: string): Promise<RedemptionDetail> {
    const res = await api.patch<{ success: boolean; data: any; message?: string }>(
      `/api/canjes/${encodeURIComponent(codigoRetiro.trim().toUpperCase())}/entregar`,
      {}
    );
    const data = (res as any).data || res;
    return mapearCanjeServidor(data);
  }

  async getCitizenRedemptions(ciudadanoId: string): Promise<RedemptionDetail[]> {
    const res = await api.get<{ success: boolean; data: any[] }>(`/api/canjes/ciudadano/${ciudadanoId}`);
    const items = Array.isArray(res) ? res : res.data || [];
    return items.map(mapearCanjeServidor);
  }
}
