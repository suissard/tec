/**
 * Schéma du contenu éditorial du site (`src/data/content.json`).
 *
 * Le JSON est édité par des humains : ce schéma est vérifié **au build** (plugin
 * `tec:content-validation` de `vite.config.ts`) afin qu'une clé manquante, mal
 * orthographiée ou un lien vers une route inexistante bloque le build avec un
 * message lisible, au lieu de casser une page en production.
 *
 * ⚠️ Ce fichier est aussi importé par `vite.config.ts` : il ne doit dépendre que
 * de `zod` (pas d'alias `@/`, pas de Vue).
 *
 * Texte enrichi : les champs `text` / `content` / `subtitle` / `value` acceptent
 * des liens au format Markdown `[libellé](/chemin)` et des retours à la ligne
 * (`\n`), rendus par le composant `RichText`.
 */
import { z } from 'zod';

/** Clés de routes utilisables dans le JSON (miroir de l'enum `routeNames`). */
export const ROUTE_KEYS = [
  'Home',
  'Associations',
  'Events',
  'News',
  'About',
  'Contact',
  'Legal',
  'Volunteer',
  'Adhesion',
  'NotFound',
] as const;

export type RouteKey = (typeof ROUTE_KEYS)[number];

const text = z.string().trim().min(1, 'Texte vide');

/** Lien interne vers une page du site (route nommée + ancre facultative). */
const link = z.strictObject({
  label: text,
  route: z.enum(ROUTE_KEYS),
  /** Ancre sans `#` (ex. `rgpd`) */
  hash: z
    .string()
    .regex(/^[\w-]+$/, 'Ancre sans « # » (ex. rgpd)')
    .optional(),
});

/** Titre d'onglet + meta description (SEO). */
const meta = z.strictObject({ title: text, description: text });

/** En-tête de page (`HeroSection`) : le dernier mot du titre passe en rouge. */
const hero = z.strictObject({
  eyebrow: text.optional(),
  title: text,
  /** Partie du titre en rouge (défaut : dernier mot) */
  highlight: text.optional(),
  subtitle: text.optional(),
});

/** Bloc de section : sur-titre, titre, paragraphe facultatif. */
const section = z.strictObject({ eyebrow: text, title: text, text: text.optional() });

/** Entrée d'accordéon (FAQ, jalons). */
const accordionItem = z.strictObject({ id: text, title: text, content: text });

/** Ligne terme / valeur (listes de définitions). */
const detail = z.strictObject({ term: text, value: text, href: text.optional() });

const homePage = z.strictObject({
  meta,
  hero: z.strictObject({
    titleLines: z.array(text).min(1),
    subtitle: text,
    primaryButton: link,
    secondaryButton: link,
  }),
  events: z.strictObject({ title: text, highlight: text.optional(), empty: text, button: link }),
  associations: z.strictObject({ title: text, highlight: text.optional(), button: link }),
});

const aboutPage = z.strictObject({
  meta,
  hero,
  mission: section,
  team: z.strictObject({
    eyebrow: text,
    title: text,
    members: z.array(z.strictObject({ name: text, role: text, photo: text, bio: text })),
  }),
  partners: z.strictObject({
    eyebrow: text,
    title: text,
    logos: z.array(z.strictObject({ src: text, alt: text, label: text.optional() })),
  }),
  stats: z.strictObject({
    associations: text,
    upcomingEvents: text,
    volunteers: text,
    cities: text,
  }),
  history: z.strictObject({ eyebrow: text, title: text, items: z.array(accordionItem) }),
});

const eventsPage = z.strictObject({
  meta,
  hero,
  tabs: z.strictObject({ upcoming: text, past: text, byCategory: text }),
  filters: z.strictObject({
    searchLabel: text,
    searchPlaceholder: text,
    categoryLabel: text,
    allCategories: text,
    dateStartLabel: text,
    dateEndLabel: text,
    reset: text,
  }),
  empty: z.strictObject({
    title: text,
    byCategoryTitle: text,
    upcoming: text,
    past: text,
    byCategory: text,
    reset: text,
  }),
});

const newsPage = z.strictObject({
  meta,
  hero,
  empty: z.strictObject({ title: text, text, reset: text }),
  sidebar: z.strictObject({
    categoriesTitle: text,
    authorsTitle: text,
    authorLabel: text,
    allAuthors: text,
    archivesTitle: text,
    archivesEmpty: text,
  }),
  newsletter: z.strictObject({
    title: text,
    text,
    emailLabel: text,
    emailPlaceholder: text,
    button: text,
    success: text,
    invalidEmail: text,
  }),
});

const associationsPage = z.strictObject({
  meta,
  hero,
  filters: z.strictObject({
    searchLabel: text,
    searchPlaceholder: text,
    gamesTitle: text,
    gamesEmpty: text,
    citiesTitle: text,
    reset: text,
  }),
  empty: z.strictObject({ title: text, text, textWithFilters: text, reset: text }),
});

