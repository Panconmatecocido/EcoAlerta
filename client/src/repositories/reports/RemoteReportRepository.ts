// Inicio de Fase 2 (Foundational): repositorio remoto para la API de denuncias.
import { api } from '../../services/api';
import { CitizenReport, CreateReportDTO, IReportRepository } from './IReportRepository';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class RemoteReportRepository implements IReportRepository {
  async createReport(report: CreateReportDTO): Promise<CitizenReport> {
    const response = await api.post<ApiResponse<CitizenReport>>('/api/denuncias', report);
    return response.data;
  }

  async getCitizenReports(ciudadanoId: string): Promise<CitizenReport[]> {
    const response = await api.get<ApiResponse<CitizenReport[]>>(
      `/api/denuncias/ciudadano/${encodeURIComponent(ciudadanoId)}`
    );
    return response.data;
  }

  async hideReportForCitizen(id: string, ciudadanoId: string): Promise<CitizenReport> {
    const response = await api.patch<ApiResponse<CitizenReport>>(
      `/api/denuncias/${encodeURIComponent(id)}/ocultar`,
      { ciudadanoId }
    );
    return response.data;
  }
}
