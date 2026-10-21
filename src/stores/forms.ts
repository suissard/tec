import { reactive } from 'vue';
import { defineStore } from 'pinia';

import { STORAGE_KEYS } from '@/utils/constants';
import {
  adhesionAssoSchema,
  adhesionIndivSchema,
  validateForm,
  volunteerSchema,
} from '@/utils/validation';
import type { z } from 'zod';

import type {
  AdhesionAssoData,
  AdhesionIndivData,
  AdhesionKind,
  ContactFormData,
  FormSubmissionState,
  VolunteerFormData,
} from '@/types';

const EMPTY_CONTACT: ContactFormData = { name: '', email: '', subject: '', message: '' };

const EMPTY_VOLUNTEER: VolunteerFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  city: '',
  interests: [],
  availability: [],
  motivations: '',
  skills: [],
  languages: '',
  hasDrivingLicence: false,
  hasVehicle: false,
  pastExperience: '',
  acceptCgu: false,
};

const EMPTY_ADHESION_INDIV: AdhesionIndivData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  birthDate: '',
  contribution: '20',
  paymentMethod: 'cb',
  acceptCgu: false,
};

const EMPTY_ADHESION_ASSO: AdhesionAssoData = {
  name: '',
  siret: '',
  repFirstName: '',
  repLastName: '',
  repEmail: '',
  address: '',
  description: '',
  website: '',
  discord: '',
  games: [],
  membersCount: null,
  logo: '',
  acceptCgu: false,
};

/** Domaines d'intérêt d'un bénévole (checkboxes de l'étape « Motivations »). */
export const VOLUNTEER_INTERESTS = [
  'Événementiel',
  'Communication',
  'Technique',
  'Encadrement',
  'Logistique',
] as const;

/** Créneaux de disponibilité d'un bénévole. */
export const VOLUNTEER_AVAILABILITIES = [
  { id: 'jour', label: 'Journée' },
  { id: 'soir', label: 'Soirée' },
  { id: 'weekend', label: 'Week-end' },
] as const;

/** Montants de cotisation proposés à l'adhésion individuelle. */
export const CONTRIBUTION_OPTIONS = [
  { value: '10', label: '10 € — Soutien' },
  { value: '20', label: '20 € — Adhérent' },
  { value: '50', label: '50 € — Mécène' },
  { value: 'libre', label: 'Montant libre' },
] as const;

/** Moyens de paiement (stub — aucun paiement en ligne). */
export const PAYMENT_OPTIONS = [
  { value: 'cb', label: 'Carte bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'virement', label: 'Virement' },
] as const;

function createState(): FormSubmissionState {
  return { submitting: false, success: false, error: null };
}

/** Valide un email (regex pragmatique). */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Premier message d'erreur d'un résultat de validation (ordre des champs du schema). */
function firstError(errors: Record<string, string>): string | null {
  const messages = Object.values(errors);
  return messages.length > 0 ? messages[0] : null;
}

/** Convertit les erreurs Zod en message utilisateur lisible. */
function validationError(errors: Record<string, string>): string {
  const first = firstError(errors);
  return first ? `Formulaire incomplet : ${first}` : 'Formulaire invalide.';
}

/**
 * Persiste un envoi de formulaire dans localStorage (tableau + horodatage).
 * Lève une erreur si le stockage est indisponible (mode privé strict, quota…).
 */
function persistToStorage<T>(key: string, payload: T): void {
  let entries: unknown[] = [];
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) entries = parsed;
    }
    entries.push({ ...payload, submittedAt: new Date().toISOString() });
    window.localStorage.setItem(key, JSON.stringify(entries));
  } catch {
    throw new Error('Impossible d’enregistrer votre demande (stockage local indisponible).');
  }
}

/**
 * Store des formulaires (contact, bénévolat, adhésion).
 * Chaque soumission validée est persistée dans localStorage
 * (`tec_contacts`, `tec_volunteers`, `tec_adhesions`), puis le formulaire est réinitialisé.
 * La validation métier repose sur les schemas Zod de `utils/validation`.
 */
