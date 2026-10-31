import { describe, expect, it } from 'vitest';

import { routeNames } from '@/router';
import {
  CONTACT_NAV,
  DESKTOP_CTA,
  MAIN_NAV,
  MOBILE_ACTIONS,
  PRIMARY_NAV,
} from '@/utils/navigation';

/** Extrait le nom de route d'un lien résolu. */
function routeNameOf(link: { to: unknown }): string {
  return (link.to as { name: string }).name;
}

describe('navigation', () => {
  it('le menu mobile reprend exactement les liens du menu desktop', () => {
    expect(MAIN_NAV.map((item) => item.label)).toEqual([
      ...PRIMARY_NAV.map((item) => item.label),
      CONTACT_NAV.label,
    ]);
    expect(MAIN_NAV).toHaveLength(PRIMARY_NAV.length + 1);
  });

  it("n'expose plus de raccourci vers les actualités", () => {
    expect(MAIN_NAV.map((item) => item.label)).not.toContain('Actualités');
    expect(MAIN_NAV.map(routeNameOf)).not.toContain(routeNames.News);
  });

  it('résout chaque lien en route nommée valide', () => {
    const validNames = new Set<string>(Object.values(routeNames));

    for (const link of [...MAIN_NAV, DESKTOP_CTA, ...MOBILE_ACTIONS]) {
      expect(validNames.has(routeNameOf(link))).toBe(true);
    }
  });

  it('conserve les CTA attendus', () => {
    expect(DESKTOP_CTA.label).toBe('Adhérer');
    expect(routeNameOf(DESKTOP_CTA)).toBe(routeNames.Adhesion);
    expect(MOBILE_ACTIONS.map((action) => action.label)).toEqual(['Adhésion', 'Bénévolat']);
    expect(MOBILE_ACTIONS.map((action) => action.variant)).toEqual(['primary', 'outline']);
  });
});
