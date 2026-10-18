import { PrioridadCaso } from '../../components/agent/PrioritySemaphoreBadge';
import { ResultadoVerificacion } from '../../components/agent/VerificationFormModal';

export type EstadoCasoCampo =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'EN_PROCESO'
  | 'EN_VERIFICACION'
  | 'VERIFICADO_PENDIENTE'
  | 'EN_SANEAMIENTO'
  | 'RESUELTO_TECNICO'
  | 'RESUELTO'
  | 'RECHAZADO'
  | 'CERRADO_INACCESIBLE';

export interface CasoCampo {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  prioridad: PrioridadCaso;
  estado: EstadoCasoCampo;
  direccion: string;
  latitud?: number | null;
  longitud?: number | null;
  distanciaKm: number;
  imagenUrl?: string | null;
  fotoVerificacionUrl?: string | null;
  observacionesAdmin?: string | null;
  intentosInaccesible: number;
  puntosOtorgados?: number | null;
  agenteId?: string | null;
  creadoEn: string;
}

export interface RespuestaBolsaCasos {
  bolsa: CasoCampo[];
  casoActivo: CasoCampo | null;
}

export interface DatosVerificacionInSitu {
  resultado: ResultadoVerificacion;
  fotoVerificacionUrl: string;
  observaciones?: string;
}

export interface IFieldAgentRepository {
  getBolsaYCasoActivo(agenteId: string, municipioId?: string): Promise<RespuestaBolsaCasos>;
  getBolsaCasos(municipioId?: string): Promise<CasoCampo[]>;
  getMiCasoActivo(agenteId: string): Promise<CasoCampo | null>;
  tomarCaso(casoId: string, agenteId: string): Promise<{ caso: CasoCampo; message: string }>;
  enviarVerificacion(
    casoId: string,
    agenteId: string,
    datos: DatosVerificacionInSitu
  ): Promise<{ caso: CasoCampo; message: string }>;
  liberarCaso(casoId: string, motivo?: string): Promise<{ caso: CasoCampo; message: string }>;
}
