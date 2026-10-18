import { api } from '../../services/api';
import {
  CasoCampo,
  DatosVerificacionInSitu,
  IFieldAgentRepository,
  RespuestaBolsaCasos,
} from './IFieldAgentRepository';

const mapearCasoServidor = (raw: any): CasoCampo => ({
  id: raw.id,
  codigo: raw.codigo || `REP-2026-${String(raw.id).slice(0, 3).toUpperCase()}`,
  titulo: raw.titulo || 'Alerta Ambiental',
  descripcion: raw.descripcion || '',
  categoria: raw.categoria || 'General',
  prioridad: raw.prioridad || 'MEDIA',
  estado: raw.estado || 'APROBADO',
  direccion: raw.direccion || raw.ubicacion || 'Ubicación sin especificar',
  latitud: typeof raw.latitud === 'number' ? raw.latitud : -34.4587,
  longitud: typeof raw.longitud === 'number' ? raw.longitud : -58.9142,
  distanciaKm: typeof raw.distanciaKm === 'number' ? raw.distanciaKm : 1.2,
  imagenUrl: raw.imagenUrl || null,
  fotoVerificacionUrl: raw.fotoVerificacionUrl || null,
  observacionesAdmin: raw.observacionesAdmin || null,
  intentosInaccesible: typeof raw.intentosInaccesible === 'number' ? raw.intentosInaccesible : 0,
  puntosOtorgados: raw.puntosOtorgados ?? 0,
  agenteId: raw.agenteId || null,
  creadoEn: raw.creadoEn || new Date().toISOString(),
});

export class RemoteFieldAgentRepository implements IFieldAgentRepository {
  async getBolsaYCasoActivo(agenteId: string, municipioId?: string): Promise<RespuestaBolsaCasos> {
    const params: Record<string, string> = { agenteId };
    if (municipioId) params.municipioId = municipioId;
    const query = new URLSearchParams(params).toString();
    const res = await api.get<{
      success: boolean;
      data: any[];
      casoActivo?: any | null;
    }>(`/api/denuncias/bolsa?${query}`);

    return {
      bolsa: (res.data || []).map(mapearCasoServidor),
      casoActivo: res.casoActivo ? mapearCasoServidor(res.casoActivo) : null,
    };
  }

  async getBolsaCasos(municipioId?: string): Promise<CasoCampo[]> {
    const query = municipioId ? `?municipioId=${encodeURIComponent(municipioId)}` : '';
    const res = await api.get<{ success: boolean; data: any[] }>(`/api/denuncias/bolsa${query}`);
    return (res.data || []).map(mapearCasoServidor);
  }

  async getMiCasoActivo(agenteId: string): Promise<CasoCampo | null> {
    const { casoActivo } = await this.getBolsaYCasoActivo(agenteId);
    return casoActivo;
  }

  async tomarCaso(casoId: string, agenteId: string): Promise<{ caso: CasoCampo; message: string }> {
    const res = await api.patch<{ success: boolean; data: any; message: string }>(
      `/api/denuncias/${casoId}/tomar`,
      { agenteId }
    );
    return {
      caso: mapearCasoServidor(res.data),
      message: res.message || 'Caso asignado en exclusividad',
    };
  }

  async enviarVerificacion(
    casoId: string,
    agenteId: string,
    datos: DatosVerificacionInSitu
  ): Promise<{ caso: CasoCampo; message: string }> {
    const res = await api.patch<{ success: boolean; data: any; message: string }>(
      `/api/denuncias/${casoId}/verificar`,
      {
        agenteId,
        resultado: datos.resultado,
        fotoVerificacionUrl: datos.fotoVerificacionUrl,
        observaciones: datos.observaciones,
      }
    );
    return {
      caso: mapearCasoServidor(res.data),
      message: res.message || 'Verificación in situ registrada',
    };
  }

  async liberarCaso(casoId: string, motivo?: string): Promise<{ caso: CasoCampo; message: string }> {
    const res = await api.patch<{ success: boolean; data: any; message: string }>(
      `/api/denuncias/${casoId}/liberar`,
      { motivo }
    );
    return {
      caso: mapearCasoServidor(res.data),
      message: res.message || 'Caso devuelto a la bolsa general',
    };
  }
}
