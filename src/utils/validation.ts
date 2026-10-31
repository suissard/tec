/**
 * Validation de formulaires via Zod.
 * Expose les schemas métier (`volunteerSchema`, `adhesionIndivSchema`,
 * `adhesionAssoSchema`) et un helper `validateForm(data, schema)` qui renvoie
 * `{ valid, errors, data }` — `errors` étant un mapping champ → 1er message.
 */
import { z } from 'zod';

/** Résultat d'une validation */
export interface ValidationResult<T = unknown> {
  valid: boolean;
  /** Message d'erreur par champ (chemins imbriqués joints par ".") */
  errors: Record<string, string>;
  /** Données parsées par Zod (uniquement si la validation passe) */
  data?: T;
}

/* ==========================================================================
   Primitives réutilisables
   ========================================================================== */

/** Chaîne obligatoire non vide (trim appliqué) */
const requiredString = (label: string, minLength = 1) =>
  z
    .string({ message: `${label} est requis.` })
    .trim()
    .min(minLength, `${label} doit contenir au moins ${minLength} caractère(s).`);

/** Chaîne facultative (vide accepté) */
const optionalString = () => z.string().trim();

/** Email validé */
const emailField = (label = 'Adresse email') =>
  z
    .email({ message: `${label} invalide.` })
    .trim()
    .min(1, `${label} est requis.`);

/** Date ISO facultative (AAAA-MM-JJ ou vide) */
const optionalIsoDate = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: `${label} doit être une date valide (AAAA-MM-JJ).` })
    .or(z.literal(''));

/** Case à cocher obligatoire */
const cguField = (message: string) => z.boolean().refine((checked) => checked, { message });

/* ==========================================================================
   Bénévolat (formulaire multi-étapes)
   ========================================================================== */

/** Étape 1 — Profil */
export const volunteerProfileSchema = z.object({
  firstName: requiredString('Le prénom'),
  lastName: requiredString('Le nom'),
  email: emailField(),
  phone: optionalString(),
  birthDate: optionalIsoDate('La date de naissance'),
  city: requiredString('La ville'),
});

/** Étape 2 — Motivations */
export const volunteerMotivationsSchema = z.object({
  interests: z.array(z.string().min(1)).min(1, 'Sélectionnez au moins un domaine d’intérêt.'),
  availability: z
    .array(z.enum(['jour', 'soir', 'weekend']))
    .min(1, 'Indiquez au moins un créneau de disponibilité.'),
  motivations: optionalString(),
});

/** Étape 3 — Compétences */
export const volunteerSkillsSchema = z.object({
  skills: z.array(z.string().min(1)),
  languages: optionalString(),
  hasDrivingLicence: z.boolean(),
  hasVehicle: z.boolean(),
  pastExperience: optionalString(),
});

/** Étape 4 — Validation */
export const volunteerConsentSchema = z.object({
  acceptCgu: cguField('Vous devez accepter les conditions d’utilisation.'),
});

/** Candidature bénévole complète (toutes étapes) */
export const volunteerSchema = volunteerProfileSchema
  .extend(volunteerMotivationsSchema.shape)
  .extend(volunteerSkillsSchema.shape)
  .extend(volunteerConsentSchema.shape);

/** Schemas des 4 étapes du stepper bénévole (validation pas-à-pas) */
export const volunteerStepSchemas = [
  volunteerProfileSchema,
  volunteerMotivationsSchema,
  volunteerSkillsSchema,
  volunteerConsentSchema,
] as const;

/* ==========================================================================
   Adhésion
   ========================================================================== */

/** Adhésion individuelle (particulier) */
export const adhesionIndivSchema = z.object({
  firstName: requiredString('Le prénom'),
  lastName: requiredString('Le nom'),
  email: emailField(),
  phone: optionalString(),
  address: requiredString('L’adresse'),
  birthDate: optionalIsoDate('La date de naissance'),
  contribution: z.enum(['1', '5'], {
    message: 'Choisissez une formule d’adhésion.',
  }),
  paymentMethod: z.enum(['cb', 'cheque', 'virement'], {
    message: 'Choisissez un moyen de paiement.',
  }),
  acceptCgu: cguField('Vous devez accepter les conditions d’utilisation.'),
});

/** Adhésion d'une structure (association, club, partenaire) */
export const adhesionAssoSchema = z.object({
  name: requiredString('Le nom de la structure'),
  siret: z
    .string({ message: 'Le SIRET est requis.' })
    .trim()
    .regex(/^\d{14}$/, { message: 'Le SIRET doit contenir exactement 14 chiffres.' }),
  repFirstName: requiredString('Le prénom du représentant'),
  repLastName: requiredString('Le nom du représentant'),
  repEmail: emailField('L’email du représentant'),
  address: requiredString('L’adresse'),
  description: requiredString('La description', 20),
  website: z
    .string()
    .trim()
    .regex(/^$|^https?:\/\/\S+$/, { message: 'Le site web doit commencer par http(s)://.' }),
  discord: optionalString(),
  games: z.array(z.string().min(1)).min(1, 'Indiquez au moins un jeu pratiqué.'),
  membersCount: z
    .number({ message: 'Indiquez le nombre d’adhérents.' })
    .int('Le nombre d’adhérents doit être entier.')
    .min(1, 'Le nombre d’adhérents doit être supérieur à 0.')
    .nullable(),
  logo: optionalString(),
  acceptCgu: cguField('Vous devez accepter les conditions d’utilisation.'),
});

/* ==========================================================================
   Helper générique
   ========================================================================== */

/** Extrait un message par champ depuis une `ZodError` (1er message par champ). */
function flattenIssues(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_';
    if (!(key in errors)) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

/**
 * Valide des données contre un schema Zod.
 *
 * @param data Données brutes (formulaire)
 * @param schema Schema Zod appliqué
 * @returns `{ valid, errors, data }` — `data` n'est défini que si `valid` est vrai
 */
export function validateForm<T extends z.ZodType>(
  data: unknown,
  schema: T
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: {}, data: result.data };
  }
  return { valid: false, errors: flattenIssues(result.error) };
}
