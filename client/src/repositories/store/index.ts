// client/src/repositories/store/index.ts

import {
  ConfirmRedemptionResponse,
  IStoreRepository,
  RedemptionDetail,
  ReservationItem,
  ReservationResponse,
  StoreBranch,
  StoreProduct,
} from './IStoreRepository';
import { RemoteStoreRepository } from './RemoteStoreRepository';

const remoteStoreRepo = new RemoteStoreRepository();

/**
 * storeRepository (Fase 2):
 * Conexión exclusiva con la Base de Datos PostgreSQL (Supabase) vía Express REST API.
 * Se elimina el fallback local para garantizar que todos los datos provengan de la base de datos
 * y los estados o errores del servidor se reflejen fielmente en la interfaz de usuario.
 */
export const storeRepository: IStoreRepository = {
  getProducts(params?: { busqueda?: string; municipioId?: string }): Promise<StoreProduct[]> {
    return remoteStoreRepo.getProducts(params);
  },

  getProductsAdmin(params?: { busqueda?: string; municipioId?: string }): Promise<StoreProduct[]> {
    return remoteStoreRepo.getProductsAdmin(params);
  },

  createProduct(producto: Partial<StoreProduct>): Promise<StoreProduct> {
    return remoteStoreRepo.createProduct(producto);
  },

  updateProduct(id: string, producto: Partial<StoreProduct>): Promise<StoreProduct> {
    return remoteStoreRepo.updateProduct(id, producto);
  },

  deactivateProduct(id: string): Promise<StoreProduct> {
    return remoteStoreRepo.deactivateProduct(id);
  },

  getBranches(params?: { municipioId?: string; todas?: boolean }): Promise<StoreBranch[]> {
    return remoteStoreRepo.getBranches(params);
  },

  createBranch(branch: Partial<StoreBranch>): Promise<StoreBranch> {
    return remoteStoreRepo.createBranch(branch);
  },

  updateBranch(id: string, branch: Partial<StoreBranch>): Promise<StoreBranch> {
    return remoteStoreRepo.updateBranch(id, branch);
  },

  reserveCart(ciudadanoId: string, items: ReservationItem[]): Promise<ReservationResponse> {
    return remoteStoreRepo.reserveCart(ciudadanoId, items);
  },

  cancelReservation(canjeId: string): Promise<void> {
    return remoteStoreRepo.cancelReservation(canjeId);
  },

  confirmRedemption(
    canjeId: string,
    sucursalId: string,
    ciudadanoId?: string
  ): Promise<ConfirmRedemptionResponse> {
    return remoteStoreRepo.confirmRedemption(canjeId, sucursalId, ciudadanoId);
  },

  getUserRedemptions(ciudadanoId: string): Promise<any[]> {
    return remoteStoreRepo.getUserRedemptions(ciudadanoId);
  },

  // --- Módulo 006: Métodos de Entrega, Búsqueda y Expiración 30 días ---

  getRedemptionByCode(codigoRetiro: string): Promise<RedemptionDetail> {
    return remoteStoreRepo.getRedemptionByCode(codigoRetiro);
  },

  confirmDelivery(codigoRetiro: string): Promise<RedemptionDetail> {
    return remoteStoreRepo.confirmDelivery(codigoRetiro);
  },

  getCitizenRedemptions(ciudadanoId: string): Promise<RedemptionDetail[]> {
    return remoteStoreRepo.getCitizenRedemptions(ciudadanoId);
  },
};

export * from './IStoreRepository';
export * from './RemoteStoreRepository';
