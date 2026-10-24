// Inicio de Fase 2 (Foundational): caché persistente local para uso sin conexión.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CitizenReport, CreateReportDTO, IReportRepository } from './IReportRepository';

const STORAGE_KEY = '@ecoalerta_citizen_reports_v1';

const readReports = async (): Promise<CitizenReport[]> => {
  const serialized = await AsyncStorage.getItem(STORAGE_KEY);
  if (!serialized) return [];

  const reports: unknown = JSON.parse(serialized);
  if (!Array.isArray(reports)) {
    throw new Error('La caché local de reportes tiene un formato inválido.');
  }
  return reports as CitizenReport[];
};

const writeReports = async (reports: CitizenReport[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
};

export class LocalReportRepository implements IReportRepository {
  async createReport(report: CreateReportDTO): Promise<CitizenReport> {
    const now = new Date().toISOString();
    const localReport: CitizenReport = {
      ...report,
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      codigo: 'REP-PENDIENTE-SIN-CONEXION',
      estado: 'PENDIENTE',
      prioridad: 'MEDIA',
      fotoSolucionUrl: null,
      informeSolucion: null,
      observacionesAdmin: null,
      puntosOtorgados: 0,
      ocultarUsuario: false,
      creadoEn: now,
      fechaResolucion: null,
      localOnly: true,
    };

    const reports = await readReports();
    await writeReports([localReport, ...reports]);
    return localReport;
  }

  async getCitizenReports(ciudadanoId: string): Promise<CitizenReport[]> {
    const reports = await readReports();
    return reports.filter(
      (report) => report.ciudadanoId === ciudadanoId && !report.ocultarUsuario
    );
  }

  async hideReportForCitizen(id: string, ciudadanoId: string): Promise<CitizenReport> {
    const reports = await readReports();
    const reportIndex = reports.findIndex(
      (report) =>
        report.id === id && report.ciudadanoId === ciudadanoId && !report.ocultarUsuario
    );

    if (reportIndex === -1) {
      throw new Error('No se encontró un reporte local visible de ese ciudadano.');
    }

    const hiddenReport = { ...reports[reportIndex], ocultarUsuario: true };
    reports[reportIndex] = hiddenReport;
    await writeReports(reports);
    return hiddenReport;
  }

  async cacheCitizenReports(
    ciudadanoId: string,
    remoteReports: CitizenReport[]
  ): Promise<CitizenReport[]> {
    const cachedReports = await readReports();
    const citizenCache = cachedReports.filter((report) => report.ciudadanoId === ciudadanoId);
    const otherCitizens = cachedReports.filter((report) => report.ciudadanoId !== ciudadanoId);
    const merged = new Map<string, CitizenReport>();

    for (const report of remoteReports) {
      const cached = citizenCache.find((item) => item.id === report.id);
      merged.set(report.id, {
        ...report,
        ocultarUsuario: cached?.ocultarUsuario || report.ocultarUsuario,
      });
    }
    for (const report of citizenCache) {
      if (report.localOnly || report.ocultarUsuario) {
        merged.set(report.id, report);
      }
    }

    const updatedCache = [...otherCitizens, ...merged.values()];
    await writeReports(updatedCache);
    return [...merged.values()].filter((report) => !report.ocultarUsuario);
  }

  async cacheReport(report: CitizenReport): Promise<void> {
    const reports = await readReports();
    const existingIndex = reports.findIndex((item) => item.id === report.id);
    if (existingIndex === -1) {
      reports.unshift(report);
    } else {
      reports[existingIndex] = report;
    }
    await writeReports(reports);
  }
}
