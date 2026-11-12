import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import {
  assignInPlace,
  bundledContent,
  content,
  getContentValue,
  mergeWithDefaults,
  pages,
  replaceContent,
  setContentValue,
  snapshotContent,
} from '@/utils/content';
import { validateContent } from '@/utils/contentSchema';
import { DESKTOP_CTA, PRIMARY_NAV } from '@/utils/navigation';

afterEach(() => {
  replaceContent(structuredClone(bundledContent));
});

describe('assignInPlace', () => {
  it('remplace les valeurs sans changer les références imbriquées', () => {
    const target = { a: { b: 1, gone: true }, list: [{ x: 1 }, { x: 2 }] };
    const nested = target.a;
    const firstItem = target.list[0];

    assignInPlace(target, { a: { b: 2 }, list: [{ x: 3 }] });

    expect(target).toEqual({ a: { b: 2 }, list: [{ x: 3 }] });
    expect(target.a).toBe(nested);
    expect(target.list[0]).toBe(firstItem);
  });
});

describe('mergeWithDefaults', () => {
  it('complète les clés absentes et garde les valeurs distantes', () => {
    const merged = mergeWithDefaults(
      { title: 'défaut', nested: { a: 1, b: 2 }, list: [1, 2] },
      { title: 'distant', nested: { a: 9 }, list: [3] }
    );
    expect(merged).toEqual({ title: 'distant', nested: { a: 9, b: 2 }, list: [3] });
  });

  it('retombe sur les valeurs par défaut si le distant est vide', () => {
    expect(mergeWithDefaults({ a: 1 }, null)).toEqual({ a: 1 });
  });

  it('un contenu distant partiel complété reste valide', () => {
    const partial = { pages: { home: { hero: { subtitle: 'Nouveau sous-titre' } } } };
    const merged = mergeWithDefaults(bundledContent, partial);
    expect(validateContent(merged)).toEqual([]);
    expect(merged.pages.home.hero.subtitle).toBe('Nouveau sous-titre');
  });
});

describe('contenu réactif', () => {
  it('lit et écrit une valeur par chemin', () => {
    expect(getContentValue('pages.home.hero.titleLines.0')).toBe(
      bundledContent.pages.home.hero.titleLines[0]
    );
    expect(setContentValue('pages.home.hero.titleLines.0', 'Rassembler')).toBe(true);
    expect(pages.home.hero.titleLines[0]).toBe('Rassembler');
    expect(setContentValue('pages.inconnue.titre', 'x')).toBe(false);
  });

  it('replaceContent met à jour les références déjà capturées', () => {
    const home = pages.home;
    const next = snapshotContent();
    next.pages.home.events.title = 'Agenda';
    replaceContent(next);
    expect(home.events.title).toBe('Agenda');
    expect(content.pages.home).toBe(home);
  });

  it('les menus suivent les modifications du contenu', async () => {
    content.navigation.primary[0].label = 'Maison';
    content.navigation.desktopCta.label = 'Rejoindre';
    await nextTick();
    expect(PRIMARY_NAV[0].label).toBe('Maison');
    expect(DESKTOP_CTA.label).toBe('Rejoindre');
  });
});
