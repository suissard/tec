/**
 * Libellés français et types de champs du contenu éditorial, pour les
 * formulaires générés (panneau d'édition, /admin → Textes du site).
 */
import { ROUTE_KEYS } from '@/utils/contentSchema';

const KEY_LABELS: Record<string, string> = {
  site: 'Site',
  navigation: 'Menu',
  layout: 'Mise en page commune',
  pages: 'Pages',
  home: 'Accueil',
  about: 'Qui sommes-nous',
  events: 'Événements',
  news: 'Actualités',
  associations: 'Associations',
  contact: 'Contact',
  legal: 'Mentions légales',
  volunteer: 'Bénévolat',
  adhesion: 'Adhésion',
  notFound: 'Page introuvable (404)',
  meta: 'Référencement (onglet & Google)',
  hero: 'En-tête de page',
  title: 'Titre',
  titleLines: 'Lignes du titre',
  highlight: 'Partie du titre en rouge',
  subtitle: 'Sous-titre',
  eyebrow: 'Sur-titre',
  text: 'Texte',
  content: 'Contenu',
  description: 'Description',
  label: 'Libellé',
  route: 'Page cible',
  hash: 'Ancre (sans #)',
  button: 'Bouton',
  primaryButton: 'Bouton principal',
  secondaryButton: 'Bouton secondaire',
  empty: 'Message « aucun résultat »',
  name: 'Nom',
  defaultDescription: 'Description par défaut',
  socials: 'Réseaux sociaux',
  icon: 'Icône',
  url: 'Adresse (URL)',
  primary: 'Liens principaux',
  desktopCta: 'Bouton du menu (ordinateur)',
  mobileActions: 'Boutons du menu (mobile)',
  discordLabel: 'Libellé Discord',
  variant: 'Style',
  statsBand: 'Bandeau des chiffres clés',
  value: 'Valeur',
  useAssociationCount: 'Utiliser le nombre réel d’associations',
  joinCta: 'Appel à l’adhésion',
  footer: 'Pied de page',
  mission: 'Mission',
  quickLinksTitle: 'Titre des liens rapides',
  quickLinks: 'Liens rapides',
  socialsTitle: 'Titre des réseaux sociaux',
  contactTitle: 'Titre du contact',
  email: 'E-mail',
  location: 'Lieu',
  copyright: 'Copyright',
  legalLinks: 'Liens légaux',
  cookieBanner: 'Bannière cookies',
  customize: 'Bouton « Personnaliser »',
  decline: 'Bouton « Refuser »',
  accept: 'Bouton « Accepter »',
  team: 'Équipe',
  members: 'Membres',
  role: 'Rôle',
  photo: 'Photo',
  bio: 'Biographie',
  partners: 'Partenaires',
  logos: 'Logos',
  src: 'Image',
  alt: 'Texte alternatif (accessibilité)',
  stats: 'Statistiques',
  history: 'Historique',
  items: 'Éléments',
  tabs: 'Onglets',
  filters: 'Filtres',
  sidebar: 'Colonne latérale',
  newsletter: 'Newsletter',
  details: 'Coordonnées',
  map: 'Carte',
  embedUrl: 'URL d’intégration de la carte',
  linkUrl: 'URL du lien',
  caption: 'Légende',
  linkLabel: 'Libellé du lien',
  form: 'Formulaire',
  faq: 'Questions fréquentes',
  summaryTitle: 'Titre du sommaire',
  printButton: 'Bouton imprimer',
  sections: 'Sections',
  intro: 'Introduction',
  blocks: 'Blocs',
  cookieTable: 'Afficher le tableau des cookies',
  cookies: 'Cookies',
  columns: 'Colonnes',
  rows: 'Lignes',
  purpose: 'Finalité',
  duration: 'Durée',
  type: 'Type',
  manageButton: 'Bouton de gestion',
  note: 'Note',
  steps: 'Étapes',
  reviewText: 'Texte de récapitulatif',
  success: 'Message de succès',
  pricing: 'Tarifs',
  offers: 'Formules',
  price: 'Prix',
  groups: 'Groupes',
  indivTitle: 'Titre (particulier)',
  assoTitle: 'Titre (structure)',
  assoFee: 'Cotisation structure',
  submitButton: 'Bouton d’envoi',
  term: 'Intitulé',
  href: 'Lien',
  id: 'Identifiant',
};

