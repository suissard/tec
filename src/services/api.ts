/**
 * Couche d'accès aux données (fetch JSON local / API future).
 * Centralise la logique HTTP et la gestion d'erreurs.
 */

import type { Association, EventItem, NewsItem } from '@/types';
import { publicUrl } from '@/utils/paths';

/** Erreur métier levée par la couche API */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Résout une URL depuis la racine publique, en tenant compte du `base` Vite
 * (ex. `/tec/` sur GitHub Pages).
 */
function resolvePublicUrl(path: string): string {
  return publicUrl(path);
}

/**
 * GET générique typé (JSON attendu).
 *
 * @param path Chemin relatif servable depuis la racine publique (ex. `/data/news.json`)
 * @param init Options `fetch` complémentaires (headers, signal…)
 * @returns `Promise<T>` — corps de réponse parsé
 * @throws {@link ApiError} Erreur réseau, HTTP non-2xx ou JSON invalide
 * @example
 * const items = await apiGet<NewsItem[]>('/data/news.json');
 */
export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(resolvePublicUrl(path), {
      headers: { Accept: 'application/json' },
      ...init,
    });
  } catch (error) {
    throw new ApiError(
      `Impossible de joindre le serveur pour "${path}" : ${
        error instanceof Error ? error.message : 'erreur réseau'
      }`
    );
  }

  if (!response.ok) {
    throw new ApiError(`Erreur ${response.status} lors de la requête "${path}"`, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(`Réponse invalide (JSON attendu) pour "${path}"`, response.status);
  }
}

/* ==========================================================================
   Endpoints spécifiques (données JSON locales du site vanilla)
   ========================================================================== */

/** Charge la liste des associations membres */
export function fetchAssociations(): Promise<Association[]> {
  return apiGet<Association[]>('/data/associations.json');
}

/** Charge la liste des événements */
export function fetchEvents(): Promise<EventItem[]> {
  return apiGet<EventItem[]>('/data/evenements.json');
}

/** Charge la liste des actualités */
export function fetchNews(): Promise<NewsItem[]> {
  return apiGet<NewsItem[]>('/data/news.json');
}

/** Récupère une association par son slug (= identifiant du JSON) */
export async function fetchAssociationBySlug(slug: string): Promise<Association | undefined> {
  if (!slug) return undefined;
  const associations = await fetchAssociations();
  return associations.find((association) => association.id === slug);
}

/** Récupère un événement par son slug (= identifiant du JSON) */
export async function fetchEventBySlug(slug: string): Promise<EventItem | undefined> {
  if (!slug) return undefined;
  const events = await fetchEvents();
  return events.find((event) => event.id === slug);
}

/** Récupère une actualité par son slug (= identifiant du JSON) */
export async function fetchNewsBySlug(slug: string): Promise<NewsItem | undefined> {
  if (!slug) return undefined;
  const news = await fetchNews();
  return news.find((item) => item.id === slug);
}
