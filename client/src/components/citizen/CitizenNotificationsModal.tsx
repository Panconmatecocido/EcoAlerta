import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CitizenReport, reportRepository } from '../../repositories/reports';
import { RedemptionDetail, storeRepository } from '../../repositories/store';
import { getRedemptionReadyAt, isRedemptionReady } from '../../utils/citizenNotifications';
import { BORDER_RADIUS, COLORS, SPACING } from '../../utils/theme';

interface Props {
  visible: boolean;
  ciudadanoId?: string;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string | null;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}

const REPORT_STATUS_LABELS: Record<CitizenReport['estado'], string> = {
  PENDIENTE: 'En revisión',
  APROBADO: 'Aprobado',
  EN_PROCESO: 'En proceso',
  EN_VERIFICACION: 'En verificación',
  VERIFICADO_PENDIENTE: 'Verificación pendiente',
  EN_SANEAMIENTO: 'En saneamiento',
  RESUELTO_TECNICO: 'Resuelto técnicamente',
  RESUELTO: 'Resuelto',
  RECHAZADO: 'Rechazado',
  CERRADO_INACCESIBLE: 'Cerrado: sitio inaccesible',
};

const formatDate = (date: Date): string =>
  date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const buildNotifications = (
  reports: CitizenReport[],
  redemptions: RedemptionDetail[],
  now: Date
): NotificationItem[] => {
  const reportNotifications: NotificationItem[] = reports.map((report) => ({
    id: `report-${report.id}`,
    title: `Reporte ${report.codigo}`,
    message: `Estado actual: ${REPORT_STATUS_LABELS[report.estado]}`,
    date: report.creadoEn,
    icon: report.estado === 'RESUELTO' ? 'check-circle-outline' : 'clipboard-text-outline',
    color: report.estado === 'RECHAZADO' ? COLORS.textoPeligro : COLORS.botonPrincipal,
  }));

  const redemptionNotifications: NotificationItem[] = redemptions.map((redemption) => {
    if (redemption.estado === 'PENDIENTE_RETIRO') {
      const readyAt = getRedemptionReadyAt(redemption.creadoEn);
      if (isRedemptionReady(redemption, now)) {
        return {
          id: `redemption-${redemption.id}`,
          title: `Canje ${redemption.codigoRetiro}`,
          message: 'Ya está listo para retirar en la sucursal seleccionada.',
          date: redemption.creadoEn ?? null,
          icon: 'gift-outline',
          color: COLORS.botonPrincipal,
        };
      }

      return {
        id: `redemption-${redemption.id}`,
        title: `Canje ${redemption.codigoRetiro}`,
        message: readyAt
          ? `Disponible para retirar a partir del ${formatDate(readyAt)}.`
          : 'Pendiente de retiro; consulta la fecha de disponibilidad en el detalle.',
        date: redemption.creadoEn ?? null,
        icon: 'clock-outline',
        color: COLORS.textoAdvertencia,
      };
    }

    if (redemption.estado === 'ENTREGADO') {
      return {
        id: `redemption-${redemption.id}`,
        title: `Canje ${redemption.codigoRetiro}`,
        message: 'La entrega del premio ya fue confirmada.',
        date: redemption.fechaEntrega ?? redemption.creadoEn ?? null,
        icon: 'check-circle-outline',
        color: COLORS.botonPrincipal,
      };
    }

    return {
      id: `redemption-${redemption.id}`,
      title: `Canje ${redemption.codigoRetiro}`,
      message: 'El canje fue cancelado o venció y ya no está disponible para retiro.',
      date: redemption.creadoEn ?? null,
      icon: 'close-circle-outline',
      color: COLORS.textoPeligro,
    };
  });

  return [...reportNotifications, ...redemptionNotifications].sort((first, second) => {
    const firstTime = first.date ? new Date(first.date).getTime() : 0;
    const secondTime = second.date ? new Date(second.date).getTime() : 0;
    return secondTime - firstTime;
  });
};

