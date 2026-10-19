// client/src/repositories/store/IStoreRepository.ts

export interface StoreProduct {
  id: string;
  titulo: string;
  descripcion: string;
  costoPuntos: number;
  stock: number;
  imagenUrl?: string | null;
  activo: boolean;
  municipioId?: string;
  creadoEn?: string;
}

export interface StoreBranch {
  id: string;
  nombre: string;
  direccion: string;
  horario?: string | null;
  activa: boolean;
  municipioId?: string;
}

export interface ReservationItem {
  productoId: string;
  cantidad: number;
}

export interface ReservationResponse {
  canjeId: string;
  codigoRetiro: string;
  totalPuntos: number;
  bloqueadoHasta: string;
  tiempoRestanteSegundos: number;
  items: any[];
}

export interface ConfirmRedemptionResponse {
  canjeId: string;
  codigoRetiro: string; // Formato ECO-2026-XXXX
  nuevoSaldoPuntos: number;
  fechaExpiracion: string; // +30 días corridos
  avisoDisponibilidad: string; // Disponible a partir de 48 hs hábiles
  sucursal: StoreBranch;
}

export interface RedemptionDetail {
  id: string;
  codigoRetiro: string;
  totalPuntos: number;
  estado: 'PENDIENTE_RETIRO' | 'ENTREGADO' | 'CANCELADO' | 'RESERVADO_PENDIENTE' | string;
  fechaExpiracion?: string | null;
  fechaEntrega?: string | null;
  creadoEn?: string | null;
  ciudadano?: {
    id?: string;
    nombre?: string;
    email?: string;
  };
  sucursal?: {
    id?: string;
    nombre?: string;
    direccion?: string;
    horario?: string | null;
  };
  items: Array<{
    id?: string;
    cantidad: number;
    puntosUnit?: number;
    producto?: {
      id?: string;
      titulo?: string;
      descripcion?: string;
      costoPuntos?: number;
      imagenUrl?: string | null;
    };
  }>;
}

export interface IStoreRepository {
  getProducts(params?: { busqueda?: string; municipioId?: string }): Promise<StoreProduct[]>;
  getProductsAdmin(params?: { busqueda?: string; municipioId?: string }): Promise<StoreProduct[]>;
  createProduct(producto: Partial<StoreProduct>): Promise<StoreProduct>;
  updateProduct(id: string, producto: Partial<StoreProduct>): Promise<StoreProduct>;
  deactivateProduct(id: string): Promise<StoreProduct>;
  getBranches(params?: { municipioId?: string; todas?: boolean }): Promise<StoreBranch[]>;
  createBranch(branch: Partial<StoreBranch>): Promise<StoreBranch>;
  updateBranch(id: string, branch: Partial<StoreBranch>): Promise<StoreBranch>;
  reserveCart(ciudadanoId: string, items: ReservationItem[]): Promise<ReservationResponse>;
  cancelReservation(canjeId: string): Promise<void>;
  confirmRedemption(canjeId: string, sucursalId: string, ciudadanoId?: string): Promise<ConfirmRedemptionResponse>;
  getUserRedemptions(ciudadanoId: string): Promise<any[]>;
  // Métodos Módulo 006:
  getRedemptionByCode(codigoRetiro: string): Promise<RedemptionDetail>;
  confirmDelivery(codigoRetiro: string): Promise<RedemptionDetail>;
  getCitizenRedemptions(ciudadanoId: string): Promise<RedemptionDetail[]>;
}
