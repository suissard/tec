<script setup lang="ts">
/**
 * Page Devenir bénévole — candidature en 4 étapes (profil, motivations,
 * compétences, validation) avec brouillon persistant dans localStorage
 * et validation Zod par étape (`volunteerStepSchemas`).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import HeroSection from '@/components/HeroSection.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue';
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import BaseSelect, { type SelectOption } from '@/components/ui/BaseSelect.vue';
import BaseTextarea from '@/components/ui/BaseTextarea.vue';
import Stepper from '@/components/ui/Stepper.vue';
import TagInput from '@/components/ui/TagInput.vue';
import { useLocalStorage } from '@/composables/useLocalStorage';
import { useAppStore } from '@/stores/app';
import { useDataStore } from '@/stores/data';
import { useFormStore, VOLUNTEER_AVAILABILITIES, VOLUNTEER_INTERESTS } from '@/stores/forms';
import type { VolunteerAvailability, VolunteerFormData } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';
import { validateForm, volunteerStepSchemas } from '@/utils/validation';

/** Élément du récapitulatif (étape 4). */
interface RecapItem {
  label: string;
  value: string;
}

const dataStore = useDataStore();
const appStore = useAppStore();
const formStore = useFormStore();
const router = useRouter();

const pageTitle = 'Devenir bénévole';
const pageDescription =
  'Donnez un coup de main au réseau TEC : broadcast, communication, événementiel ou vie associative.';

/** Libellés des étapes du stepper. */
const STEPS = ['Profil', 'Motivations', 'Compétences', 'Validation'];

/** Suggestions de domaines d'intérêt (tags libres). */
const INTEREST_SUGGESTIONS: string[] = [...VOLUNTEER_INTERESTS];

/** Créneaux de disponibilité — `id` aligné sur `z.enum(['jour','soir','weekend'])`. */
const AVAILABILITY_OPTIONS: { id: VolunteerAvailability; label: string }[] = [
  ...VOLUNTEER_AVAILABILITIES,
];

/** Langues proposées (choix unique, facultatif). */
const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Non précisé' },
  { value: 'Français', label: 'Français' },
  { value: 'Anglais', label: 'Anglais' },
  { value: 'Espagnol', label: 'Espagnol' },
  { value: 'Allemand', label: 'Allemand' },
  { value: 'Italien', label: 'Italien' },
  { value: 'Portugais', label: 'Portugais' },
  { value: 'Occitan', label: 'Occitan' },
];

