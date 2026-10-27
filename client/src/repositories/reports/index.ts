// Inicio de Fase 2 (Foundational): selección y fallback entre API y caché local.
import { CitizenReport, CreateReportDTO, IReportRepository } from './IReportRepository';
import { LocalReportRepository } from './LocalReportRepository';
import { RemoteReportRepository } from './RemoteReportRepository';

const remoteRepository = new RemoteReportRepository();
const localRepository = new LocalReportRepository();

const isNetworkOrServerError = (error: unknown): boolean =>
  error instanceof TypeError ||
  (error instanceof Error &&
    (error.name === 'TypeError' ||
      /network|fetch|conexion|servidor|500|failed to fetch/i.test(error.message)));

export const reportRepository: IReportRepository = {
  async createReport(report: CreateReportDTO): Promise<CitizenReport> {
    try {
      const createdReport = await remoteRepository.createReport(report);
      await localRepository.cacheReport(createdReport);
      return createdReport;
    } catch (error) {
      console.warn('Fallo remoto al obtener reportes, usando caché local:', error);
      return localRepository.createReport(report);
    }
  },

  async getCitizenReports(ciudadanoId: string): Promise<CitizenReport[]> {
    try {
      const remoteReports = await remoteRepository.getCitizenReports(ciudadanoId);
      return localRepository.cacheCitizenReports(ciudadanoId, remoteReports);
    } catch (error) {
      console.warn('Fallo remoto al obtener reportes, usando caché local:', error);
      return localRepository.getCitizenReports(ciudadanoId);
    }
  },

  async hideReportForCitizen(id: string, ciudadanoId: string): Promise<CitizenReport> {
    try {
      const hiddenReport = await remoteRepository.hideReportForCitizen(id, ciudadanoId);
      await localRepository.cacheReport(hiddenReport);
      return hiddenReport;
    } catch (error) {
      console.warn('Fallo remoto al obtener reportes, usando caché local:', error);
      const cachedReport = (await localRepository.getCitizenReports(ciudadanoId)).find(
        (report) => report.id === id
      );
      if (cachedReport?.localOnly) {
        return localRepository.hideReportForCitizen(id, ciudadanoId);
      }
      throw new Error(
        'No se pudo archivar el reporte en el servidor. Revisa tu conexión e inténtalo nuevamente.'
      );
    }
  },
};

export * from './IReportRepository';
export { LocalReportRepository } from './LocalReportRepository';
export { RemoteReportRepository } from './RemoteReportRepository';