/** Libellé d'une clé (repli : clé « humanisée »). */
export function labelFor(key: string): string {
  if (/^\d+$/.test(key)) return `#${Number(key) + 1}`;
  if (KEY_LABELS[key]) return KEY_LABELS[key];
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (char) => char.toUpperCase());
}

/** Libellé complet d'un chemin (`pages.home.hero.title` → « Accueil › En-tête de page › Titre »). */
export function labelForPath(path: string): string {
  return path
    .split('.')
    .filter((key, index, keys) => !(index === 0 && key === 'pages' && keys.length > 1))
    .map(labelFor)
    .join(' › ');
}

/** Noms lisibles des pages ciblables par un lien. */
export const ROUTE_LABELS: Record<(typeof ROUTE_KEYS)[number], string> = {
  Home: 'Accueil',
  Associations: 'Associations',
  Events: 'Événements',
  News: 'Actualités',
  About: 'Qui sommes-nous',
  Contact: 'Contact',
  Legal: 'Mentions légales',
  Volunteer: 'Bénévolat',
  Adhesion: 'Adhésion',
  NotFound: 'Page 404',
};

export interface SelectOption {
  value: string;
  label: string;
}

/** Valeurs imposées par le schéma pour certains champs (liste déroulante). */
export function optionsFor(path: string): SelectOption[] | undefined {
  const key = path.split('.').pop() ?? '';
  if (key === 'route') {
    return ROUTE_KEYS.map((value) => ({ value, label: ROUTE_LABELS[value] }));
  }
  if (/^site\.socials\.\d+\.icon$/.test(path)) {
    return ['x', 'discord', 'twitch', 'instagram'].map((value) => ({ value, label: value }));
  }
  if (/^layout\.statsBand\.\d+\.icon$/.test(path)) {
    return [
      { value: 'users', label: 'Personnes' },
      { value: 'calendar', label: 'Calendrier' },
      { value: 'gamepad', label: 'Manette' },
    ];
  }
  if (key === 'variant') {
    return [
      { value: 'primary', label: 'Plein (rouge)' },
      { value: 'outline', label: 'Contour' },
    ];
  }
  return undefined;
}

const IMAGE_KEYS = new Set(['photo', 'src', 'logo', 'image']);
const LONG_KEYS = new Set([
  'text',
  'content',
  'subtitle',
  'description',
  'defaultDescription',
  'mission',
  'bio',
  'intro',
  'note',
  'reviewText',
  'value',
]);

/** Champ image (téléversement proposé). */
export function isImageField(path: string): boolean {
  return IMAGE_KEYS.has(path.split('.').pop() ?? '');
}

/** Champ de texte long (zone de texte multiligne). */
export function isLongField(path: string, value: string): boolean {
  return LONG_KEYS.has(path.split('.').pop() ?? '') || value.length > 90 || value.includes('\n');
}

/** Champ acceptant liens Markdown et retours à la ligne (aide affichée). */
export function isRichField(path: string): boolean {
  return ['text', 'content', 'subtitle', 'value', 'intro', 'note'].includes(
    path.split('.').pop() ?? ''
  );
}

/**
 * Résumé d'un élément de liste (titre, libellé ou nom) pour l'afficher replié.
 */
export function summarize(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    for (const key of ['title', 'label', 'name', 'term', 'id', 'price']) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate) return candidate;
      if (Array.isArray(candidate) && typeof candidate[0] === 'string') return candidate.join(' ');
    }
  }
  return '';
}
