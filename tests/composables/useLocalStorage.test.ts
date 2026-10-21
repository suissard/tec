import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLocalStorage } from '@/composables/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retourne le défaut si la clé est absente', () => {
    const { value } = useLocalStorage('missing', 'default');
    expect(value.value).toBe('default');
  });

  it('clone la valeur par défaut (aucune référence partagée)', () => {
    const sharedDefault = { count: 0 };
    const first = useLocalStorage('clone', sharedDefault);
    const second = useLocalStorage('clone', sharedDefault);
    first.value.value = { count: 1 };
    expect(second.value.value).toEqual({ count: 0 });
    expect(sharedDefault).toEqual({ count: 0 });
  });

  it('lit une valeur déjà stockée (JSON)', () => {
    localStorage.setItem('existing', JSON.stringify(41));
    const { value } = useLocalStorage('existing', 0);
    expect(value.value).toBe(41);
  });

  it('retourne le défaut si la valeur stockée est corrompue', () => {
    localStorage.setItem('broken', '{invalid json');
    const { value } = useLocalStorage('broken', 'fallback');
    expect(value.value).toBe('fallback');
  });

  it('écrit automatiquement dans localStorage (watch sync)', () => {
    const { value } = useLocalStorage('test', 0);
    value.value = 42;
    expect(localStorage.getItem('test')).toBe('42');
    expect(value.value).toBe(42);
  });

  it('remove supprime la clé et restaure le défaut', () => {
    const { value, remove } = useLocalStorage('test', 'a');
    value.value = 'b';
    remove();
    expect(localStorage.getItem('test')).toBeNull();
    expect(value.value).toBe('a');
  });

  it('tolère un localStorage indisponible à l’écriture', async () => {
    const { value } = useLocalStorage('private', 'a');
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(() => {
      value.value = 'b';
    }).not.toThrow();
    expect(value.value).toBe('b');
    setItem.mockRestore();
  });
});
