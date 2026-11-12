/**
 * Accès en lecture à PocketBase (sans SDK, pour garder le bundle public léger).
 *
 * PocketBase est **optionnel** : sans `VITE_POCKETBASE_URL`, le site lit les JSON
 * de `src/data/` comme avant. Avec l'URL, les données viennent de la base et les
 * JSON servent de repli si le serveur est injoignable.
 *
 * L'écriture (admin, mode édition) passe par le SDK officiel, chargé à la
 * demande dans `src/editor/pb.ts`.
 */
import type { Association, EventItem, NewsItem } from '@/types';

/** URL du serveur PocketBase, sans slash final (vide = désactivé). */
export const POCKETBASE_URL = (import.meta.env.VITE_POCKETBASE_URL ?? '')
  .trim()
  .replace(/\/+$/, '');

/** Vrai si le site est branché sur PocketBase. */
export const isPocketBaseEnabled = POCKETBASE_URL.length > 0;

/** Enregistrement PocketBase brut (champs système + champs libres). */
export interface PbRecord {
  id: string;
  collectionId: string;
  collectionName: string;
  created?: string;
  updated?: string;
  [key: string]: unknown;
}

interface PbListResult<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

/**
 * GET JSON sur l'API PocketBase, avec délai maximum.
 *
 * @param path Chemin d'API (ex. `/api/collections/news/records`)
 * @param timeoutMs Délai avant abandon (ms)
 * @throws Error si le serveur est injoignable, lent ou répond en erreur
 */
async function pbGet<T>(path: string, timeoutMs = 4000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${POCKETBASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`PocketBase ${response.status} sur ${path}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Récupère tous les enregistrements publics d'une collection.
 *
 * @param collection Nom de la collection
 * @param sort Tri PocketBase (ex. `sort,name`, `-date`)
 * @param timeoutMs Délai maximum par requête
 */
export async function pbListAll(
  collection: string,
  sort = '',
  timeoutMs?: number
): Promise<PbRecord[]> {
  const items: PbRecord[] = [];
  let page = 1;
  for (;;) {
    const query = new URLSearchParams({ page: String(page), perPage: '500', skipTotal: '1' });
    if (sort) query.set('sort', sort);
    const result = await pbGet<PbListResult<PbRecord>>(
      `/api/collections/${collection}/records?${query.toString()}`,
      timeoutMs
    );
    items.push(...result.items);
    if (result.items.length < 500) return items;
    page += 1;
  }
}

/**
 * Récupère le premier enregistrement correspondant à un filtre.
 *
 * @returns L'enregistrement, ou `undefined` si aucun ne correspond
 */
export async function pbFirst(
  collection: string,
  filter: string,
  timeoutMs?: number
): Promise<PbRecord | undefined> {
  const query = new URLSearchParams({ page: '1', perPage: '1', skipTotal: '1', filter });
  const result = await pbGet<PbListResult<PbRecord>>(
    `/api/collections/${collection}/records?${query.toString()}`,
    timeoutMs
  );
  return result.items[0];
}

/**
 * URL publique d'un fichier téléversé dans PocketBase.
 *
 * @param record Enregistrement propriétaire du fichier
 * @param filename Nom du fichier (valeur du champ `file`)
 * @param thumb Miniature facultative (ex. `400x0`)
 */
export function pbFileUrl(
  record: Pick<PbRecord, 'id' | 'collectionId' | 'collectionName'>,
  filename: string,
  thumb?: string
): string {
  const base = `${POCKETBASE_URL}/api/files/${record.collectionId || record.collectionName}/${record.id}/${encodeURIComponent(filename)}`;
  return thumb ? `${base}?thumb=${encodeURIComponent(thumb)}` : base;
}

/* ==========================================================================
   Conversion enregistrement PocketBase → types du site
   (le `slug` PocketBase devient l'`id` utilisé par le site et les URL)
   ========================================================================== */

/** Chaîne non vide, sinon `undefined` (PocketBase renvoie `""` pour un champ vide). */
function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

/** Nombre strictement renseigné (PocketBase renvoie `0` pour un champ vide). */
function num(value: unknown): number | undefined {
  return typeof value === 'number' && value > 0 ? value : undefined;
}

/** Image : fichier téléversé prioritaire, sinon chemin/URL saisi. */
function image(record: PbRecord, fileField: string, pathField: string): string | undefined {
  const file = str(record[fileField]);
  return file ? pbFileUrl(record, file) : str(record[pathField]);
}

/** Supprime les clés `undefined` (objets identiques à ceux des JSON). */
function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

export function toAssociation(record: PbRecord): Association {
  return compact({
    id: String(record.slug),
    name: String(record.name ?? ''),
    category: String(record.category ?? ''),
    description: String(record.description ?? ''),
    email: str(record.email),
    logo: image(record, 'logoFile', 'logo') ?? '',
    imgClass: str(record.imgClass),
    games: str(record.games),
    website: str(record.website),
    city: str(record.city),
    discord: str(record.discord),
  });
}

export function toEvent(record: PbRecord): EventItem {
  const status = str(record.status) as EventItem['status'];
  return compact({
    id: String(record.slug),
    title: String(record.title ?? ''),
    date: String(record.date ?? ''),
    category: String(record.category ?? ''),
    organizer: String(record.organizer ?? ''),
    description: String(record.description ?? ''),
    badgeColor: str(record.badgeColor),
    location: str(record.location),
    url: str(record.url),
    endDate: str(record.endDate),
    registrationUrl: str(record.registrationUrl),
    maxParticipants: num(record.maxParticipants),
    currentParticipants: num(record.currentParticipants),
    status,
    image: image(record, 'imageFile', 'image'),
    associationId: str(record.associationId),
  });
}

export function toNews(record: PbRecord): NewsItem {
  return compact({
    id: String(record.slug),
    title: String(record.title ?? ''),
    date: String(record.date ?? ''),
    category: String(record.category ?? ''),
    excerpt: String(record.excerpt ?? ''),
    content: str(record.content),
    author: String(record.author ?? ''),
    image: image(record, 'imageFile', 'image'),
    featured: record.featured === true ? true : undefined,
    readTime: num(record.readTime),
  });
}
