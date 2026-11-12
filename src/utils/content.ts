/**
 * Accès typé au contenu éditorial du site.
 *
 * Source des textes, par ordre de priorité :
 * 1. PocketBase (collection `site_content`, enregistrement `key = "main"`) si
 *    `VITE_POCKETBASE_URL` est défini — chargé au démarrage par `loadRemoteContent()` ;
 * 2. `src/data/content.json`, **embarqué au build** : valeur initiale et repli
 *    si la base est injoignable ou renvoie un contenu invalide.
 *
 * `content` est un objet **réactif** : le contenu distant (ou les modifications
 * du mode édition) est fusionné *en place*, de sorte que les composants qui ont
 * gardé une référence (`const texts = pages.home`) se mettent à jour.
 */
import { reactive } from 'vue';

import rawContent from '@/data/content.json';
import { isPocketBaseEnabled, pbFirst } from '@/services/pocketbase';

import type { SiteContent } from './contentSchema';

/** Contenu embarqué au build (validé par `contentSchema`, cf. `vite.config.ts`). */
export const bundledContent = rawContent as SiteContent;

/** Contenu courant (réactif). */
export const content = reactive(structuredClone(bundledContent)) as SiteContent;

/** Raccourci vers les textes des pages. */
export const pages = content.pages;

/** Raccourci vers les textes du layout (bandeau, CTA, footer, cookies). */
export const layout = content.layout;

