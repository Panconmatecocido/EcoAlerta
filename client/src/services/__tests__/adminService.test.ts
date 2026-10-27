import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { api } from '../api';
import { adminService } from '../adminService';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockedGet = jest.mocked(api.get);
const mockedPatch = jest.mocked(api.patch);

describe('adminService.obtenerDenuncias', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps the persisted report contract to typed administrator records', async () => {
    mockedGet.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'report-1',
          codigo: 'REP-2026-001',
          titulo: 'Microbasural en la plaza',
          descripcion: 'Residuos acumulados en la vereda.',
          categoria: 'Microbasural',
          direccion: 'Calle 1 y Calle 2',
          latitud: -34.46,
          longitud: -58.91,
          estado: 'PENDIENTE',
          prioridad: 'ALTA',
          creadoEn: '2026-10-20T10:00:00.000Z',
          agente: { id: 'agent-1', nombre: 'Agente Uno' },
        },
      ],
    });

    await expect(adminService.obtenerDenuncias({ estado: 'PENDIENTE' })).resolves.toEqual([
      {
        id: 'report-1',
        codigo: 'REP-2026-001',
        titulo: 'Microbasural en la plaza',
        descripcion: 'Residuos acumulados en la vereda.',
        categoria: 'Microbasural',
        direccion: 'Calle 1 y Calle 2',
        latitud: -34.46,
        longitud: -58.91,
        prioridad: 'ALTA',
        fecha: '2026-10-20',
        estado: 'PENDIENTE',
        agenteAsignadoId: 'agent-1',
        agenteAsignadoNombre: 'Agente Uno',
      },
    ]);
    expect(mockedGet).toHaveBeenCalledWith('/api/denuncias?estado=PENDIENTE');
  });

  it('propagates network failures and rejects malformed API envelopes', async () => {
    const networkError = new Error('Network unavailable');
    mockedGet.mockRejectedValueOnce(networkError);
    await expect(adminService.obtenerDenuncias()).rejects.toBe(networkError);

    mockedGet.mockResolvedValueOnce({ success: true, data: null });
    await expect(adminService.obtenerDenuncias()).rejects.toThrow(
      'La respuesta de reportes del servidor no es válida'
    );
  });

  it('requests candidates for a report and propagates candidate lookup failures', async () => {
    const candidates = [
      {
        id: 'agent-1',
        nombre: 'Agente Uno',
        disponible: true,
        casosActivos: 0,
        distanciaMetros: 120,
        ubicacionActualizadaEn: '2026-10-21T11:00:00.000Z',
      },
    ];
    mockedGet.mockResolvedValueOnce({ success: true, data: candidates });

    await expect(adminService.obtenerAgentesCandidatos('report 1')).resolves.toEqual(candidates);
    expect(mockedGet).toHaveBeenCalledWith(
      '/api/denuncias/report%201/agentes-disponibles'
    );

    const lookupError = new Error('Report has no GPS');
    mockedGet.mockRejectedValueOnce(lookupError);
    await expect(adminService.obtenerAgentesCandidatos('report-2')).rejects.toBe(lookupError);
  });

  it('maps confirmed triage and assignment responses instead of returning optimistic state', async () => {
    const persistedReport = {
      id: 'report-1',
      codigo: 'REP-2026-001',
      titulo: 'Reporte aprobado',
      descripcion: 'Descripción',
      categoria: 'Microbasural',
      direccion: 'Calle 1',
      latitud: -34.46,
      longitud: -58.91,
      estado: 'APROBADO',
      prioridad: 'URGENTE',
      creadoEn: '2026-10-21T11:00:00.000Z',
      agenteId: null,
    };
    mockedPatch.mockResolvedValueOnce({ success: true, data: persistedReport });

    await expect(
      adminService.triajeDenuncia('report-1', {
        accion: 'APROBAR',
        prioridad: 'URGENTE',
      })
    ).resolves.toMatchObject({
      id: 'report-1',
      estado: 'APROBADO',
      prioridad: 'URGENTE',
    });
    expect(mockedPatch).toHaveBeenCalledWith('/api/denuncias/report-1/triaje', {
      accion: 'APROBAR',
      prioridad: 'URGENTE',
    });

    const assignedReport = {
      ...persistedReport,
      estado: 'EN_VERIFICACION',
      agenteId: 'agent-1',
      agente: { id: 'agent-1', nombre: 'Agente Uno' },
    };
    mockedPatch.mockResolvedValueOnce({ success: true, data: assignedReport });
    await expect(adminService.asignarAgenteDenuncia('report-1', 'agent-1')).resolves.toMatchObject({
      estado: 'EN_VERIFICACION',
      agenteAsignadoId: 'agent-1',
      agenteAsignadoNombre: 'Agente Uno',
    });
    expect(mockedPatch).toHaveBeenLastCalledWith('/api/denuncias/report-1/asignar', {
      agenteId: 'agent-1',
    });
  });

  it('propagates assignment conflicts and network errors without creating a success result', async () => {
    const conflict = new Error('El reporte ya no está disponible para asignación');
    mockedPatch.mockRejectedValueOnce(conflict);
    await expect(adminService.asignarAgenteDenuncia('report-1', 'agent-1')).rejects.toBe(conflict);

    const noDisponibleError = new Error('Agente no disponible');
    mockedPatch.mockRejectedValueOnce(noDisponibleError);
    await expect(adminService.asignarAgenteDenuncia('report-1', 'agent-1')).rejects.toBe(
      noDisponibleError
    );

    const networkError = new Error('Network unavailable');
    mockedPatch.mockRejectedValueOnce(networkError);
    await expect(adminService.asignarAgenteDenuncia('report-1', 'agent-1')).rejects.toBe(
      networkError
    );
  });

  it('sends the administrator release request to the persisted report endpoint', async () => {
    mockedPatch.mockResolvedValueOnce({ success: true, data: { id: 'report-1' } });
    await expect(adminService.liberarCasoAgente('report 1')).resolves.toMatchObject({
      success: true,
    });
    expect(mockedPatch).toHaveBeenCalledWith('/api/denuncias/report%201/liberar');
  });

  it('requires GPS when enabling availability and sends only the latest location', async () => {
    mockedPatch.mockResolvedValueOnce({
      success: true,
      data: {
        id: 'agent-1',
        disponible: true,
        ubicacionActualizadaEn: '2026-10-21T11:00:00.000Z',
      },
    });

    await expect(
      adminService.actualizarDisponibilidadPropia(true, {
        latitud: -34.46,
        longitud: -58.91,
      })
    ).resolves.toMatchObject({ success: true });
    expect(mockedPatch).toHaveBeenCalledWith('/api/agentes/me/disponibilidad', {
      disponible: true,
      latitud: -34.46,
      longitud: -58.91,
    });
    await expect(adminService.actualizarDisponibilidadPropia(true)).rejects.toThrow(
      'Se requiere ubicación GPS para activar la disponibilidad'
    );
  });
});
