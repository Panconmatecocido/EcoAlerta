import { getRedemptionReadyAt, isRedemptionReady } from '../citizenNotifications';

describe('citizen redemption notifications', () => {
  it('marks a voucher ready after two weekdays', () => {
    const redemption = {
      id: 'redemption-1',
      codigoRetiro: 'ECO-2026-ABCD',
      totalPuntos: 100,
      estado: 'PENDIENTE_RETIRO',
      creadoEn: '2026-10-26T12:00:00.000Z',
      items: [],
    };

    expect(getRedemptionReadyAt(redemption.creadoEn)?.toISOString()).toBe(
      '2026-10-28T12:00:00.000Z'
    );
    expect(isRedemptionReady(redemption, new Date('2026-10-28T12:00:00.000Z'))).toBe(true);
    expect(isRedemptionReady(redemption, new Date('2026-10-28T11:59:59.999Z'))).toBe(false);
  });

  it('skips weekends and does not mark delivered vouchers as ready-to-pick-up', () => {
    const redemption = {
      id: 'redemption-2',
      codigoRetiro: 'ECO-2026-EFGH',
      totalPuntos: 100,
      estado: 'PENDIENTE_RETIRO',
      creadoEn: '2026-10-30T12:00:00.000Z',
      items: [],
    };

    expect(getRedemptionReadyAt(redemption.creadoEn)?.toISOString()).toBe(
      '2026-11-03T12:00:00.000Z'
    );
    expect(isRedemptionReady(
      { ...redemption, estado: 'ENTREGADO' },
      new Date('2026-11-04T12:00:00.000Z')
    )).toBe(false);
  });

  it('returns no availability date for a missing or invalid creation date', () => {
    expect(getRedemptionReadyAt(undefined)).toBeNull();
    expect(getRedemptionReadyAt('not-a-date')).toBeNull();
  });
});