/** Origine du contenu affiché et identifiant de l'enregistrement PocketBase. */
export const contentState = reactive({
  source: 'bundled' as 'bundled' | 'pocketbase',
  recordId: null as string | null,
  /** Date de dernière modification côté base (ISO) */
  updated: null as string | null,
  /** Erreurs de validation du contenu distant (vide si valide) */
  errors: [] as string[],
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Remplace le contenu de `target` par celui de `source` **sans changer les
 * références** des objets/tableaux imbriqués (indispensable à la réactivité des
 * composants qui ont capturé un sous-objet).
 */
export function assignInPlace(target: Record<string, unknown> | unknown[], source: unknown): void {
  if (Array.isArray(target) && Array.isArray(source)) {
    source.forEach((item, index) => {
      const current = target[index];
      if (
        (isPlainObject(current) && isPlainObject(item)) ||
        (Array.isArray(current) && Array.isArray(item))
      ) {
        assignInPlace(current as Record<string, unknown>, item);
      } else {
        target[index] = structuredClone(item);
      }
    });
    target.length = source.length;
    return;
  }
  if (!isPlainObject(target) || !isPlainObject(source)) return;

  for (const key of Object.keys(target)) {
    if (!(key in source)) delete target[key];
  }
  for (const [key, value] of Object.entries(source)) {
    const current = target[key];
    if (
      (isPlainObject(current) && isPlainObject(value)) ||
      (Array.isArray(current) && Array.isArray(value))
    ) {
      assignInPlace(current as Record<string, unknown>, value);
    } else {
      target[key] = structuredClone(value);
    }
  }
}

/**
 * Complète un contenu distant avec les valeurs embarquées : une clé ajoutée
 * dans le code après la dernière sauvegarde en base reçoit sa valeur par défaut.
 * Les tableaux distants remplacent ceux par défaut.
 */
export function mergeWithDefaults<T>(defaults: T, remote: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(remote)) {
    return (remote === undefined || remote === null ? defaults : remote) as T;
  }
  const out: Record<string, unknown> = { ...remote };
  for (const [key, value] of Object.entries(defaults)) {
    out[key] = key in remote ? mergeWithDefaults(value, remote[key]) : value;
  }
  return out as T;
}

/** Copie profonde et non réactive du contenu courant (pour sauvegarde). */
export function snapshotContent(): SiteContent {
  return JSON.parse(JSON.stringify(content)) as SiteContent;
}

/** Remplace tout le contenu courant (mise à jour réactive en place). */
export function replaceContent(next: SiteContent): void {
  assignInPlace(content as unknown as Record<string, unknown>, next);
}

/**
 * Charge le contenu depuis PocketBase et l'applique s'il est valide.
 * Sans effet si PocketBase n'est pas configuré ; ne lève jamais d'erreur.
 *
 * @param timeoutMs Délai maximum d'attente de la base
 * @returns `true` si le contenu distant a été appliqué
 */
export async function loadRemoteContent(timeoutMs = 2500): Promise<boolean> {
  if (!isPocketBaseEnabled) return false;
  try {
    const record = await pbFirst('site_content', 'key="main"', timeoutMs);
    if (!record) return false;

    const merged = mergeWithDefaults(bundledContent, record.data);
    // Zod n'est chargé qu'ici (hors bundle initial).
    const { validateContent } = await import('./contentSchema');
    const errors = validateContent(merged);
    contentState.errors = errors;
    contentState.recordId = record.id;
    contentState.updated = record.updated ?? null;
    if (errors.length > 0) {
      console.warn('[content] Contenu PocketBase invalide, textes embarqués conservés :', errors);
      return false;
    }
    replaceContent(merged);
    contentState.source = 'pocketbase';
    return true;
  } catch (error) {
    console.warn(
      '[content] PocketBase injoignable, textes embarqués utilisés :',
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

/**
 * Lit une valeur du contenu par chemin (`pages.home.hero.title`).
 *
 * @returns La valeur, ou `undefined` si le chemin n'existe pas
 */
export function getContentValue(path: string): unknown {
  let current: unknown = content;
  for (const key of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Écrit une valeur du contenu par chemin (`pages.about.team.members.0.name`).
 *
 * @returns `true` si le chemin existait et a été mis à jour
 */
export function setContentValue(path: string, value: unknown): boolean {
  const keys = path.split('.');
  const last = keys.pop();
  if (last === undefined) return false;
  const parent = keys.length > 0 ? getContentValue(keys.join('.')) : content;
  if (parent === null || typeof parent !== 'object') return false;
  (parent as Record<string, unknown>)[last] = value;
  return true;
}

/**
 * Découpe un titre en partie neutre + partie mise en avant (en rouge).
 * Sans `highlight`, c'est le dernier mot qui est mis en avant.
 *
 * @param title Titre complet
 * @param highlight Fin du titre à mettre en avant (facultatif)
 * @returns `{ start, red }` — `red` vide si rien n'est mis en avant
 */
export function splitHighlight(title: string, highlight?: string): { start: string; red: string } {
  const trimmed = title.trim();
  const red =
    highlight ?? (trimmed.includes(' ') ? trimmed.slice(trimmed.lastIndexOf(' ') + 1) : '');
  if (!red || !trimmed.endsWith(red)) return { start: trimmed, red: '' };
  return { start: trimmed.slice(0, trimmed.length - red.length), red };
}

/** Fragment de texte enrichi (cf. `RichText`). */
export type RichSegment =
  | { type: 'text'; value: string }
  | { type: 'break' }
  | { type: 'link'; label: string; href: string };

const LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Cibles autorisées (bloque notamment `javascript:`). */
const SAFE_HREF = /^(\/|#|mailto:|tel:|https?:\/\/)/i;

/**
 * Découpe un texte du JSON en segments : texte, retours à la ligne (`\n`) et
 * liens Markdown `[libellé](cible)`. Aucun HTML n'est interprété (pas de XSS).
 *
 * @param source Texte brut du JSON
 * @returns Segments dans l'ordre d'affichage
 */
export function parseRichText(source: string): RichSegment[] {
  const segments: RichSegment[] = [];

  const pushText = (value: string): void => {
    value.split('\n').forEach((line, index) => {
      if (index > 0) segments.push({ type: 'break' });
      if (line) segments.push({ type: 'text', value: line });
    });
  };

  let cursor = 0;
  for (const match of source.matchAll(LINK_PATTERN)) {
    const start = match.index ?? 0;
    pushText(source.slice(cursor, start));
    if (SAFE_HREF.test(match[2])) {
      segments.push({ type: 'link', label: match[1], href: match[2] });
    } else {
      pushText(match[1]);
    }
    cursor = start + match[0].length;
  }
  pushText(source.slice(cursor));

  return segments;
}
