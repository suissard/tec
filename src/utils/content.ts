/**
 * Accès typé au contenu éditorial du site.
 *
 * Tous les textes des pages sont déclarés dans `src/data/content.json` : le JSON
 * est importé statiquement, donc **embarqué au build** — toute modification du
 * fichier est prise en compte au prochain `npm run build` (ou à chaud en dev).
 * Sa structure est vérifiée au build par `contentSchema` (cf. `vite.config.ts`).
 */
import rawContent from '@/data/content.json';

import type { SiteContent } from './contentSchema';

/** Contenu complet (validé au build, simple typage à l'exécution). */
export const content = rawContent as SiteContent;

/** Raccourci vers les textes des pages. */
export const pages = content.pages;

/** Raccourci vers les textes du layout (bandeau, CTA, footer, cookies). */
export const layout = content.layout;

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
