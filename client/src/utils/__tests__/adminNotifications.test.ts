import { Denuncia } from '../../services/adminService';
import { buildAdminNotifications, hasUnreadAdminNotifications } from '../adminNotifications';

const makeReport = (id: string, estado: Denuncia['estado']): Denuncia => ({
  id,
  codigo: `REP-${id}`,
  titulo: `Reporte ${id}`,
  categoria: 'Microbasural',
  fecha: '2026-10-28',
  estado,
});

describe('admin notifications', () => {
  it('includes new reports and both administrator sanitation confirmation stages', () => {
    const notifications = buildAdminNotifications([
      makeReport('new', 'PENDIENTE'),
      makeReport('verify', 'VERIFICADO_PENDIENTE'),
      makeReport('certify', 'RESUELTO_TECNICO'),
      makeReport('in-progress', 'EN_SANEAMIENTO'),
    ]);

    expect(notifications.map(({ state }) => state)).toEqual([
      'PENDIENTE',
      'VERIFICADO_PENDIENTE',
      'RESUELTO_TECNICO',
    ]);
    expect(notifications.map(({ key }) => key)).toEqual([
      'new:PENDIENTE',
      'verify:VERIFICADO_PENDIENTE',
      'certify:RESUELTO_TECNICO',
    ]);
  });

  it('marks notifications as unread until their report state key has been seen', () => {
    const notifications = buildAdminNotifications([makeReport('new', 'PENDIENTE')]);

    expect(hasUnreadAdminNotifications(notifications, new Set())).toBe(true);
    expect(hasUnreadAdminNotifications(notifications, new Set(['new:PENDIENTE']))).toBe(false);
  });
});
