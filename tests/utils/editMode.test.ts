import { afterEach, describe, expect, it } from 'vitest';

import { editMode, exitEditMode, syncEditModeFromUrl } from '@/editor/editMode';
import { labelFor, labelForPath, optionsFor } from '@/editor/labels';
import { slugify } from '@/editor/collections';

afterEach(() => {
  exitEditMode();
  sessionStorage.clear();
});

describe('mode édition', () => {
  it('s’active avec ?edit et persiste pendant la navigation', () => {
    syncEditModeFromUrl({ edit: '' });
    expect(editMode.active).toBe(true);

    editMode.active = false;
    syncEditModeFromUrl({});
    expect(editMode.active).toBe(true);
  });

  it('se désactive avec ?edit=0 ou « Quitter »', () => {
    syncEditModeFromUrl({ edit: '1' });
    syncEditModeFromUrl({ edit: '0' });
    expect(editMode.active).toBe(false);

    syncEditModeFromUrl({ edit: null });
    exitEditMode();
    syncEditModeFromUrl({});
    expect(editMode.active).toBe(false);
  });
});

describe('libellés de l’éditeur', () => {
  it('traduit les clés et chemins', () => {
    expect(labelFor('subtitle')).toBe('Sous-titre');
    expect(labelFor('2')).toBe('#3');
    expect(labelFor('someNewKey')).toBe('Some New Key');
    expect(labelForPath('pages.home.hero.title')).toBe('Accueil › En-tête de page › Titre');
  });

  it('propose des listes pour les champs contraints', () => {
    expect(optionsFor('pages.home.hero.primaryButton.route')?.map((o) => o.value)).toContain(
      'Events'
    );
    expect(optionsFor('site.socials.0.icon')?.map((o) => o.value)).toEqual([
      'x',
      'discord',
      'twitch',
      'instagram',
    ]);
    expect(optionsFor('pages.home.hero.title')).toBeUndefined();
  });

  it('génère des identifiants d’URL', () => {
    expect(slugify('  Tournoi Valorant Régional #2 ')).toBe('tournoi-valorant-regional-2');
  });
});
