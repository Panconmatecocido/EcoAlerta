import { Denuncia, EstadoDenunciaAdmin } from '../services/adminService';

export interface AdminNotification {
  key: string;
  code: string;
  title: string;
  description: string;
  state: Extract<
    EstadoDenunciaAdmin,
    'PENDIENTE' | 'VERIFICADO_PENDIENTE' | 'RESUELTO_TECNICO'
  >;
  date: string;
}

const ACTIONABLE_STATES = new Set<EstadoDenunciaAdmin>([
  'PENDIENTE',
  'VERIFICADO_PENDIENTE',
  'RESUELTO_TECNICO',
]);

const getNotificationContent = (
  state: AdminNotification['state']
): Pick<AdminNotification, 'title' | 'description'> => {
  switch (state) {
    case 'PENDIENTE':
      return {
        title: 'Nuevo reporte',
        description: 'Requiere revisión y triaje inicial.',
      };
    case 'VERIFICADO_PENDIENTE':
      return {
        title: 'Validación pendiente',
        description: 'Confirma la veracidad para avanzar con el saneamiento.',
      };
    case 'RESUELTO_TECNICO':
      return {
        title: 'Confirmación de saneamiento',
        description: 'Revisa y certifica el cierre del trabajo.',
      };
  }
};

export const buildAdminNotifications = (reports: Denuncia[]): AdminNotification[] =>
  reports
    .filter((report): report is Denuncia & { estado: AdminNotification['state'] } =>
      ACTIONABLE_STATES.has(report.estado)
    )
    .map((report) => ({
      key: `${report.id}:${report.estado}`,
      code: report.codigo ?? report.id,
      ...getNotificationContent(report.estado),
      state: report.estado,
      date: report.fecha,
    }))
    .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());

export const hasUnreadAdminNotifications = (
  notifications: AdminNotification[],
  seenKeys: Set<string>
): boolean => notifications.some((notification) => !seenKeys.has(notification.key));
