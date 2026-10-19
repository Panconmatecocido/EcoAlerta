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
import { LocalStoreRepository } from './LocalStoreRepository';

const remoteStoreRepo = new RemoteStoreRepository();
const localStoreRepo = new LocalStoreRepository();

const esEntidadLocal = (id: string) => id.startsWith('prod-') || id.startsWith('suc-') || id.startsWith('canje-');

export const storeRepository: IStoreRepository = {
  async getProducts(params?: { busqueda?: string; municipioId?: string }): Promise<StoreProduct[]> {
    try {
      return await remoteStoreRepo.getProducts(params);
    } catch (err) {
      console.warn('Fallo remoteStoreRepo.getProducts, usando localStoreRepo:', err);
      return await localStoreRepo.getProducts(params);
    }
  },

  async getProductsAdmin(params?: { busqueda?: string; municipioId?: string }): Promise<StoreProduct[]> {
    try {
      return await remoteStoreRepo.getProductsAdmin(params);
    } catch (err) {
      console.warn('Fallo remoteStoreRepo.getProductsAdmin, usando localStoreRepo:', err);
      return await localStoreRepo.getProductsAdmin(params);
    }
  },

  async createProduct(producto: Partial<StoreProduct>): Promise<StoreProduct> {
    try {
      return await remoteStoreRepo.createProduct(producto);
    } catch (err) {
      console.warn('Fallo remoteStoreRepo.createProduct, usando localStoreRepo:', err);
      return await localStoreRepo.createProduct(producto);
    }
  },

  async updateProduct(id: string, producto: Partial<StoreProduct>): Promise<StoreProduct> {
    if (esEntidadLocal(id)) {
      return await localStoreRepo.updateProduct(id, producto);
    }
    try {
      return await remoteStoreRepo.updateProduct(id, producto);
    } catch (err) {
      console.warn('Fallo remoteStoreRepo.updateProduct, usando localStoreRepo:', err);
      return await localStoreRepo.updateProduct(id, producto);
    }
  },

  async deactivateProduct(id: string): Promise<StoreProduct> {
    if (esEntidadLocal(id)) {
      return await localStoreRepo.deactivateProduct(id);
    }
    try {
      return await remoteStoreRepo.deactivateProduct(id);
    } catch (err) {
      console.warn('Fallo remoteStoreRepo.deactivateProduct, usando localStoreRepo:', err);
      return await localStoreRepo.deactivateProduct(id);
    }
  },

  async getBranches(params?: { municipioId?: string; todas?: boolean }): Promise<StoreBranch[]> {
    try {
      return await remoteStoreRepo.getBranches(params);
    } catch (err) {
      console.warn('Fallo remoteStoreRepo.getBranches, usando localStoreRepo:', err);
      return await localStoreRepo.getBranches(params);
    }
  },

  async createBranch(branch: Partial<StoreBranch>): Promise<StoreBranch> {
    try {
      return await remoteStoreRepo.createBranch(branch);
    } catch (err) {
      console.warn('Fallo remoteStoreRepo.createBranch, usando localStoreRepo:', err);
      return await localStoreRepo.createBranch(branch);
    }
  },

  async updateBranch(id: string, branch: Partial<StoreBranch>): Promise<StoreBranch> {
    if (esEntidadLocal(id)) {
      return await localStoreRepo.updateBranch(id, branch);
    }
    try {
      return await remoteStoreRepo.updateBranch(id, branch);
    } catch (err) {
      console.warn('Fallo remoteStoreRepo.updateBranch, usando localStoreRepo:', err);
      return await localStoreRepo.updateBranch(id, branch);
    }
  },

  async reserveCart(ciudadanoId: string, items: ReservationItem[]): Promise<ReservationResponse> {
    try {
      return await remoteStoreRepo.reserveCart(ciudadanoId, items);
    } catch (err: any) {
      if (err?.message && !err.message.includes('Network request failed')) {
        throw err;
      }
      console.warn('Fallo de red en remoteStoreRepo.reserveCart, usando localStoreRepo:', err);
      return await localStoreRepo.reserveCart(ciudadanoId, items);
    }
  },

  async cancelReservation(canjeId: string): Promise<void> {
    if (esEntidadLocal(canjeId)) {
      return await localStoreRepo.cancelReservation(canjeId);
    }
    try {
      await remoteStoreRepo.cancelReservation(canjeId);
    } catch (err: any) {
      if (err?.message && !err.message.includes('Network request failed')) {
        throw err;
      }
      console.warn('Fallo de red en remoteStoreRepo.cancelReservation, usando localStoreRepo:', err);
      await localStoreRepo.cancelReservation(canjeId);
    }
  },

  async confirmRedemption(
    canjeId: string,
    sucursalId: string,
    ciudadanoId?: string
  ): Promise<ConfirmRedemptionResponse> {
    if (esEntidadLocal(canjeId)) {
      return await localStoreRepo.confirmRedemption(canjeId, sucursalId, ciudadanoId);
    }
    try {
      return await remoteStoreRepo.confirmRedemption(canjeId, sucursalId, ciudadanoId);
    } catch (err: any) {
      if (err?.message && !err.message.includes('Network request failed')) {
        throw err;
      }
      console.warn('Fallo de red en remoteStoreRepo.confirmRedemption, usando localStoreRepo:', err);
      return await localStoreRepo.confirmRedemption(canjeId, sucursalId, ciudadanoId);
    }
  },

  async getUserRedemptions(ciudadanoId: string): Promise<any[]> {
    return await this.getCitizenRedemptions(ciudadanoId);
  },

  // --- Módulo 006: Métodos de Entrega, Búsqueda y Expiración 30 días ---

  async getRedemptionByCode(codigoRetiro: string): Promise<RedemptionDetail> {
    try {
      return await remoteStoreRepo.getRedemptionByCode(codigoRetiro);
    } catch (err: any) {
      if (err?.message && !err.message.includes('Network request failed')) {
        // Si el servidor respondió con 404/409, intentar local solo si es red o demo
        if (!err.message.includes('Failed to fetch') && !err.message.includes('Network')) {
          try {
            return await localStoreRepo.getRedemptionByCode(codigoRetiro);
          } catch {
            throw err;
          }
        }
      }
      console.warn('Fallo remoteStoreRepo.getRedemptionByCode, usando localStoreRepo:', err);
      return await localStoreRepo.getRedemptionByCode(codigoRetiro);
    }
  },

  async confirmDelivery(codigoRetiro: string): Promise<RedemptionDetail> {
    try {
      return await remoteStoreRepo.confirmDelivery(codigoRetiro);
    } catch (err: any) {
      if (err?.message && !err.message.includes('Network request failed')) {
        if (!err.message.includes('Failed to fetch') && !err.message.includes('Network')) {
          try {
            return await localStoreRepo.confirmDelivery(codigoRetiro);
          } catch {
            throw err;
          }
        }
      }
      console.warn('Fallo remoteStoreRepo.confirmDelivery, usando localStoreRepo:', err);
      return await localStoreRepo.confirmDelivery(codigoRetiro);
    }
  },

  async getCitizenRedemptions(ciudadanoId: string): Promise<RedemptionDetail[]> {
    try {
      return await remoteStoreRepo.getCitizenRedemptions(ciudadanoId);
    } catch (err) {
      console.warn('Fallo remoteStoreRepo.getCitizenRedemptions, usando localStoreRepo:', err);
      return await localStoreRepo.getCitizenRedemptions(ciudadanoId);
    }
  },
};

export * from './IStoreRepository';