/** Candidature vide (repli du brouillon et réinitialisation après envoi). */
function createDefaultForm(): VolunteerFormData {
  return {
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
}

/**
 * Brouillon persisté (`tec_volunteer_draft`) : la saisie est restaurée
 * si l'utilisateur quitte la page avant d'envoyer sa candidature.
 */
const draft = useLocalStorage<VolunteerFormData>(STORAGE_KEYS.volunteerDraft, createDefaultForm());

/** Données du formulaire (ref du brouillon — chaque saisie est persistée). */
const formData = draft.value;

/** Étape courante (1 à 4). */
const step = ref(1);
/** Vrai après le premier changement de saisie de l'étape courante. */
const interacted = ref(false);
/** Vrai une fois la candidature enregistrée (panneau de confirmation). */
const submitted = ref(false);

let redirectTimer: ReturnType<typeof setTimeout> | null = null;

/* ------------------------------------------------------------------ validation */
/** Sous-ensemble de données validé par le schema de l'étape passée en argument. */
function stepPayload(currentStep: number): unknown {
  const data = formData.value;
  switch (currentStep) {
    case 1:
      return {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate,
        city: data.city,
      };
    case 2:
      return {
        interests: data.interests,
        availability: data.availability,
        motivations: data.motivations,
      };
    case 3:
      return {
        skills: data.skills,
        languages: data.languages,
        hasDrivingLicence: data.hasDrivingLicence,
        hasVehicle: data.hasVehicle,
        pastExperience: data.pastExperience,
      };
    default:
      return { acceptCgu: data.acceptCgu };
  }
}

const stepIndex = computed(() => step.value - 1);

/** Résultat de validation de l'étape courante (calculé à chaque saisie). */
const stepResult = computed(() =>
  validateForm(stepPayload(step.value), volunteerStepSchemas[step.value - 1])
);

/** L'étape courante est complète : on autorise le passage à la suite. */
const canContinue = computed(() => stepResult.value.valid);

/** Erreur d'un champ de l'étape courante (révélée après la première saisie). */
function fieldError(field: string): string | undefined {
  if (!interacted.value) return undefined;
  return stepResult.value.errors[field];
}

// La première modification d'une étape révèle ses erreurs (aria-invalid + alertes).
watch(
  formData,
  () => {
    interacted.value = true;
  },
  { deep: true }
);

// Une nouvelle étape démarre toujours dans un état « propre ».
watch(step, () => {
  interacted.value = false;
});

/* ----------------------------------------------------------------- navigation */
/** Navigue vers une étape déjà franchie (navigation arrière via le stepper). */
function goToStep(target: number): void {
  if (target >= 1 && target < step.value) {
    step.value = target;
  }
}

function previousStep(): void {
  if (step.value > 1) {
    step.value -= 1;
  }
}

function nextStep(): void {
  if (!canContinue.value) {
    interacted.value = true; // filet de sécurité (bouton a priori désactivé)
    return;
  }
  step.value += 1;
}

/** Ajoute/retire un créneau de disponibilité. */
function toggleAvailability(id: VolunteerAvailability): void {
  const current = formData.value.availability;
  formData.value.availability = current.includes(id)
    ? current.filter((value) => value !== id)
    : [...current, id];
}

/* ------------------------------------------------------------------ récapitulatif */
/** Champs non vides de la candidature, destinés à la relecture (étape 4). */
const recap = computed<RecapItem[]>(() => {
  const data = formData.value;
  const items: RecapItem[] = [
    { label: 'Prénom', value: data.firstName },
    { label: 'Nom', value: data.lastName },
    { label: 'Email', value: data.email },
    { label: 'Téléphone', value: data.phone },
    { label: 'Date de naissance', value: data.birthDate },
    { label: 'Ville', value: data.city },
    { label: 'Domaines d’intérêt', value: data.interests.join(', ') },
    { label: 'Disponibilités', value: data.availability.join(', ') },
    { label: 'Motivations', value: data.motivations },
    { label: 'Compétences', value: data.skills.join(', ') },
    { label: 'Langues', value: data.languages },
    { label: 'Permis de conduire', value: data.hasDrivingLicence ? 'Oui' : '' },
    { label: 'Véhicule personnel', value: data.hasVehicle ? 'Oui' : '' },
    { label: 'Expérience', value: data.pastExperience },
  ];
  return items.filter((item) => item.value.trim().length > 0);
});

/* -------------------------------------------------------------------- envoi */
async function submit(): Promise<void> {
  if (!canContinue.value) {
    interacted.value = true;
    return;
  }

  const sent = await formStore.submitVolunteer({ ...formData.value });

  if (!sent) {
    appStore.showToast(
      formStore.volunteerState.error ?? 'Envoi impossible. Réessayez plus tard.',
      'error'
    );
    return;
  }

  submitted.value = true;
  appStore.showToast('Candidature envoyée ! Nous vous recontacterons sous 48 h.', 'success');
  draft.remove();
  redirectTimer = setTimeout(() => {
    router.push('/');
  }, 3000);
}

onBeforeUnmount(() => {
  if (redirectTimer !== null) {
    clearTimeout(redirectTimer);
    redirectTimer = null;
  }
});

onMounted(async () => {
  appStore.setLoading(true);
  try {
    await dataStore.loadAll();
    if (dataStore.error) {
      appStore.showToast('Erreur chargement données', 'error');
    }
  } catch {
    appStore.showToast('Erreur chargement données', 'error');
  } finally {
    appStore.setLoading(false);
  }
});
</script>

<template>
  <div>
    <HeroSection :title="pageTitle" :subtitle="pageDescription" eyebrow="Bénévolat" />

    <section class="max-w-6xl mx-auto px-4 py-10 md:py-14" aria-labelledby="volunteer-title">
      <!-- Confirmation après envoi -->
      <div
        v-if="submitted"
        class="glass-card mx-auto max-w-2xl rounded-3xl p-8 text-center md:p-10"
        role="status"
        aria-live="polite"
      >
        <p class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light">
          Candidature envoyée
        </p>
        <h2 id="volunteer-title" class="mt-2 font-bebas text-3xl md:text-4xl text-white">
          Merci pour votre engagement !
        </h2>
        <p class="mt-4 text-sm leading-relaxed text-gray-400">
          Votre candidature a bien été enregistrée. Le bureau vous recontacte sous 48 h. Vous allez
          être redirigé vers l’accueil dans quelques secondes.
        </p>
        <div class="mt-6 flex justify-center">
          <BaseButton variant="primary" to="/">Retour à l’accueil</BaseButton>
        </div>
      </div>

      <!-- Formulaire -->
      <div v-else>
        <header class="mb-8">
          <p
            class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light"
          >
            Votre candidature
          </p>
          <h2 id="volunteer-title" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
            Rejoindre l’équipe bénévole
          </h2>
          <p class="mt-3 max-w-2xl text-sm text-gray-400">
            4 étapes d’environ 5 minutes. Votre brouillon est conservé dans ce navigateur : vous
            pourrez reprendre votre saisie plus tard.
          </p>
        </header>

        <div class="glass-card rounded-2xl p-6 md:p-8">
          <Stepper :steps="STEPS" :current-step="stepIndex" @step-click="goToStep($event + 1)" />

          <form
            class="mt-8"
            novalidate
            aria-label="Formulaire de candidature bénévole"
            @submit.prevent="step === 4 ? submit() : nextStep()"
          >
            <!-- Étape 1 — Profil -->
            <div v-if="step === 1" class="space-y-5">
              <h3 class="font-bebas text-2xl text-white">Étape 1 — Profil</h3>
              <div class="grid gap-5 sm:grid-cols-2">
                <BaseInput
                  v-model="formData.firstName"
                  label="Prénom"
                  name="firstName"
                  autocomplete="given-name"
                  required
                  :error="fieldError('firstName')"
                />
                <BaseInput
                  v-model="formData.lastName"
                  label="Nom"
                  name="lastName"
                  autocomplete="family-name"
                  required
                  :error="fieldError('lastName')"
                />
                <BaseInput
                  v-model="formData.email"
                  label="Adresse email"
                  type="email"
                  name="email"
                  autocomplete="email"
                  required
                  :error="fieldError('email')"
                />
                <BaseInput
                  v-model="formData.phone"
                  label="Téléphone"
                  type="tel"
                  name="phone"
                  autocomplete="tel"
                  hint="Format : 06 12 34 56 78 (facultatif)"
                  :error="fieldError('phone')"
                />
                <BaseDatePicker
                  v-model="formData.birthDate"
                  label="Date de naissance"
                  name="birthDate"
                  hint="Facultatif (AAAA-MM-JJ)"
                  :error="fieldError('birthDate')"
                />
                <BaseInput
                  v-model="formData.city"
                  label="Ville"
                  name="city"
                  autocomplete="address-level2"
                  required
                  :error="fieldError('city')"
                />
              </div>
            </div>

            <!-- Étape 2 — Motivations -->
            <div v-else-if="step === 2" class="space-y-5">
              <h3 class="font-bebas text-2xl text-white">Étape 2 — Motivations</h3>

              <div>
                <label
                  for="volunteer-interests"
                  class="block text-xs font-medium text-gray-300 mb-1"
                >
                  Domaines d’intérêt <span class="text-brand-red-light" aria-hidden="true">*</span>
                </label>
                <TagInput
                  v-model="formData.interests"
                  input-id="volunteer-interests"
                  :suggestions="INTEREST_SUGGESTIONS"
                  placeholder="Événementiel, communication… (Entrée pour ajouter)"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Suggestions : événementiel, communication, technique, encadrement, logistique.
                </p>
                <p v-if="fieldError('interests')" class="mt-1 text-xs text-rose-400" role="alert">
                  {{ fieldError('interests') }}
                </p>
              </div>

              <fieldset class="m-0 border-0 p-0">
                <legend class="block text-xs font-medium text-gray-300 mb-2">
                  Disponibilités <span class="text-brand-red-light" aria-hidden="true">*</span>
                </legend>
                <div class="flex flex-wrap gap-x-6 gap-y-3">
                  <BaseCheckbox
                    v-for="option in AVAILABILITY_OPTIONS"
                    :key="option.id"
                    :model-value="formData.availability.includes(option.id)"
                    :label="option.label"
                    :input-id="`volunteer-availability-${option.id}`"
                    @update:model-value="toggleAvailability(option.id)"
                  />
                </div>
                <p
                  v-if="fieldError('availability')"
                  class="mt-2 text-xs text-rose-400"
                  role="alert"
                >
                  {{ fieldError('availability') }}
                </p>
              </fieldset>

              <BaseTextarea
                v-model="formData.motivations"
                label="Vos motivations"
                name="motivations"
                :rows="4"
                placeholder="Ce qui vous donne envie de vous engager…"
                hint="Facultatif — quelques lignes suffisent."
                :error="fieldError('motivations')"
              />
            </div>

            <!-- Étape 3 — Compétences -->
            <div v-else-if="step === 3" class="space-y-5">
              <h3 class="font-bebas text-2xl text-white">Étape 3 — Compétences</h3>

              <div>
                <label for="volunteer-skills" class="block text-xs font-medium text-gray-300 mb-1">
                  Compétences
                </label>
                <TagInput
                  v-model="formData.skills"
                  input-id="volunteer-skills"
                  placeholder="Montage vidéo, régie, réseaux sociaux… (Entrée pour ajouter)"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Saisie libre : ajoutez chaque compétence puis appuyez sur Entrée.
                </p>
                <p v-if="fieldError('skills')" class="mt-1 text-xs text-rose-400" role="alert">
                  {{ fieldError('skills') }}
                </p>
              </div>

              <BaseSelect
                v-model="formData.languages"
                label="Langues parlées"
                name="languages"
                :options="LANGUAGE_OPTIONS"
                hint="Facultatif — la langue principale suffit."
                :error="fieldError('languages')"
              />

              <div class="flex flex-wrap gap-x-8 gap-y-3">
                <BaseCheckbox
                  v-model="formData.hasDrivingLicence"
                  label="Permis de conduire"
                  input-id="volunteer-driving-licence"
                />
                <BaseCheckbox
                  v-model="formData.hasVehicle"
                  label="Véhicule personnel"
                  input-id="volunteer-vehicle"
                />
              </div>

              <BaseTextarea
                v-model="formData.pastExperience"
                label="Expérience précédente"
                name="pastExperience"
                :rows="3"
                placeholder="Bénévolat, événements, vie associative…"
                hint="Facultatif."
                :error="fieldError('pastExperience')"
              />
            </div>

            <!-- Étape 4 — Validation -->
            <div v-else class="space-y-5">
              <h3 class="font-bebas text-2xl text-white">Étape 4 — Validation</h3>

              <p class="text-sm text-gray-400">
                Vérifiez vos informations avant l’envoi. Vous pouvez revenir en arrière avec le
                stepper.
              </p>

              <dl v-if="recap.length > 0" class="grid gap-4 sm:grid-cols-2">
                <div
                  v-for="item in recap"
                  :key="item.label"
                  class="rounded-xl border border-brand-card-border bg-white/[0.02] p-3"
                >
                  <dt class="text-xs uppercase tracking-wider text-gray-500">{{ item.label }}</dt>
                  <dd class="mt-1 break-words text-sm text-gray-200">{{ item.value }}</dd>
                </div>
              </dl>
              <p v-else class="text-sm text-gray-500">
                Aucune information renseignée pour le moment — revenez aux étapes précédentes.
              </p>

              <div class="border-t border-brand-card-border pt-5">
                <BaseCheckbox
                  v-model="formData.acceptCgu"
                  label="J’accepte les conditions d’utilisation et la politique de confidentialité"
                  required
                  input-id="volunteer-cgu"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Consultez les
                  <RouterLink
                    to="/mentions-legales#cgu"
                    class="underline underline-offset-4 transition-colors hover:text-brand-red-light"
                    >conditions d’utilisation</RouterLink
                  >.
                </p>
                <p v-if="fieldError('acceptCgu')" class="mt-1 text-xs text-rose-400" role="alert">
                  {{ fieldError('acceptCgu') }}
                </p>
              </div>
            </div>

            <!-- Navigation -->
            <div
              class="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-brand-card-border pt-6"
            >
              <BaseButton variant="ghost" :disabled="step === 1" @click="previousStep">
                Précédent
              </BaseButton>
              <p
                v-if="!canContinue"
                class="order-3 w-full text-xs text-gray-500 sm:order-none sm:w-auto"
              >
                Complétez les champs requis pour continuer.
              </p>
              <BaseButton
                v-if="step < STEPS.length"
                variant="primary"
                :disabled="!canContinue"
                @click="nextStep"
              >
                Suivant
              </BaseButton>
              <BaseButton
                v-else
                type="submit"
                variant="primary"
                :loading="formStore.volunteerState.submitting"
              >
                Envoyer ma candidature
              </BaseButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>