const contactPage = z.strictObject({
  meta,
  hero,
  details: z.strictObject({
    eyebrow: text,
    title: text,
    items: z.array(detail),
    map: z.strictObject({
      embedUrl: z.url(),
      linkUrl: z.url(),
      title: text,
      caption: text,
      linkLabel: text,
    }),
  }),
  form: section,
  faq: z.strictObject({ eyebrow: text, title: text, items: z.array(accordionItem) }),
});

const legalPage = z.strictObject({
  meta,
  hero,
  summaryTitle: text,
  printButton: text,
  sections: z
    .array(
      z.strictObject({
        /** Ancre de la section (`/mentions-legales#<id>`) */
        id: z.string().regex(/^[\w-]+$/, 'Identifiant sans espace ni accent'),
        title: text,
        intro: text.optional(),
        details: z.array(detail).optional(),
        blocks: z.array(z.strictObject({ title: text, text })).optional(),
        /** Affiche le tableau des cookies (`legal.cookies`) dans cette section */
        cookieTable: z.boolean().optional(),
      })
    )
    .min(1),
  cookies: z.strictObject({
    caption: text,
    columns: z.strictObject({ name: text, purpose: text, duration: text, type: text }),
    rows: z.array(z.strictObject({ name: text, purpose: text, duration: text, type: text })),
    manageButton: text,
    note: text,
  }),
});

const volunteerPage = z.strictObject({
  meta,
  hero,
  intro: section,
  /** Libellés des 4 étapes du formulaire (l'ordre des champs est fixé dans le code) */
  steps: z.array(text).length(4, 'Le formulaire bénévole comporte exactement 4 étapes'),
  reviewText: text,
  success: z.strictObject({ eyebrow: text, title: text, text, button: link }),
});

const adhesionPage = z.strictObject({
  meta,
  hero,
  pricing: z.strictObject({
    title: text,
    offers: z.array(
      z.strictObject({
        price: text,
        title: z.array(text).min(1),
        groups: z.array(z.strictObject({ title: text, items: z.array(text) })),
      })
    ),
  }),
  intro: z.strictObject({
    eyebrow: text,
    title: text,
    text,
    primaryButton: link,
    secondaryButton: link,
  }),
  tabs: z.strictObject({ indiv: text, asso: text }),
  indivTitle: text,
  assoTitle: text,
  assoFee: z.strictObject({ label: text, price: text, detail: text }),
  submitButton: text,
  success: z.strictObject({ title: text, text, button: link }),
});

const notFoundPage = z.strictObject({ meta, title: text, text, button: link });

export const contentSchema = z.strictObject({
  site: z.strictObject({
    name: text,
    defaultDescription: text,
    socials: z.array(
      z.strictObject({
        icon: z.enum(['x', 'discord', 'twitch', 'instagram']),
        url: z.url(),
        label: text,
      })
    ),
  }),
  navigation: z.strictObject({
    primary: z.array(link),
    contact: link,
    desktopCta: link,
    mobileActions: z.array(link.extend({ variant: z.enum(['primary', 'outline']) })),
    discordLabel: text,
  }),
  layout: z.strictObject({
    statsBand: z.array(
      z.strictObject({
        icon: z.enum(['users', 'calendar', 'gamepad']),
        value: z.number().int().nonnegative(),
        /** Remplace `value` par le nombre réel d'associations (si > 0) */
        useAssociationCount: z.boolean().optional(),
        label: z.array(text).min(1).max(2),
      })
    ),
    joinCta: z.strictObject({ title: text, text, button: link }),
    footer: z.strictObject({
      mission: text,
      quickLinksTitle: text,
      quickLinks: z.array(link),
      socialsTitle: text,
      contactTitle: text,
      email: z.email(),
      location: text,
      copyright: text,
      legalLinks: z.array(link),
    }),
    cookieBanner: z.strictObject({
      title: text,
      text,
      customize: text,
      decline: text,
      accept: text,
    }),
  }),
  pages: z.strictObject({
    home: homePage,
    about: aboutPage,
    events: eventsPage,
    news: newsPage,
    associations: associationsPage,
    contact: contactPage,
    legal: legalPage,
    volunteer: volunteerPage,
    adhesion: adhesionPage,
    notFound: notFoundPage,
  }),
});

/** Contenu éditorial typé du site. */
export type SiteContent = z.infer<typeof contentSchema>;

/** Lien interne tel que déclaré dans le JSON. */
export type ContentLink = z.infer<typeof link>;

/** Messages d'erreur Zod en français (sans modifier la config globale de Zod). */
const frenchErrors = z.locales.fr().localeError;

/**
 * Valide un contenu brut (JSON déjà parsé) contre le schéma.
 *
 * @param data Contenu à vérifier
 * @returns Liste des erreurs lisibles — vide si le contenu est valide
 */
export function validateContent(data: unknown): string[] {
  const result = contentSchema.safeParse(data, { error: frenchErrors });
  return result.success ? [] : formatContentErrors(result.error);
}

/**
 * Formate les erreurs de validation en liste lisible par un éditeur :
 * `pages.home.hero.title : Texte vide`.
 *
 * @param error Erreur Zod issue de `contentSchema.safeParse`
 * @returns Une ligne par problème
 */
export function formatContentErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(racine)';
    return `${path} : ${issue.message}`;
  });
}
