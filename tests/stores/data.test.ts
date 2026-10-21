import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAssociationBySlug, fetchEventBySlug, fetchNewsBySlug } from '@/services/api';
import { useDataStore } from '@/stores/data';
import type { Association, EventItem, NewsItem } from '@/types';

const mockAssociations: Association[] = [
  {
    id: 'asso-test',
    name: 'Association Événement',
    category: 'esport',
    description: 'Description détaillée',
    logo: '',
    city: 'Toulouse',
    games: 'League of Legends',
  },
  {
    id: 'autre-asso',
    name: 'Autre Asso',
    category: 'retro',
    description: 'Rétrogaming et LAN',
    logo: '',
    city: 'Toulouse',
    games: 'Street Fighter',
  },
];

const mockEvents: EventItem[] = [
  {
    id: 'event-test',
    title: 'Event Test',
    date: '2025-01-01',
    category: 'esport',
    organizer: 'TEC',
    description: 'Desc',
  },
];

const mockNews: NewsItem[] = [
  {
    id: 'news-test',
    title: 'News Test',
    date: '2024-01-01',
    category: 'news',
    excerpt: 'Excerpt',
    author: 'Author',
  },
];

/** Date ISO décalée de `days` jours par rapport à aujourd’hui (évite les fixtures figées). */
function isoIn(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

const okResponse = (data: unknown) => ({ ok: true, json: () => Promise.resolve(data) });

const mockFetch = vi.fn();

/** Route le fetch mocké selon l’URL demandée (couche `services/api`). */
function mockApi(
  associations = mockAssociations,
  events = mockEvents,
  news = mockNews
): void {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('associations')) return Promise.resolve(okResponse(associations));
    if (url.includes('evenements')) return Promise.resolve(okResponse(events));
    if (url.includes('news')) return Promise.resolve(okResponse(news));
    return Promise.resolve(okResponse([]));
  });
}

describe('useDataStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    mockApi();
  });

  it('loadAll charge associations/events/news en parallèle', async () => {
    const store = useDataStore();
    await store.loadAll();
    expect(store.associations).toHaveLength(2);
    expect(store.events).toHaveLength(1);
    expect(store.news).toHaveLength(1);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.isLoaded).toBe(true);
  });

  it('loadAll est mis en cache, forceRefresh recharge', async () => {
    const store = useDataStore();
    await store.loadAll();
    const callsAfterFirst = mockFetch.mock.calls.length;
    await store.loadAll();
    expect(mockFetch.mock.calls.length).toBe(callsAfterFirst);
    await store.forceRefresh();
    expect(mockFetch.mock.calls.length).toBe(callsAfterFirst + 3);
  });

  it('loadAll capture une erreur réseau', async () => {
    const store = useDataStore();
    mockFetch.mockRejectedValue(new Error('réseau KO'));
    await store.loadAll();
    expect(store.error).toContain('réseau KO');
    expect(store.loading).toBe(false);
    expect(store.isLoaded).toBe(false);
  });

  it('loadAll capture une réponse HTTP invalide', async () => {
    const store = useDataStore();
    mockFetch.mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve([]) });
    await store.loadAll();
    expect(store.error).toContain('Erreur 404');
    expect(store.loading).toBe(false);
  });

  it('getUpcomingEvents filtre le passé et trie par date croissante', () => {
    const store = useDataStore();
    const tomorrow = isoIn(1);
    const nextWeek = isoIn(7);
    const lastWeek = isoIn(-7);
    store.events = [
      { ...mockEvents[0], id: '2', date: nextWeek },
      { ...mockEvents[0], id: '1', date: tomorrow },
      { ...mockEvents[0], id: '3', date: lastWeek },
    ];
    const upcoming = store.getUpcomingEvents(2);
    expect(upcoming).toHaveLength(2);
    expect(upcoming[0].date).toBe(tomorrow);
    expect(upcoming[1].date).toBe(nextWeek);
    expect(store.getUpcomingEvents()).toHaveLength(2);
  });

  it('sortedEvents trie du plus proche au plus lointain', () => {
    const store = useDataStore();
    store.events = [
      { ...mockEvents[0], id: 'late', date: '2030-05-01' },
      { ...mockEvents[0], id: 'soon', date: '2030-01-01' },
    ];
    expect(store.sortedEvents.map((event) => event.id)).toEqual(['soon', 'late']);
  });

  it('getLatestNews trie de la plus récente à la plus ancienne', () => {
    const store = useDataStore();
    store.news = [
      { ...mockNews[0], id: 'old', date: '2024-01-01' },
      { ...mockNews[0], id: 'new', date: '2024-06-01' },
    ];
    expect(store.getLatestNews(1)[0].id).toBe('new');
    expect(store.getLatestNews()).toHaveLength(2);
  });

  it('getEventsByCategory est insensible à la casse (vide = tout)', () => {
    const store = useDataStore();
    store.events = [
      { ...mockEvents[0], id: '1', category: 'Esport & Communauté' },
      { ...mockEvents[0], id: '2', category: 'LAN & Gaming' },
    ];
    expect(store.getEventsByCategory('esport & communauté')).toHaveLength(1);
    expect(store.getEventsByCategory('')).toHaveLength(2);
  });

  it('getAssociationBySlug retourne l’association ou undefined', () => {
    const store = useDataStore();
    store.associations = mockAssociations;
    expect(store.getAssociationBySlug('asso-test')?.name).toBe('Association Événement');
    expect(store.getAssociationBySlug('')).toBeUndefined();
    expect(store.getAssociationBySlug('inconnu')).toBeUndefined();
  });

  it('searchAssociations normalise accents/casse et supports les requêtes vides', () => {
    const store = useDataStore();
    store.associations = mockAssociations;
    expect(store.searchAssociations('EVENEMENT')).toHaveLength(1);
    expect(store.searchAssociations('événement')).toHaveLength(1);
    expect(store.searchAssociations('retro')).toHaveLength(1);
    expect(store.searchAssociations('   ')).toHaveLength(2);
  });

  it('clear réinitialise le store', async () => {
    const store = useDataStore();
    await store.loadAll();
    store.clear();
    expect(store.associations).toHaveLength(0);
    expect(store.events).toHaveLength(0);
    expect(store.news).toHaveLength(0);
    expect(store.error).toBeNull();
    expect(store.isLoaded).toBe(false);
  });
});

describe('services/api (récupération par slug)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    mockApi();
  });

  it('fetchAssociationBySlug trouve une association par id', async () => {
    await expect(fetchAssociationBySlug('asso-test')).resolves.toMatchObject({ id: 'asso-test' });
    await expect(fetchAssociationBySlug('')).resolves.toBeUndefined();
    await expect(fetchAssociationBySlug('inconnu')).resolves.toBeUndefined();
  });

  it('fetchEventBySlug / fetchNewsBySlug fonctionnent pareil', async () => {
    await expect(fetchEventBySlug('event-test')).resolves.toMatchObject({ id: 'event-test' });
    await expect(fetchNewsBySlug('news-test')).resolves.toMatchObject({ id: 'news-test' });
    await expect(fetchEventBySlug('')).resolves.toBeUndefined();
    await expect(fetchNewsBySlug('')).resolves.toBeUndefined();
  });
});
