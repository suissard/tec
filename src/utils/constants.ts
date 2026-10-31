/**
 * Constantes globales de l'application TEC.
 */

/** Nom affiché du site */
export const SITE_TITLE = 'Toulouse Esport Connect';

/** Nom long de l'association */
export const ASSOCIATION_NAME = 'Toulouse Esport Connect';

/** Couleurs de la charte (miroir du bloc @theme de src/assets/css/main.css) */
export const BRAND_COLORS = {
  red: '#E30613',
  redHover: '#BF000B',
  redLight: '#FF3847',
  dark: '#0B0B0E',
  cardBg: '#141419',
  cardBorder: '#262630',
  accent: '#1D1D26',
  discord: '#5865F2',
  discordHover: '#4752C4',
} as const;

/** Catégories d'associations (filtres de l'annuaire) — aligné sur data/associations.json */
export const ASSOCIATION_CATEGORIES = [
  { id: 'all', label: 'Toutes les Associations' },
  { id: 'esport', label: 'Esport' },
  { id: 'versus', label: 'Versus Fighting' },
  { id: 'retro', label: 'Rétrogaming & LAN' },
  { id: 'etudiant', label: 'Étudiant & Communauté' },
] as const;

/** Image de repli (placeholder TEC) utilisée quand un visuel est absent ou cassé */
export const IMAGE_PLACEHOLDER = 'https://placehold.co/600x400/1a5c4a/ffffff?text=TEC';

/** Logo de repli (carré) pour les avatars / logos d'associations manquants */
export const LOGO_PLACEHOLDER = 'https://placehold.co/200x200/1a5c4a/ffffff?text=TEC';

/** Clés de stockage localStorage */
export const STORAGE_KEYS = {
  cookieConsent: 'tec_cookie_consent',
  contacts: 'tec_contacts',
  volunteers: 'tec_volunteers',
  adhesions: 'tec_adhesions',
  /** Brouillon du formulaire bénévole (multi-étapes) */
  volunteerDraft: 'tec_volunteer_draft',
} as const;

/** Clé de stockage localStorage pour le consentement cookies */
export const COOKIE_CONSENT_STORAGE_KEY = STORAGE_KEYS.cookieConsent;

/** Délai d'affichage des toasts (ms) */
export const TOAST_DURATION = 4000;
