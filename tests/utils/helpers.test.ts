import { describe, expect, it, vi } from 'vitest';

import {
  capitalize,
  formatDateLong,
  formatDateShort,
  formatNumber,
  groupBy,
  parseIsoDate,
  resolveEventStatus,
  sleep,
  truncate,
  uid,
} from '@/utils/helpers';
import type { EventItem } from '@/types';

/** Fabrique un événement valide avec surcharge partielle. */
function makeEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: '1',
    title: 'Event',
    date: '2030-01-01',
    category: 'esport',
    organizer: 'TEC',
    description: 'Desc',
    ...overrides,
  };
}

describe('helpers', () => {
  it('formatDateLong formate en français', () => {
    expect(formatDateLong('2024-01-15')).toMatch(/15 janvier 2024/);
  });

  it('formatDateLong renvoie la chaîne brute si date invalide', () => {
    expect(formatDateLong('pas-une-date')).toBe('pas-une-date');
  });

  it('formatDateShort formate en court majuscule', () => {
    expect(formatDateShort('2024-01-15')).toMatch(/^15 JANV/);
  });

  it('truncate ajoute …', () => {
    expect(truncate('abcdef', 3)).toBe('abc…');
    expect(truncate('abc', 10)).toBe('abc');
  });

  it('uid génère des strings uniques', () => {
    expect(uid()).not.toBe(uid());
    expect(uid('toast')).toMatch(/^toast-/);
  });

  it('groupBy groupe par clé en ignorant les valeurs vides', () => {
    const result = groupBy(
      [
        { a: 1, b: 'x' },
        { a: 2, b: 'x' },
        { a: 3, b: 'y' },
        { a: 4, b: '' },
      ],
      'b'
    );
    expect(result.x).toHaveLength(2);
    expect(result.y).toHaveLength(1);
    expect(result['']).toBeUndefined();
  });

  it('resolveEventStatus retourne past/cancelled/full/open', () => {
    const today = new Date('2025-01-01T12:00:00');
    // pas de statut explicite → calculé sur la date
    expect(resolveEventStatus(makeEvent({ date: '2020-01-01' }), today)).toBe('past');
    // statut explicite prioritaire
    expect(
      resolveEventStatus(makeEvent({ date: '2030-01-01', status: 'cancelled' }), today)
    ).toBe('cancelled');
    // jauge remplie
    expect(
      resolveEventStatus(
        makeEvent({ date: '2030-01-01', maxParticipants: 10, currentParticipants: 10 }),
        today
      )
    ).toBe('full');
    // jauge non remplie
    expect(
      resolveEventStatus(
        makeEvent({ date: '2030-01-01', maxParticipants: 10, currentParticipants: 5 }),
        today
      )
    ).toBe('open');
  });

  it('resolveEventStatus sans statut ni jauge sur date future → open', () => {
    expect(resolveEventStatus(makeEvent())).toBe('open');
  });

  it('parseIsoDate parse sans décalage horaire', () => {
    const date = parseIsoDate('2024-01-15');
    expect(date?.getFullYear()).toBe(2024);
    expect(date?.getMonth()).toBe(0);
    expect(date?.getDate()).toBe(15);
    expect(parseIsoDate('15/01/2024')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
  });

  it('capitalize met la 1re lettre en majuscule', () => {
    expect(capitalize('toulouse')).toBe('Toulouse');
    expect(capitalize('TOULOUSE')).toBe('Toulouse');
    expect(capitalize('')).toBe('');
  });

  it('formatNumber groupe les milliers (fr-FR)', () => {
    expect(formatNumber(1234567)).toMatch(/1[\s\u202f\u00a0]234[\s\u202f\u00a0]567/);
  });

  it('sleep attend la durée demandée', async () => {
    vi.useFakeTimers();
    const promise = sleep(50);
    vi.advanceTimersByTime(50);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});
