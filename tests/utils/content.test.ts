import { describe, expect, it } from 'vitest';

import rawContent from '@/data/content.json';
import { routeNames } from '@/router';
import { parseRichText, splitHighlight } from '@/utils/content';
import { ROUTE_KEYS, validateContent } from '@/utils/contentSchema';

describe('content.json', () => {
  it('respecte le schéma de contenu', () => {
    expect(validateContent(rawContent)).toEqual([]);
  });

  it('signale les erreurs avec leur chemin', () => {
    const broken = structuredClone(rawContent) as typeof rawContent;
    broken.pages.home.hero.primaryButton.route = 'Inconnue';
    (broken.pages.about.mission as Record<string, unknown>).titre = 'faute de frappe';

    const errors = validateContent(broken);
    expect(errors).toHaveLength(2);
    expect(errors.some((line) => line.startsWith('pages.home.hero.primaryButton.route'))).toBe(
      true
    );
    expect(errors.some((line) => line.startsWith('pages.about.mission'))).toBe(true);
  });

  it('autorise exactement les routes déclarées dans le routeur', () => {
    expect([...ROUTE_KEYS].sort()).toEqual(Object.keys(routeNames).sort());
  });
});

describe('splitHighlight', () => {
  it('met en avant le dernier mot par défaut', () => {
    expect(splitHighlight('Les événements toulousains')).toEqual({
      start: 'Les événements ',
      red: 'toulousains',
    });
  });

  it('accepte une fin de titre explicite', () => {
    expect(splitHighlight('Fédérer à Toulouse', 'à Toulouse')).toEqual({
      start: 'Fédérer ',
      red: 'à Toulouse',
    });
  });

  it('ignore une mise en avant absente du titre', () => {
    expect(splitHighlight('Actualités')).toEqual({ start: 'Actualités', red: '' });
    expect(splitHighlight('Nos partenaires', 'amis')).toEqual({
      start: 'Nos partenaires',
      red: '',
    });
  });
});

describe('parseRichText', () => {
  it('découpe texte, retours à la ligne et liens', () => {
    expect(parseRichText('Ligne 1\nVoir [les cookies](#cookies).')).toEqual([
      { type: 'text', value: 'Ligne 1' },
      { type: 'break' },
      { type: 'text', value: 'Voir ' },
      { type: 'link', label: 'les cookies', href: '#cookies' },
      { type: 'text', value: '.' },
    ]);
  });

  it('neutralise les cibles de lien dangereuses', () => {
    expect(parseRichText('[clic](javascript:alert)')).toEqual([{ type: 'text', value: 'clic' }]);
  });

  it("n'interprète pas le HTML", () => {
    expect(parseRichText('<b>gras</b>')).toEqual([{ type: 'text', value: '<b>gras</b>' }]);
  });
});
