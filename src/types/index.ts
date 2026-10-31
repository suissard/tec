/**
 * Types métier partagés de l'application TEC.
 * Alignés sur les JSON locaux du site vanilla (src/data/*.json).
 */

/** Association membre du réseau */
export interface Association {
  id: string;
  name: string;
  /** Catégorie brute utilisée pour le filtrage (esport, retro, versus, ...) */
  category: string;
  description: string;
  email?: string;
  logo: string;
  /** Classes CSS Tailwind appliquées au logo (ombres portées spécifiques) */
  imgClass?: string;
  /** Liste de jeux séparés par des virgules */
  games?: string;
  website?: string;
  /** Ville de l'association (optionnelle : filtrage de l'annuaire) */
  city?: string;
  /** Lien Discord public (optionnel) */
  discord?: string;
}

/** Statut calculé ou déclaré d'un événement */
export type EventStatus = 'open' | 'full' | 'cancelled' | 'past';

/** Événement / tournoi à venir */
export interface EventItem {
  id: string;
  title: string;
  /** Date ISO au format AAAA-MM-JJ */
  date: string;
  category: string;
  organizer: string;
  description: string;
  /** "brand-red" | "white" — couleur du badge date */
  badgeColor?: string;
  location?: string;
  url?: string;
  /** Date de fin ISO (événement sur plusieurs jours) */
  endDate?: string;
  /** URL d'inscription (repli sur `url` si absente) */
  registrationUrl?: string;
  /** Jauge maximale de participants (optionnelle) */
  maxParticipants?: number;
  /** Participants déjà inscrits (optionnel) */
  currentParticipants?: number;
  /** Statut explicite du JSON (sinon calculé) */
  status?: 'open' | 'full' | 'cancelled';
  /** Visuel de couverture (optionnel) */
  image?: string;
  /** Identifiant de l'association organisatrice (optionnel) */
  associationId?: string;
}

/** Article actualité */
export interface NewsItem {
  id: string;
  title: string;
  /** Date ISO au format AAAA-MM-JJ */
  date: string;
  category: string;
  excerpt: string;
  content?: string;
  author: string;
  image?: string;
  /** Met l'article en avant (grande carte d'accueil) */
  featured?: boolean;
  /** Temps de lecture estimé (minutes) */
  readTime?: number;
}

/** Réseaux sociaux */
export interface SocialLinks {
  network: 'discord' | 'instagram' | 'x' | 'website';
  url: string;
}

/** Payload du formulaire de contact */
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/** Catégories d'adhésion possibles */
export type AdhesionCategory = 'association' | 'club' | 'partenaire' | 'particulier';

/** Modes de paiement proposés (stub — aucun paiement en ligne) */
export type PaymentMethod = 'cb' | 'cheque' | 'virement';

/** Type de demande d'adhésion */
export type AdhesionKind = 'indiv' | 'asso';

/** Payload de l'adhésion individuelle (particulier) */
export interface AdhesionIndivData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  /** Date de naissance ISO (AAAA-MM-JJ) */
  birthDate: string;
  /** Formule choisie : "1" (membre individuel) | "5" (membre sympathisant) */
  contribution: string;
  paymentMethod: PaymentMethod;
  acceptCgu: boolean;
}

/** Payload de l'adhésion d'une structure (association, club, partenaire) */
export interface AdhesionAssoData {
  name: string;
  siret: string;
  repFirstName: string;
  repLastName: string;
  repEmail: string;
  address: string;
  description: string;
  website: string;
  discord: string;
  /** Jeux pratiqués par la structure */
  games: string[];
  /** Nombre d'adhérents déclaré */
  membersCount: number | null;
  /** Nom du fichier de logo téléversé (upload stub) */
  logo: string;
  acceptCgu: boolean;
}

/** Union des payloads d'adhésion */
export type AdhesionFormData = AdhesionIndivData | AdhesionAssoData;

/** Disponibilités horaires d'un bénévole */
export type VolunteerAvailability = 'jour' | 'soir' | 'weekend';

/** Payload de la candidature bénévole (formulaire multi-étapes) */
export interface VolunteerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Date de naissance ISO (AAAA-MM-JJ) */
  birthDate: string;
  city: string;
  /** Domaines d'intérêt (événementiel, communication, technique, ...) */
  interests: string[];
  /** Créneaux de disponibilité */
  availability: VolunteerAvailability[];
  motivations: string;
  /** Compétences techniques (tags) */
  skills: string[];
  languages: string;
  hasDrivingLicence: boolean;
  hasVehicle: boolean;
  pastExperience: string;
  acceptCgu: boolean;
}

/** État générique d'un formulaire (soumission) */
export interface FormSubmissionState {
  submitting: boolean;
  success: boolean;
  error: string | null;
}

/** Consentement cookies (valeur persistée dans localStorage) */
export type CookieConsentStatus = 'granted' | 'denied' | 'pending';

/** Type visuel d'une notification toast */
export type ToastType = 'success' | 'error' | 'info';

/** Notification toast affichée en bas à droite */
export interface Toast {
  /** Identifiant unique (permet de rejouer l'animation d'un message identique) */
  id: string;
  message: string;
  type: ToastType;
}

/** États globaux de l'app */
export type AppStatus = 'idle' | 'loading' | 'error';
