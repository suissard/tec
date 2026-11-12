import { afterEach, describe, expect, it, vi } from 'vitest';

import rawContent from '@/data/content.json';

const PB_URL = 'http://pb.test';

/** Réponse de liste PocketBase. */
function list(items: unknown[]) {
  return { ok: true, status: 200, json: async () => ({ page: 1, perPage: 500, items }) };
}

/** Recharge les modules avec PocketBase activé (URL lue à l'import). */
async function loadWithPocketBase() {
  vi.stubEnv('VITE_POCKETBASE_URL', `${PB_URL}/`);
  vi.resetModules();
  return {
    pb: await import('@/services/pocketbase'),
    api: await import('@/services/api'),
    content: await import('@/utils/content'),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('services/pocketbase', () => {
  it('convertit un enregistrement en association (slug → id, fichier prioritaire)', async () => {
    const { pb } = await loadWithPocketBase();
    expect(pb.POCKETBASE_URL).toBe(PB_URL);
    const association = pb.toAssociation({
      id: 'abc',
      collectionId: 'col1',
      collectionName: 'associations',
      slug: 'osv-esport',
      name: 'OSV',
      category: 'esport',
      description: 'desc',
      email: '',
      logo: '/media/osv.png',
      logoFile: 'logo_x1.webp',
      games: 'LoL',
      city: '',
    });
    expect(association).toEqual({
      id: 'osv-esport',
      name: 'OSV',
      category: 'esport',
      description: 'desc',
      logo: `${PB_URL}/api/files/col1/abc/logo_x1.webp`,
      games: 'LoL',
    });
  });

  it('ignore les nombres et statuts vides des événements', async () => {
    const { pb } = await loadWithPocketBase();
    const event = pb.toEvent({
      id: 'e1',
      collectionId: 'c',
      collectionName: 'events',
      slug: 'lan',
      title: 'LAN',
      date: '2026-10-18',
      category: 'LAN',
      organizer: 'TEC',
      description: 'd',
      maxParticipants: 0,
      status: '',
      image: '/media/lan.jpg',
      imageFile: '',
    });
    expect(event.maxParticipants).toBeUndefined();
    expect(event.status).toBeUndefined();
    expect(event.image).toBe('/media/lan.jpg');
  });

  it('lit les associations depuis PocketBase', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        list([
          {
            id: '1',
            collectionId: 'c',
            collectionName: 'associations',
            slug: 'voxel',
            name: 'Voxel',
            category: 'retro',
            description: 'd',
            logo: '/l.png',
          },
        ])
      );
    vi.stubGlobal('fetch', fetchMock);
    const { api } = await loadWithPocketBase();

    const result = await api.fetchAssociations();
    expect(result.map((item) => item.id)).toEqual(['voxel']);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      `${PB_URL}/api/collections/associations/records`
    );
  });

  it('retombe sur le JSON local si PocketBase est injoignable', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [{ id: 'json-asso' }] });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { api } = await loadWithPocketBase();

    const result = await api.fetchAssociations();
    expect(result).toEqual([{ id: 'json-asso' }]);
    expect(String(fetchMock.mock.calls[1][0])).toContain('/data/associations.json');
  });
});

describe('loadRemoteContent', () => {
  it('applique le contenu distant valide', async () => {
    const remote = structuredClone(rawContent);
    remote.pages.home.hero.subtitle = 'Depuis PocketBase';
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          list([
            {
              id: 'r1',
              collectionId: 'c',
              collectionName: 'site_content',
              data: remote,
              updated: '2026-11-12',
            },
          ])
        )
    );
    const { content } = await loadWithPocketBase();

    await expect(content.loadRemoteContent()).resolves.toBe(true);
    expect(content.pages.home.hero.subtitle).toBe('Depuis PocketBase');
    expect(content.contentState).toMatchObject({ source: 'pocketbase', recordId: 'r1' });
  });

  it('garde les textes embarqués si le contenu distant est invalide', async () => {
    const remote = structuredClone(rawContent) as Record<string, unknown>;
    (remote.pages as Record<string, Record<string, unknown>>).home.hero = { titleLines: [] };
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          list([{ id: 'r1', collectionId: 'c', collectionName: 'site_content', data: remote }])
        )
    );
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { content } = await loadWithPocketBase();

    await expect(content.loadRemoteContent()).resolves.toBe(false);
    expect(content.pages.home.hero.titleLines).toEqual(rawContent.pages.home.hero.titleLines);
    expect(content.contentState.errors.length).toBeGreaterThan(0);
  });

  it('ne fait rien sans PocketBase configuré', async () => {
    vi.resetModules();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { loadRemoteContent } = await import('@/utils/content');
    await expect(loadRemoteContent()).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
