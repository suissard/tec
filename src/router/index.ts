import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router';

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

const DEFAULT_DESCRIPTION =
  "Toulouse Esport Connect fédère et accompagne les associations, joueurs, créateurs et acteurs locaux pour développer l'écosystème de l'esport dans la Ville Rose.";

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: routeNames.Home,
    component: () => import('@/pages/HomeView.vue'),
    meta: { title: 'Accueil', description: DEFAULT_DESCRIPTION },
  },
  {
    path: '/associations',
    name: routeNames.Associations,
    component: () => import('@/pages/AssociationsView.vue'),
    meta: {
      title: 'Associations',
      description:
        'Découvrez les associations esport, versus fighting et rétro gaming du réseau Toulouse Esport Connect.',
    },
  },
  {
    path: '/evenements',
    name: routeNames.Events,
    component: () => import('@/pages/EventsView.vue'),
    meta: {
      title: 'Événements',
      description:
        'Agenda des tournois, LAN et événements esport organisés par le réseau TEC à Toulouse et en Occitanie.',
    },
  },
  {
    path: '/actualites',
    name: routeNames.News,
    component: () => import('@/pages/NewsView.vue'),
    meta: {
      title: 'Actualités',
      description:
        'Les dernières actualités de Toulouse Esport Connect et de ses associations membres.',
    },
  },
  {
    path: '/qui-sommes-nous',
    name: routeNames.About,
    component: () => import('@/pages/AboutView.vue'),
    meta: {
      title: 'Qui sommes-nous ?',
      description:
        "Qui sommes-nous ? Découvrez Toulouse Esport Connect, association loi 1901 fédérant l'écosystème esport toulousain.",
    },
  },
  {
    path: '/contact',
    name: routeNames.Contact,
    component: () => import('@/pages/ContactView.vue'),
    meta: {
      title: 'Contact',
      description:
        'Contactez le bureau de Toulouse Esport Connect pour toute question, partenariat ou collaboration.',
    },
  },
  {
    path: '/mentions-legales',
    name: routeNames.Legal,
    component: () => import('@/pages/LegalView.vue'),
    meta: {
      title: 'Mentions légales',
      description:
        'Mentions légales, statut de l’association et politique de confidentialité de Toulouse Esport Connect.',
    },
  },
  {
    path: '/benevolat',
    name: routeNames.Volunteer,
    component: () => import('@/pages/VolunteerView.vue'),
    meta: {
      title: 'Devenir bénévole',
      description:
        "Devenez bénévole de Toulouse Esport Connect et donnez un coup de main à l'écosystème esport toulousain.",
    },
  },
  {
    path: '/adhesion',
    name: routeNames.Adhesion,
    component: () => import('@/pages/AdhesionView.vue'),
    meta: {
      title: 'Adhésion',
      description:
        'Rejoignez le réseau Toulouse Esport Connect : adhésion des particuliers, clubs, associations et partenaires.',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: routeNames.NotFound,
    component: () => import('@/pages/NotFoundView.vue'),
    meta: {
      title: 'Page introuvable',
      description:
        'La page demandée est introuvable — revenez à l’accueil de Toulouse Esport Connect.',
    },
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
