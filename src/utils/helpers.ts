/**
 * Helpers purs (pas de dépendance Vue).
 */

import type { EventItem, EventStatus } from '@/types';

/**
 * Résout le statut affichable d'un événement (statut explicite, date ou jauge).
 *
 * @param event Événement à évaluer
 * @param today Date de référence (défaut : aujourd'hui)
 * @returns `'open' | 'full' | 'cancelled' | 'past'`
 * @example
 * resolveEventStatus({ date: '2020-01-01', ... } as EventItem); // 'past'
 */
export function resolveEventStatus(event: EventItem, today = new Date()): EventStatus {
  if (event.status) return event.status;
  const isoToday = today.toISOString().slice(0, 10);
  if (event.date < isoToday) return 'past';
  if (
    typeof event.maxParticipants === 'number' &&
    typeof event.currentParticipants === 'number' &&
    event.currentParticipants >= event.maxParticipants
  ) {
    return 'full';
  }
  return 'open';
}

/**
 * Formate une date ISO (AAAA-MM-JJ) en français : "15 octobre 2026".
 *
 * @param isoDate Date au format `AAAA-MM-JJ`
 * @returns Date longue formatée, ou la chaîne d'entrée si elle est invalide
 * @example
 * formatDateLong('2026-10-15'); // "15 octobre 2026"
 */
export function formatDateLong(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return isoDate;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Formate une date ISO en court majuscule : "15 OCT."
 *
 * @param isoDate Date au format `AAAA-MM-JJ`
 * @returns Date courte en majuscules, ou la chaîne d'entrée si elle est invalide
 * @example
 * formatDateShort('2026-10-15'); // "15 OCT."
 */
export function formatDateShort(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return isoDate;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
    .format(date)
    .toUpperCase();
}

/**
 * Parse une date "AAAA-MM-JJ" sans décalage de fuseau horaire.
 *
 * @param isoDate Chaîne à parser
 * @returns `Date` locale, ou `null` si le format est invalide
 * @example
 * parseIsoDate('2026-10-15'); // Date(2026, 9, 15)
 * parseIsoDate('15/10/2026'); // null
 */
export function parseIsoDate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Met en majuscule la 1re lettre et minuscule le reste.
 *
 * @param value Chaîne à normaliser
 * @returns Chaîne capitalisée (ou chaîne vide si `value` est vide)
 * @example
 * capitalize('toulouse'); // "Toulouse"
 */
export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/**
 * Tronque un texte à `maxLength` caractères avec une ellipsis.
 *
 * @param text Texte source
 * @param maxLength Longueur maximale (caractères)
 * @returns Texte tronqué (inchangé s'il est déjà plus court)
 * @example
 * truncate('Bienvenue à Toulouse', 10); // "Bienvenue…"
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

/**
 * Formate un nombre avec séparateur de milliers (fr-FR).
 *
 * @param value Nombre à formater
 * @returns Chaîne localisée (ex. `1250` → `"1 250"`)
 * @example
 * formatNumber(1250); // "1 250"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

/**
 * Regroupe une liste d'éléments par la valeur d'un champ textuel.
 * Les clés vides (`''`, `undefined`) sont ignorées ; l'ordre d'apparition
 * des groupes est préservé.
 *
 * @param items Liste à regrouper
 * @param field Champ textuel servant de clé de regroupement
 * @returns Objet `{ [valeur]: éléments[] }`
 * @example
 * groupBy(events, 'category'); // { 'LAN & Gaming': [...], 'Esport & Communauté': [...] }
 */
export function groupBy<T, K extends keyof T>(items: readonly T[], field: K): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const raw = item[field];
    if (typeof raw !== 'string') continue;
    const key = raw.trim();
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

/**
 * Génère un identifiant aléatoire court (toasts, ids temporaires).
 *
 * @param prefix Préfixe technique (défaut : `'uid'`)
 * @returns Identifiant unique suffisamment court pour le DOM
 * @example
 * uid('toast'); // "toast-x7k2m9q"
 */
export function uid(prefix = 'uid'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Dormir `ms` millisecondes (utile pour les tests UI).
 *
 * @param ms Durée d'attente en millisecondes
 * @returns `Promise<void>` résolue après le délai
 * @example
 * await sleep(50); // laisse l'animation de toast se terminer
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
