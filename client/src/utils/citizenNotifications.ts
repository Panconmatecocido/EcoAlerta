import { RedemptionDetail } from '../repositories/store/IStoreRepository';

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const getRedemptionReadyAt = (createdAt?: string | null): Date | null => {
  if (!createdAt) return null;

  const readyAt = new Date(createdAt);
  if (Number.isNaN(readyAt.getTime())) return null;

  let businessDays = 0;
  while (businessDays < 2) {
    readyAt.setDate(readyAt.getDate() + 1);
    if (!isWeekend(readyAt)) businessDays += 1;
  }

  return readyAt;
};

export const isRedemptionReady = (
  redemption: RedemptionDetail,
  now: Date = new Date()
): boolean => {
  if (redemption.estado !== 'PENDIENTE_RETIRO') return false;
  const readyAt = getRedemptionReadyAt(redemption.creadoEn);
  return readyAt !== null && now.getTime() >= readyAt.getTime();
};
