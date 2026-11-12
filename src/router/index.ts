import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from 'vue-router';

import { content, pages } from '@/utils/content';

/**
 * Routage History API (HTML5), avec deux replis hash (`/#/…`) :
 * - `VITE_HASH_ROUTER === 'true'` (hébergeur sans rewrite SPA) ;
 * - ou `base !== '/'` (GitHub Pages « project site », ex. `/tec/`, qui ne
 *   sait pas réécrire les URL profondes vers `index.html`).
 * `VITE_HASH_ROUTER === 'false'` force l'History API (ex. domaine dédié).
 * Les chemins sont alignés sur `VALID_PAGES` du site vanilla + une route 404.
 */

/** Noms de routes typés (usage dans stores / composables). */
export enum routeNames {
  Home = 'home',
  Associations = 'associations',
  Events = 'events',
  News = 'news',
  About = 'about',
  Contact = 'contact',
  Legal = 'legal',
  Volunteer = 'volunteer',
  Adhesion = 'adhesion',
  NotFound = 'not-found',
}

/** Nom de la route d'administration (hors `routeNames` : non ciblable depuis le contenu). */
export const ADMIN_ROUTE_NAME = 'admin';

/** Clé de page dans `content.pages`. */
type PageKey = keyof typeof pages;

declare module 'vue-router' {
  interface RouteMeta {
    /** Titre affiché dans l'onglet (`${title} | TEC`), repli si pas de `contentKey` */
    title: string;
    /** Meta description (SEO + Open Graph) */
    description?: string;
    /** Page de `content.pages` dont le bloc `meta` fournit titre et description (lu à chaque navigation) */
    contentKey?: PageKey;
    /** `blank` : rendu sans en-tête ni pied de page (administration) */
    layout?: 'default' | 'blank';
    /** Exclut la page des moteurs de recherche */
    noindex?: boolean;
  }
}

/** Meta d'une page liée au contenu éditorial (titre lu dynamiquement). */
function pageMeta(key: PageKey) {
  return { contentKey: key, title: pages[key].meta.title };
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: routeNames.Home,
    component: () => import('@/pages/HomeView.vue'),
    meta: pageMeta('home'),
  },
  {
    path: '/associations',
    name: routeNames.Associations,
    component: () => import('@/pages/AssociationsView.vue'),
    meta: pageMeta('associations'),
  },
  {
    path: '/evenements',
    name: routeNames.Events,
    component: () => import('@/pages/EventsView.vue'),
    meta: pageMeta('events'),
  },
  {
    path: '/actualites',
    name: routeNames.News,
    component: () => import('@/pages/NewsView.vue'),
    meta: pageMeta('news'),
  },
  {
    path: '/qui-sommes-nous',
    name: routeNames.About,
    component: () => import('@/pages/AboutView.vue'),
    meta: pageMeta('about'),
  },
  {
    path: '/contact',
    name: routeNames.Contact,
    component: () => import('@/pages/ContactView.vue'),
    meta: pageMeta('contact'),
  },
  {
    path: '/mentions-legales',
    name: routeNames.Legal,
    component: () => import('@/pages/LegalView.vue'),
    meta: pageMeta('legal'),
  },
  {
    path: '/benevolat',
    name: routeNames.Volunteer,
    component: () => import('@/pages/VolunteerView.vue'),
    meta: pageMeta('volunteer'),
  },
  {
    path: '/adhesion',
    name: routeNames.Adhesion,
    component: () => import('@/pages/AdhesionView.vue'),
    meta: pageMeta('adhesion'),
  },
  {
    path: '/admin',
    name: ADMIN_ROUTE_NAME,
    component: () => import('@/admin/AdminView.vue'),
    meta: { title: 'Administration', layout: 'blank', noindex: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: routeNames.NotFound,
    component: () => import('@/pages/NotFoundView.vue'),
    meta: pageMeta('notFound'),
  },
];

/** Crée ou met à jour une balise <meta> dans le <head>. */
function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/** Applique le titre + les meta description/OG de la route courante. */
function applySeo(title: string, description: string, noindex = false): void {
  const documentTitle = `${title} | TEC`;
  document.title = documentTitle;
  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  upsertMeta('property', 'og:title', documentTitle);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', window.location.href);
}

/**
 * Applique titre et description d'une route, lus dans le contenu **courant**
 * (PocketBase ou JSON embarqué, modifications du mode édition comprises).
 */
export function applyRouteSeo(route: RouteLocationNormalized): void {
  const page = route.meta.contentKey ? pages[route.meta.contentKey] : undefined;
  const title = page?.meta.title ?? route.meta.title;
  const description =
    page?.meta.description ?? route.meta.description ?? content.site.defaultDescription;
  applySeo(title, description, route.meta.noindex === true);
}

export const useHashHistory =
  import.meta.env.VITE_HASH_ROUTER === 'true' ||
  (import.meta.env.VITE_HASH_ROUTER !== 'false' && import.meta.env.BASE_URL !== '/');

const router = createRouter({
  history: useHashHistory
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    // Ancre interne : on scroll vers la cible (avec un décalage sous le header sticky)
    if (to.hash) {
      return { el: to.hash, top: 96, behavior: 'smooth' };
    }
    return savedPosition ?? { top: 0 };
  },
});

/** Met à jour titre + meta SEO à chaque navigation. */
router.beforeEach((to) => {
  applyRouteSeo(to);
});

export { router };
export default router;