export const useFormStore = defineStore('forms', () => {
  /* ---------------------------------------------------------------- state */
  const contact = reactive<ContactFormData>({ ...EMPTY_CONTACT });
  const contactState = reactive<FormSubmissionState>(createState());

  const volunteer = reactive<VolunteerFormData>({ ...EMPTY_VOLUNTEER, interests: [], skills: [] });
  const volunteerState = reactive<FormSubmissionState>(createState());

  const adhesionIndiv = reactive<AdhesionIndivData>({ ...EMPTY_ADHESION_INDIV });
  const adhesionAsso = reactive<AdhesionAssoData>({ ...EMPTY_ADHESION_ASSO, games: [] });
  const adhesionState = reactive<FormSubmissionState>(createState());

  /* -------------------------------------------------------------- actions */
  /**
   * Soumet le formulaire de contact (validation + persistance).
   * @param data Payload fourni par le composant (synchronisé dans le store avant validation).
   * @returns `true` si la soumission a réussi, `false` sinon (`contactState.error` renseigné)
   */
  async function submitContact(data?: ContactFormData): Promise<boolean> {
    if (data) {
      Object.assign(contact, data);
    }

    contactState.submitting = true;
    contactState.success = false;
    contactState.error = null;

    if (
      !contact.name.trim() ||
      !isValidEmail(contact.email) ||
      !contact.subject.trim() ||
      !contact.message.trim()
    ) {
      contactState.submitting = false;
      contactState.error =
        'Merci de renseigner votre nom, un sujet, un email valide et un message.';
      return false;
    }

    try {
      persistToStorage(STORAGE_KEYS.contacts, { ...contact });
      resetContact();
      contactState.success = true;
      return true;
    } catch (error) {
      contactState.error = error instanceof Error ? error.message : 'Envoi impossible.';
      return false;
    } finally {
      contactState.submitting = false;
    }
  }

  /**
   * Soumet la candidature bénévole (validation Zod + persistance).
   * @param data Payload du formulaire multi-étapes (optionnel : état du store sinon).
   * @returns `true` si la soumission a réussi, `false` sinon (`volunteerState.error` renseigné)
   */
  async function submitVolunteer(data?: VolunteerFormData): Promise<boolean> {
    if (data) {
      Object.assign(volunteer, data);
    }

    volunteerState.submitting = true;
    volunteerState.success = false;
    volunteerState.error = null;

    const { valid, errors } = validateForm(volunteer, volunteerSchema);
    if (!valid) {
      volunteerState.submitting = false;
      volunteerState.error = validationError(errors);
      return false;
    }

    try {
      persistToStorage(STORAGE_KEYS.volunteers, {
        ...volunteer,
        interests: [...volunteer.interests],
        availability: [...volunteer.availability],
        skills: [...volunteer.skills],
      });
      resetVolunteer();
      volunteerState.success = true;
      return true;
    } catch (error) {
      volunteerState.error = error instanceof Error ? error.message : 'Envoi impossible.';
      return false;
    } finally {
      volunteerState.submitting = false;
    }
  }

  /**
   * Soumet une demande d'adhésion (validation Zod + persistance).
   * @param data Payload du formulaire (individuel ou structure)
   * @param kind Type de demande : `'indiv'` (particulier) ou `'asso'` (structure)
   * @returns `true` si la soumission a réussi, `false` sinon (`adhesionState.error` renseigné)
   */
  async function submitAdhesion(
    data: AdhesionIndivData | AdhesionAssoData,
    kind: AdhesionKind
  ): Promise<boolean> {
    adhesionState.submitting = true;
    adhesionState.success = false;
    adhesionState.error = null;

    const schema: z.ZodType = kind === 'indiv' ? adhesionIndivSchema : adhesionAssoSchema;
    const { valid, errors } = validateForm(data, schema);
    if (!valid) {
      adhesionState.submitting = false;
      adhesionState.error = validationError(errors);
      return false;
    }

    try {
      persistToStorage(STORAGE_KEYS.adhesions, { ...data, kind });
      if (kind === 'indiv') {
        resetAdhesionIndiv();
      } else {
        resetAdhesionAsso();
      }
      adhesionState.success = true;
      return true;
    } catch (error) {
      adhesionState.error = error instanceof Error ? error.message : 'Envoi impossible.';
      return false;
    } finally {
      adhesionState.submitting = false;
    }
  }

  /* ---------------------------------------------------------------- reset */
  /**
   * Réinitialise le formulaire de contact et son état de soumission.
   *
   * @returns `{void}`
   */
  function resetContact(): void {
    Object.assign(contact, EMPTY_CONTACT);
    Object.assign(contactState, createState());
  }

  /**
   * Réinitialise la candidature bénévole (champs + état de soumission).
   *
   * @returns `{void}`
   */
  function resetVolunteer(): void {
    Object.assign(volunteer, EMPTY_VOLUNTEER, {
      interests: [] as string[],
      availability: [] as VolunteerFormData['availability'],
      skills: [] as string[],
    });
    Object.assign(volunteerState, createState());
  }

  /**
   * Réinitialise les champs de l'adhésion individuelle.
   *
   * @returns `{void}`
   */
  function resetAdhesionIndiv(): void {
    Object.assign(adhesionIndiv, EMPTY_ADHESION_INDIV);
  }

  /**
   * Réinitialise les champs de l'adhésion structure.
   *
   * @returns `{void}`
   */
  function resetAdhesionAsso(): void {
    Object.assign(adhesionAsso, EMPTY_ADHESION_ASSO, { games: [] as string[] });
  }

  /**
   * Réinitialise les deux formulaires d'adhésion et leur état de soumission.
   *
   * @returns `{void}`
   */
  function resetAdhesion(): void {
    resetAdhesionIndiv();
    resetAdhesionAsso();
    Object.assign(adhesionState, createState());
  }

  return {
    contact,
    contactState,
    volunteer,
    volunteerState,
    adhesionIndiv,
    adhesionAsso,
    adhesionState,
    submitContact,
    submitVolunteer,
    submitAdhesion,
    resetContact,
    resetVolunteer,
    resetAdhesionIndiv,
    resetAdhesionAsso,
    resetAdhesion,
    isValidEmail,
  };
});
