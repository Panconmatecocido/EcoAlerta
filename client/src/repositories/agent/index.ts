import {
  CasoCampo,
  DatosVerificacionInSitu,
  IFieldAgentRepository,
  RespuestaBolsaCasos,
} from './IFieldAgentRepository';
import { RemoteFieldAgentRepository } from './RemoteFieldAgentRepository';
import { LocalFieldAgentRepository } from './LocalFieldAgentRepository';

const remoteRepo = new RemoteFieldAgentRepository();
const localRepo = new LocalFieldAgentRepository();

const esCasoMockLocal = (casoId: string) => casoId.startsWith('insp-');

export const fieldAgentRepository: IFieldAgentRepository = {
  async getBolsaYCasoActivo(agenteId: string, municipioId?: string): Promise<RespuestaBolsaCasos> {
    try {
      return await remoteRepo.getBolsaYCasoActivo(agenteId, municipioId);
    } catch {
      return await localRepo.getBolsaYCasoActivo(agenteId, municipioId);
    }
  },

  async getBolsaCasos(municipioId?: string): Promise<CasoCampo[]> {
    try {
      return await remoteRepo.getBolsaCasos(municipioId);
    } catch {
      return await localRepo.getBolsaCasos(municipioId);
    }
  },

  async getMiCasoActivo(agenteId: string): Promise<CasoCampo | null> {
    try {
      return await remoteRepo.getMiCasoActivo(agenteId);
    } catch {
      return await localRepo.getMiCasoActivo(agenteId);
    }
  },

  async tomarCaso(casoId: string, agenteId: string): Promise<{ caso: CasoCampo; message: string }> {
    if (esCasoMockLocal(casoId)) {
      return await localRepo.tomarCaso(casoId, agenteId);
    }
    return await remoteRepo.tomarCaso(casoId, agenteId);
  },

  async enviarVerificacion(
    casoId: string,
    agenteId: string,
    datos: DatosVerificacionInSitu
  ): Promise<{ caso: CasoCampo; message: string }> {
    if (esCasoMockLocal(casoId)) {
      return await localRepo.enviarVerificacion(casoId, agenteId, datos);
    }
    return await remoteRepo.enviarVerificacion(casoId, agenteId, datos);
  },

  async enviarCierreTecnico(
    casoId: string,
    agenteId: string,
    datos: any
  ): Promise<{ caso: CasoCampo; message: string }> {
    if (esCasoMockLocal(casoId)) {
      return await localRepo.enviarCierreTecnico(casoId, agenteId, datos);
    }
    return await remoteRepo.enviarCierreTecnico(casoId, agenteId, datos);
  },

  async liberarCaso(casoId: string, motivo?: string): Promise<{ caso: CasoCampo; message: string }> {

    if (esCasoMockLocal(casoId)) {
      return await localRepo.liberarCaso(casoId, motivo);
    }
    return await remoteRepo.liberarCaso(casoId, motivo);
  },
};

export * from './IFieldAgentRepository';
