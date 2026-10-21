import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { fetchAssociations, fetchEvents, fetchNews } from '@/services/api';
import type { Association, EventItem, NewsItem } from '@/types';

/** Normalise une chaîne pour la recherche (minuscules + sans accents). */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Store des données métier (associations, événements, actualités).
 * Chargement parallèle des 3 JSON locaux via `services/api`, avec cache :
 * `loadAll()` ne recharge que si le store est vide (`forceRefresh()` force).
 */
export const useDataStore = defineStore('data', () => {
  /* ---------------------------------------------------------------- state */
  const associations = ref<Association[]>([]);
  const events = ref<EventItem[]>([]);
  const news = ref<NewsItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /* -------------------------------------------------------------- getters */
  /**
   * Événements triés du plus proche au plus lointain.
   *
   * @returns `ComputedRef<EventItem[]>`
   */
  const sortedEvents = computed(() =>
    [...events.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  );

  /**
   * Actualités triées de la plus récente à la plus ancienne.
   *
   * @returns `ComputedRef<NewsItem[]>`
   */
  const sortedNews = computed(() =>
    [...news.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );

  /**
   * Vrai quand les 3 jeux de données sont chargés (utilisé comme cache).
   *
   * @returns `ComputedRef<boolean>`
   */
  const isLoaded = computed(
    () => associations.value.length > 0 && events.value.length > 0 && news.value.length > 0
  );

  /**
   * Récupère une association par son identifiant ("slug" = id dans le JSON).
   *
   * @param slug Identifiant de l'association
   * @returns L'association trouvée, ou `undefined`
   */
  function getAssociationBySlug(slug: string): Association | undefined {
    if (!slug) return undefined;
    return associations.value.find((association) => association.id === slug);
  }

  /**
   * Événements à venir (date >= aujourd'hui), triés par date croissante.
   *
   * @param limit Nombre maximum d'événements retournés (optionnel)
   * @returns Liste triée des événements à venir
   */
  function getUpcomingEvents(limit?: number): EventItem[] {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = sortedEvents.value.filter((event) => event.date >= today);
    return limit !== undefined ? upcoming.slice(0, limit) : upcoming;
  }

  /**
   * Dernières actualités (date décroissante).
   *
   * @param limit Nombre maximum d'actualités retournées (optionnel)
   * @returns Liste triée des actualités
   */
  function getLatestNews(limit?: number): NewsItem[] {
    return limit !== undefined ? sortedNews.value.slice(0, limit) : sortedNews.value;
  }

  /**
   * Événements d'une catégorie (insensible à la casse et aux accents).
   *
   * @param category Catégorie recherchée (vide = tous les événements)
   * @returns Événements correspondants
   */
  function getEventsByCategory(category: string): EventItem[] {
    const wanted = normalize(category);
    if (!wanted) return sortedEvents.value;
    return sortedEvents.value.filter((event) => normalize(event.category) === wanted);
  }

  /**
   * Recherche textuelle dans les associations (nom, description, jeux, catégorie).
   *
   * @param query Recherche multi-termes (les accents et la casse sont ignorés)
   * @returns Associations correspondant à tous les termes saisis
   */
  function searchAssociations(query: string): Association[] {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return associations.value;

    return associations.value.filter((association) => {
      const haystack = normalize(
        [association.name, association.description, association.games, association.category]
          .filter((field): field is string => typeof field === 'string')
          .join(' ')
      );
      return terms.every((term) => haystack.includes(term));
    });
  }

  /* -------------------------------------------------------------- actions */
  /**
   * Charge en parallèle les 3 JSON métier (associations, événements, actualités).
   * Sans effet si les données sont déjà en cache, sauf `options.force`.
   *
   * @param options `{ force?: boolean }` — `force: true` recharge systématiquement
   * @returns `Promise<void>` — en cas d'erreur, `error` est renseigné (pas de throw)
   */
  async function loadAll(options: { force?: boolean } = {}): Promise<void> {
    if (!options.force && isLoaded.value) return;

    loading.value = true;
    error.value = null;
    try {
      const [associationList, eventList, newsList] = await Promise.all([
        fetchAssociations(),
        fetchEvents(),
        fetchNews(),
      ]);
      associations.value = associationList;
      events.value = eventList;
      news.value = newsList;
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Erreur de chargement des données';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Recharge les données même si le store est déjà rempli.
   *
   * @returns `Promise<void>`
   */
  function forceRefresh(): Promise<void> {
    return loadAll({ force: true });
  }

  /**
   * Vide le store (données, chargement et erreur réinitialisés).
   * @returns `{void}`
   */
  function clear(): void {
    associations.value = [];
    events.value = [];
    news.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    associations,
    events,
    news,
    loading,
    error,
    sortedEvents,
    sortedNews,
    isLoaded,
    getAssociationBySlug,
    getUpcomingEvents,
    getLatestNews,
    getEventsByCategory,
    searchAssociations,
    loadAll,
    forceRefresh,
    clear,
  };
});
