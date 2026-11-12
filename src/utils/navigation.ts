/**
 * Source unique des raccourcis du menu principal (en-tête desktop et mobile).
 *
 * Les libellés/route sont déclarés dans `src/data/content.json` (clé
 * `navigation`) ; ce module les résout en objets `RouterLink` typés. Le menu
 * mobile est construit à partir des **mêmes** liens que le menu desktop
 * (`MAIN_NAV`) afin d'éviter toute divergence (ex. un raccourci présent
 * uniquement sur petit écran).
 */
import { reactive, watchSyncEffect } from 'vue';
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

/*
 * Les listes ci-dessous sont des objets réactifs recalculés *en place* dès que
 * le contenu change (chargement PocketBase, mode édition) : les composants
 * peuvent les importer directement.
 */

/** Liens du menu principal (colonne de gauche sur desktop). */
export const PRIMARY_NAV: NavLink[] = reactive([]);

/** Lien Contact (à droite sur desktop, dans la liste sur mobile). */
export const CONTACT_NAV: NavLink = reactive({ label: '', to: '/' });

/**
 * Liens communs aux deux menus : c'est **la** liste affichée en mobile, et
 * celle dont le desktop reprend `PRIMARY_NAV` + `CONTACT_NAV`.
 */
export const MAIN_NAV: NavLink[] = reactive([]);

/** CTA « Adhérer » de l'en-tête desktop. */
export const DESKTOP_CTA: NavLink = reactive({ label: '', to: '/' });

/** Boutons d'action du panneau mobile (sous la navigation). */
export const MOBILE_ACTIONS: NavAction[] = reactive([]);

watchSyncEffect(() => {
  PRIMARY_NAV.splice(0, PRIMARY_NAV.length, ...navigation.primary.map(toLink));
  Object.assign(CONTACT_NAV, toLink(navigation.contact));
  MAIN_NAV.splice(0, MAIN_NAV.length, ...PRIMARY_NAV, { ...CONTACT_NAV });
  Object.assign(DESKTOP_CTA, toLink(navigation.desktopCta));
  MOBILE_ACTIONS.splice(
    0,
    MOBILE_ACTIONS.length,
    ...navigation.mobileActions.map((item) => ({
      ...toLink(item),
      variant: item.variant === 'outline' ? ('outline' as const) : ('primary' as const),
    }))
  );
});
