import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
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

declare module 'vue-router' {
  interface RouteMeta {
    /** Titre affiché dans l'onglet (`${title} | TEC`) */
    title: string;
    /** Meta description (SEO + Open Graph) */
    description?: string;
  }
}

/** Description par défaut (`site.defaultDescription` de `content.json`). */
const DEFAULT_DESCRIPTION = content.site.defaultDescription;

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: routeNames.Home,
    component: () => import('@/pages/HomeView.vue'),
    meta: { ...pages.home.meta },
  },
  {
    path: '/associations',
    name: routeNames.Associations,
    component: () => import('@/pages/AssociationsView.vue'),
    meta: { ...pages.associations.meta },
  },
  {
    path: '/evenements',
    name: routeNames.Events,
    component: () => import('@/pages/EventsView.vue'),
    meta: { ...pages.events.meta },
  },
  {
    path: '/actualites',
    name: routeNames.News,
    component: () => import('@/pages/NewsView.vue'),
    meta: { ...pages.news.meta },
  },
  {
    path: '/qui-sommes-nous',
    name: routeNames.About,
    component: () => import('@/pages/AboutView.vue'),
    meta: { ...pages.about.meta },
  },
  {
    path: '/contact',
    name: routeNames.Contact,
    component: () => import('@/pages/ContactView.vue'),
    meta: { ...pages.contact.meta },
  },
  {
    path: '/mentions-legales',
    name: routeNames.Legal,
    component: () => import('@/pages/LegalView.vue'),
    meta: { ...pages.legal.meta },
  },
  {
    path: '/benevolat',
    name: routeNames.Volunteer,
    component: () => import('@/pages/VolunteerView.vue'),
    meta: { ...pages.volunteer.meta },
  },
  {
    path: '/adhesion',
    name: routeNames.Adhesion,
    component: () => import('@/pages/AdhesionView.vue'),
    meta: { ...pages.adhesion.meta },
  },
  {
    path: '/:pathMatch(.*)*',
    name: routeNames.NotFound,
    component: () => import('@/pages/NotFoundView.vue'),
    meta: { ...pages.notFound.meta },
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
function applySeo(title: string, description: string): void {
  const documentTitle = `${title} | TEC`;
  document.title = documentTitle;
  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', documentTitle);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', window.location.href);
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
  const title = to.meta.title;
  const description = to.meta.description ?? DEFAULT_DESCRIPTION;
  applySeo(title, description);
});

export { router };
export default router;
