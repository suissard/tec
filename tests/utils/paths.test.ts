import { describe, expect, it } from 'vitest';

import { publicUrl } from '@/utils/paths';

describe('publicUrl', () => {
  it('préfixe un chemin absolu avec le base courant (ici `/`)', () => {
    expect(publicUrl('/media/logo.svg')).toBe('/media/logo.svg');
  });

  it('ajoute le slash initial manquant', () => {
    expect(publicUrl('media/logo.svg')).toBe('/media/logo.svg');
  });

  it('laisse intactes les URL protocol-relative', () => {
    expect(publicUrl('//media/logo.svg')).toBe('//media/logo.svg');
  });

  it('laisse intactes les URL absolues externes', () => {
    expect(publicUrl('https://placehold.co/200x200')).toBe('https://placehold.co/200x200');
    expect(publicUrl('http://example.com/a.png')).toBe('http://example.com/a.png');
    expect(publicUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
  });

  it('résout les fichiers de données', () => {
    expect(publicUrl('data/news.json')).toBe('/data/news.json');
  });
});
