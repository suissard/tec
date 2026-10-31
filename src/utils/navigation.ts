/**
 * Source unique des raccourcis du menu principal (en-tête desktop et mobile).
 *
 * Les libellés/route sont déclarés dans `src/data/content.json` (clé
 * `navigation`) ; ce module les résout en objets `RouterLink` typés. Le menu
 * mobile est construit à partir des **mêmes** liens que le menu desktop
 * (`MAIN_NAV`) afin d'éviter toute divergence (ex. un raccourci présent
 * uniquement sur petit écran).
 */
import type { RouteLocationRaw } from 'vue-router';

import { routeNames } from '@/router';
import { content } from '@/utils/content';
import type { ContentLink } from '@/utils/contentSchema';

/** Clés de routes autorisées (miroir de l'enum `routeNames`). */
export type NavRouteKey = keyof typeof routeNames;

/** Variantes de boutons acceptées dans le panneau mobile. */
export type NavActionVariant = 'primary' | 'outline';

/** Lien de navigation résolu, prêt pour `<RouterLink>`. */
export interface NavLink {
  label: string;
  to: RouteLocationRaw;
}

/** Action du panneau mobile (bouton CTA). */
export interface NavAction extends NavLink {
  variant: NavActionVariant;
}

/**
 * Convertit un lien du contenu JSON en objet `RouterLink`.
 *
 * @param item Lien brut (`route` = clé de `routeNames`, `hash` facultatif)
 * @returns Lien résolu (`to: { name, hash? }`)
 * @throws Error si la route déclarée n'existe pas (garde-fou de configuration)
 */
export function toLink(item: ContentLink): NavLink {
  if (!(item.route in routeNames)) {
    throw new Error(
      `[navigation] Route inconnue "${item.route}". Valeurs possibles : ${Object.keys(
        routeNames
      ).join(', ')}`
    );
  }

  const name = routeNames[item.route as NavRouteKey];
  return {
    label: item.label,
    to: item.hash ? { name, hash: `#${item.hash}` } : { name },
  };
}

const navigation = content.navigation;

/** Liens du menu principal (colonne de gauche sur desktop). */
export const PRIMARY_NAV: readonly NavLink[] = navigation.primary.map(toLink);

/** Lien Contact (à droite sur desktop, dans la liste sur mobile). */
export const CONTACT_NAV: NavLink = toLink(navigation.contact);

/**
 * Liens communs aux deux menus : c'est **la** liste affichée en mobile, et
 * celle dont le desktop reprend `PRIMARY_NAV` + `CONTACT_NAV`.
 */
export const MAIN_NAV: readonly NavLink[] = [...PRIMARY_NAV, CONTACT_NAV];

/** CTA « Adhérer » de l'en-tête desktop. */
export const DESKTOP_CTA: NavLink = toLink(navigation.desktopCta);

/** Boutons d'action du panneau mobile (sous la navigation). */
export const MOBILE_ACTIONS: readonly NavAction[] = navigation.mobileActions.map((item) => ({
  ...toLink(item),
  variant: item.variant === 'outline' ? 'outline' : 'primary',
}));