export const CitizenNotificationsModal: React.FC<Props> = ({
  visible,
  ciudadanoId,
  onClose,
}) => {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [redemptionError, setRedemptionError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!ciudadanoId) {
      setReports([]);
      setRedemptions([]);
      setReportError(null);
      setRedemptionError(null);
      return;
    }

    setLoading(true);
    setReportError(null);
    setRedemptionError(null);

    const [reportResult, redemptionResult] = await Promise.allSettled([
      reportRepository.getCitizenReports(ciudadanoId),
      storeRepository.getCitizenRedemptions(ciudadanoId),
    ]);

    if (reportResult.status === 'fulfilled') {
      setReports(reportResult.value);
    } else {
      console.error('Error al cargar notificaciones de reportes:', reportResult.reason);
      setReports([]);
      setReportError(
        reportResult.reason instanceof Error
          ? reportResult.reason.message
          : 'No se pudieron cargar los estados de tus reportes.'
      );
    }

    if (redemptionResult.status === 'fulfilled') {
      setRedemptions(redemptionResult.value);
    } else {
      console.error('Error al cargar notificaciones de canjes:', redemptionResult.reason);
      setRedemptions([]);
      setRedemptionError(
        redemptionResult.reason instanceof Error
          ? redemptionResult.reason.message
          : 'No se pudieron cargar tus canjes.'
      );
    }

    setLoading(false);
  }, [ciudadanoId]);

  useEffect(() => {
    if (visible) void loadNotifications();
  }, [loadNotifications, visible]);

  const notifications = useMemo(
    () => buildNotifications(reports, redemptions, new Date()),
    [reports, redemptions]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color={COLORS.textoVerdeOscuro}
              />
              <Text style={styles.title}>Notificaciones</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar notificaciones"
              style={styles.closeButton}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={COLORS.textoVerdeOscuro}
              />
            </TouchableOpacity>
          </View>

          {!ciudadanoId ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Inicia sesión para consultar tus reportes y canjes.</Text>
            </View>
          ) : loading ? (
            <ActivityIndicator size="large" color={COLORS.botonPrincipal} style={styles.loader} />
          ) : (
            <ScrollView contentContainerStyle={styles.listContent}>
              {reportError ? (
                <Text style={styles.errorText}>Reportes: {reportError}</Text>
              ) : null}
              {redemptionError ? (
                <Text style={styles.errorText}>Canjes: {redemptionError}</Text>
              ) : null}
              {notifications.length === 0 && !reportError && !redemptionError ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="bell-sleep-outline"
                    size={40}
                    color={COLORS.textoDesactivado}
                  />
                  <Text style={styles.emptyText}>Todavía no tienes notificaciones.</Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <View key={notification.id} style={styles.notification}>
                    <MaterialCommunityIcons
                      name={notification.icon}
                      size={24}
                      color={notification.color}
                    />
                    <View style={styles.notificationCopy}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationMessage}>{notification.message}</Text>
                      {notification.date ? (
                        <Text style={styles.notificationDate}>
                          {formatDate(new Date(notification.date))}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => void loadNotifications()}
                style={styles.refreshButton}
              >
                <Text style={styles.refreshText}>Actualizar</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    maxHeight: '85%',
    minHeight: '45%',
    backgroundColor: COLORS.fondoAplicacion,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeSuave,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 20,
    fontWeight: '800',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  listContent: {
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  loader: {
    marginTop: SPACING.xl,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.superficieTarjeta,
  },
  notificationCopy: {
    flex: 1,
    gap: 3,
  },
  notificationTitle: {
    color: COLORS.textoVerdeOscuro,
    fontSize: 15,
    fontWeight: '700',
  },
  notificationMessage: {
    color: COLORS.textoSecundario,
    fontSize: 14,
    lineHeight: 20,
  },
  notificationDate: {
    color: COLORS.textoDesactivado,
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textoSecundario,
    fontSize: 15,
  },
  errorText: {
    color: COLORS.textoPeligro,
    padding: SPACING.sm,
  },
  refreshButton: {
    alignSelf: 'center',
    padding: SPACING.md,
  },
  refreshText: {
    color: COLORS.botonPrincipal,
    fontWeight: '700',
  },
});
