// Inicio de Fase 2 (Foundational): contrato compartido para reportes ciudadanos.
import type { EstadoDenuncia } from '../../components/citizen/ReportStatusBadge';

export interface CreateReportDTO {
  titulo: string;
  descripcion: string;
  categoria: 'Microbasural' | 'Foco de Dengue' | 'Terreno Baldío' | 'Otro';
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  imagenUrl: string;
  ciudadanoId: string;
  municipioId: string;
}

export interface CitizenReport {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  categoria: CreateReportDTO['categoria'];
  estado: EstadoDenuncia;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  imagenUrl: string | null;
  fotoSolucionUrl: string | null;
  informeSolucion: string | null;
  observacionesAdmin: string | null;
  puntosOtorgados: number;
  ocultarUsuario: boolean;
  ciudadanoId: string;
  municipioId: string;
  creadoEn: string;
  fechaResolucion: string | null;
  localOnly?: boolean;
}

export interface IReportRepository {
  createReport(report: CreateReportDTO): Promise<CitizenReport>;
  getCitizenReports(ciudadanoId: string): Promise<CitizenReport[]>;
  hideReportForCitizen(id: string, ciudadanoId: string): Promise<CitizenReport>;
}
