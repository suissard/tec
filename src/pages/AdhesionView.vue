<script setup lang="ts">
/**
 * Page Adhésion — deux onglets (« Particulier » et « Structure »),
 * préremplissage via `?asso=<nom>`, validation Zod (`adhesionIndivSchema` /
 * `adhesionAssoSchema`) puis envoi via `useFormStore.submitAdhesion`.
 * Les tarifs reprennent les trois formules du réseau : 1 € membre individuel,
 * 5 € membre sympathisant et 50 € entité morale.
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import HeroSection from '@/components/HeroSection.vue';
import AdhesionPricing from '@/components/AdhesionPricing.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue';
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue';
import BaseFileInput from '@/components/ui/BaseFileInput.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import BaseRadioGroup, { type RadioOption } from '@/components/ui/BaseRadioGroup.vue';
import BaseSelect, { type SelectOption } from '@/components/ui/BaseSelect.vue';
import BaseTextarea from '@/components/ui/BaseTextarea.vue';
import TagInput from '@/components/ui/TagInput.vue';
import { useAppStore } from '@/stores/app';
import { useDataStore } from '@/stores/data';
import { CONTRIBUTION_OPTIONS, PAYMENT_OPTIONS, useFormStore } from '@/stores/forms';
import type { AdhesionAssoData, AdhesionIndivData, AdhesionKind, PaymentMethod } from '@/types';
import { pages } from '@/utils/content';
import { toLink } from '@/utils/navigation';
import { adhesionAssoSchema, adhesionIndivSchema, validateForm } from '@/utils/validation';

/**
 * Formulaire structure côté UI : `membersCount` saisi comme texte
 * puis converti en `number | null` dans le payload nettoyé.
 */
type AdhesionAssoForm = Omit<AdhesionAssoData, 'membersCount'> & { membersCount: string };

/** Onglet de sélection du type d'adhésion. */
interface KindTab {
  kind: AdhesionKind;
  tabId: string;
  panelId: string;
  label: string;
}

const dataStore = useDataStore();
const appStore = useAppStore();
const formStore = useFormStore();
const route = useRoute();

/** Textes de la page (`pages.adhesion` de `content.json`). */
const texts = pages.adhesion;
const introPrimary = toLink(texts.intro.primaryButton);
const introSecondary = toLink(texts.intro.secondaryButton);
const successButton = toLink(texts.success.button);

/** Onglets accessible (aria-controls / aria-labelledby croisés). */
const KIND_TABS: KindTab[] = [
  {
    kind: 'indiv',
    tabId: 'adhesion-tab-indiv',
    panelId: 'adhesion-panel-indiv',
    label: texts.tabs.indiv,
  },
  {
    kind: 'asso',
    tabId: 'adhesion-tab-asso',
    panelId: 'adhesion-panel-asso',
    label: texts.tabs.asso,
  },
];

/** Montants de cotisation (`as const` → copie mutable pour `BaseSelect`). */
const CONTRIBUTION_LIST: SelectOption[] = [...CONTRIBUTION_OPTIONS];

/** Moyens de paiement (`as const` → copie mutable pour `BaseRadioGroup`). */
const PAYMENT_LIST: RadioOption[] = [...PAYMENT_OPTIONS];

/** Types MIME acceptés pour le logo de la structure. */
const LOGO_ACCEPT = 'image/*';

/** Croquis individuel vide (défaut + réinitialisation après envoi). */
function createDefaultIndiv(): AdhesionIndivData {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    contribution: '1',
    paymentMethod: 'cb',
    acceptCgu: false,
  };
}

/** Croquis structure vide (défaut + réinitialisation après envoi). */
function createDefaultAsso(): AdhesionAssoForm {
  return {
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
    membersCount: '',
    logo: '',
    acceptCgu: false,
  };
}

/** Croquis vide du type d'adhésion passé en argument. */
function createDefault(kind: AdhesionKind): AdhesionIndivData | AdhesionAssoForm {
  return kind === 'indiv' ? createDefaultIndiv() : createDefaultAsso();
}

/* -------------------------------------------------------------------- état */
/** Type d'adhésion sélectionné (onglet actif). */
const kind = ref<AdhesionKind>('indiv');

/** Données du formulaire actif (union — accès typé via `indivForm` / `assoForm`). */
const formData = ref<AdhesionIndivData | AdhesionAssoForm>(createDefaultIndiv());

/** Logo téléversé (aperçu géré par `BaseFileInput`, nom stocké au submit). */
const logoFile = ref<File | null>(null);

/** Erreurs de validation par champ (révélées après un envoi refusé). */
const errors = ref<Record<string, string>>({});

/** Vrai après un envoi accepté (panneau de confirmation en ligne). */
const showSuccess = ref(false);

/** Accès typé au formulaire individuel (onglet actif = 'indiv'). */
const indivForm = computed(() => formData.value as AdhesionIndivData);

/** Accès typé au formulaire structure (onglet actif = 'asso'). */
const assoForm = computed(() => formData.value as AdhesionAssoForm);

/** Moyen de paiement — accès typé `string` pour `BaseRadioGroup` (v-model). */
const paymentMethodValue = computed<string>({
  get: () => indivForm.value.paymentMethod,
  set: (value) => {
    indivForm.value.paymentMethod = value as PaymentMethod;
  },
});

/** Jeux uniques agrégés depuis les associations du réseau (suggestions TagInput). */
const gameSuggestions = computed<string[]>(() => {
  const games = new Set<string>();
  for (const association of dataStore.associations) {
    for (const game of (association.games ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)) {
      games.add(game);
    }
  }
  return [...games].sort((a, b) => a.localeCompare(b, 'fr'));
});

/* ------------------------------------------------- préremplissage ?asso=… */
/** Décodage tolérant d'un paramètre de requête (évite `URIError` sur un '%`). */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Un lien « adhérer au nom de votre structure » préselectionne l'onglet structure.
watch(
  () => route.query.asso,
  (value) => {
    if (typeof value !== 'string' || value.length === 0) return;
    kind.value = 'asso';
    formData.value = { ...createDefaultAsso(), name: safeDecode(value) };
    errors.value = {};
  },
  { immediate: true }
);

/* -------------------------------------------------------------- navigation */
/** Change d'onglet en repartant d'un croquis vierge pour le type choisi. */
function selectKind(next: AdhesionKind): void {
  if (kind.value === next) return;
  kind.value = next;
  formData.value = createDefault(next);
  logoFile.value = null;
  errors.value = {};
}

/** Message d'erreur d'un champ (révélé après un envoi refusé). */
function fieldError(field: string): string | undefined {
  return errors.value[field];
}

/** Focus + défilement vers le premier champ en erreur (`aria-invalid`). */
function focusFirstError(): void {
  void nextTick(() => {
    const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!first) return;
    first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    first.focus({ preventScroll: true });
  });
}

/* ------------------------------------------------------------------ envoi */
/** Payload nettoyé : SIRET sans espaces, membres convertis, nom du logo. */
function buildPayload(): AdhesionIndivData | AdhesionAssoData {
  if (kind.value === 'indiv') {
    return { ...indivForm.value };
  }

  const membersCount = Number.parseInt(assoForm.value.membersCount, 10);
  return {
    ...assoForm.value,
    siret: assoForm.value.siret.replace(/\s/g, ''),
    membersCount: Number.isFinite(membersCount) && membersCount > 0 ? membersCount : null,
    logo: logoFile.value?.name ?? '',
  };
}

async function submit(): Promise<void> {
  errors.value = {};

  const payload = buildPayload();
  const schema = kind.value === 'indiv' ? adhesionIndivSchema : adhesionAssoSchema;
  const result = validateForm(payload, schema);
  if (!result.valid) {
    errors.value = result.errors;
    const [firstMessage] = Object.values(result.errors);
    appStore.showToast(
      `Formulaire incomplet : ${firstMessage ?? 'vérifiez vos informations.'}`,
      'error'
    );
    focusFirstError();
    return;
  }

  const sent = await formStore.submitAdhesion(payload, kind.value);
  if (!sent) {
    appStore.showToast(
      formStore.adhesionState.error ?? 'Envoi impossible. Réessayez plus tard.',
      'error'
    );
    return;
  }

  showSuccess.value = true;
  errors.value = {};
  formData.value = createDefault(kind.value);
  logoFile.value = null;
  appStore.showToast('Adhésion envoyée ! Le bureau vous recontacte sous 48 h.', 'success');
}

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
    <HeroSection v-bind="texts.hero" />
    <AdhesionPricing v-if="!showSuccess" />

    <section class="max-w-6xl mx-auto px-4 py-10 md:py-14" aria-labelledby="adhesion-title">
      <!-- Confirmation après envoi -->
      <div
        v-if="showSuccess"
        class="glass-card mx-auto max-w-2xl rounded-3xl p-8 text-center md:p-10"
        role="status"
        aria-live="polite"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-red/15"
          aria-hidden="true"
        >
          <svg
            class="h-8 w-8 text-brand-red-light"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <h2 id="adhesion-title" class="mt-4 font-bebas text-3xl md:text-4xl text-white">
          {{ texts.success.title }}
        </h2>
        <p class="mt-4 text-sm leading-relaxed text-gray-400">
          {{ texts.success.text }}
        </p>
        <div class="mt-6 flex justify-center">
          <BaseButton variant="primary" :to="successButton.to">{{ successButton.label }}</BaseButton>
        </div>
      </div>

      <!-- Formulaire à onglets -->
      <div v-else>
        <header class="mb-8">
          <p
            class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light"
          >
            {{ texts.intro.eyebrow }}
          </p>
          <h2 id="adhesion-title" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
            {{ texts.intro.title }}
          </h2>
          <p class="mt-3 max-w-2xl text-sm text-gray-400">
            {{ texts.intro.text }}
          </p>
          <div class="mt-6 flex flex-wrap gap-4">
            <BaseButton variant="primary" :to="introPrimary.to">{{ introPrimary.label }}</BaseButton>
            <BaseButton variant="outline" :to="introSecondary.to">{{ introSecondary.label }}</BaseButton>
          </div>
        </header>

        <div class="glass-card rounded-2xl p-6 md:p-8">
          <!-- Onglets -->
          <div
            role="tablist"
            aria-label="Type d’adhésion"
            class="flex flex-wrap gap-2 border-b border-brand-card-border"
          >
            <button
              v-for="tab in KIND_TABS"
              :id="tab.tabId"
              :key="tab.kind"
              type="button"
              role="tab"
              :aria-selected="kind === tab.kind"
              :aria-controls="tab.panelId"
              class="rounded-t-xl border px-4 py-2 font-rajdhani text-sm font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
              :class="
                kind === tab.kind
                  ? 'border-brand-red/60 bg-white/5 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              "
              @click="selectKind(tab.kind)"
            >
              {{ tab.label }}
            </button>
          </div>

          <form
            class="mt-8"
            novalidate
            aria-label="Formulaire d’adhésion"
            @submit.prevent="submit()"
          >
            <!-- Onglet Particulier -->
            <div
              :id="KIND_TABS[0].panelId"
              role="tabpanel"
              :aria-labelledby="KIND_TABS[0].tabId"
              v-if="kind === 'indiv'"
              class="space-y-5"
            >
              <h3 class="font-bebas text-2xl text-white">{{ texts.indivTitle }}</h3>

              <div class="grid gap-5 sm:grid-cols-2">
                <BaseInput
                  v-model="indivForm.firstName"
                  label="Prénom"
                  name="firstName"
                  autocomplete="given-name"
                  required
                  :error="fieldError('firstName')"
                />
                <BaseInput
                  v-model="indivForm.lastName"
                  label="Nom"
                  name="lastName"
                  autocomplete="family-name"
                  required
                  :error="fieldError('lastName')"
                />
                <BaseInput
                  v-model="indivForm.email"
                  label="Adresse email"
                  type="email"
                  name="email"
                  autocomplete="email"
                  required
                  :error="fieldError('email')"
                />
                <BaseInput
                  v-model="indivForm.phone"
                  label="Téléphone"
                  type="tel"
                  name="phone"
                  autocomplete="tel"
                  hint="Format : 06 12 34 56 78 (facultatif)"
                  :error="fieldError('phone')"
                />
                <BaseInput
                  v-model="indivForm.address"
                  label="Adresse postale"
                  name="address"
                  autocomplete="street-address"
                  required
                  :error="fieldError('address')"
                />
                <BaseDatePicker
                  v-model="indivForm.birthDate"
                  label="Date de naissance"
                  name="birthDate"
                  hint="Facultatif (AAAA-MM-JJ)"
                  :error="fieldError('birthDate')"
                />
              </div>

              <BaseSelect
                v-model="indivForm.contribution"
                label="Formule d’adhésion"
                name="contribution"
                :options="CONTRIBUTION_LIST"
                hint="1 € : droits bénévoles et accès au staff — 5 € : soutien sans engagement bénévole."
                required
                :error="fieldError('contribution')"
              />

              <BaseRadioGroup
                v-model="paymentMethodValue"
                legend="Moyen de paiement"
                name="paymentMethod"
                orientation="horizontal"
                :options="PAYMENT_LIST"
                required
                :error="fieldError('paymentMethod')"
              />

              <div class="border-t border-brand-card-border pt-5">
                <BaseCheckbox
                  v-model="indivForm.acceptCgu"
                  label="J’accepte les conditions d’utilisation et la politique de confidentialité"
                  required
                  input-id="adhesion-indiv-cgu"
                  name="acceptCgu"
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

            <!-- Onglet Structure -->
            <div
              :id="KIND_TABS[1].panelId"
              role="tabpanel"
              :aria-labelledby="KIND_TABS[1].tabId"
              v-if="kind === 'asso'"
              class="space-y-5"
            >
              <h3 class="font-bebas text-2xl text-white">{{ texts.assoTitle }}</h3>

              <div class="rounded-xl border border-brand-card-border bg-white/5 p-4">
                <p
                  class="font-rajdhani text-xs font-bold uppercase tracking-[0.2em] text-brand-red-light"
                >
                  {{ texts.assoFee.label }}
                </p>
                <p class="mt-1 font-bebas text-2xl text-white">
                  {{ texts.assoFee.price }}
                  <span
                    class="font-rajdhani text-sm font-bold uppercase tracking-wider text-gray-400"
                    >{{ texts.assoFee.detail }}</span
                  >
                </p>
              </div>

              <div class="grid gap-5 sm:grid-cols-2">
                <BaseInput
                  v-model="assoForm.name"
                  label="Nom de la structure"
                  name="name"
                  required
                  :error="fieldError('name')"
                />
                <BaseInput
                  v-model="assoForm.siret"
                  label="SIRET"
                  name="siret"
                  hint="14 chiffres, sans espaces."
                  required
                  :error="fieldError('siret')"
                />
                <BaseInput
                  v-model="assoForm.repFirstName"
                  label="Prénom du représentant"
                  name="repFirstName"
                  autocomplete="given-name"
                  required
                  :error="fieldError('repFirstName')"
                />
                <BaseInput
                  v-model="assoForm.repLastName"
                  label="Nom du représentant"
                  name="repLastName"
                  autocomplete="family-name"
                  required
                  :error="fieldError('repLastName')"
                />
                <BaseInput
                  v-model="assoForm.repEmail"
                  label="Email du représentant"
                  type="email"
                  name="repEmail"
                  autocomplete="email"
                  required
                  :error="fieldError('repEmail')"
                />
                <BaseInput
                  v-model="assoForm.address"
                  label="Adresse postale"
                  name="address"
                  autocomplete="street-address"
                  required
                  :error="fieldError('address')"
                />
              </div>

              <BaseTextarea
                v-model="assoForm.description"
                label="Description de la structure"
                name="description"
                :rows="5"
                placeholder="Activités, valeurs, historique…"
                hint="20 caractères minimum."
                required
                :error="fieldError('description')"
              />

              <div class="grid gap-5 sm:grid-cols-2">
                <BaseInput
                  v-model="assoForm.website"
                  label="Site web"
                  type="url"
                  name="website"
                  placeholder="https://…"
                  hint="Facultatif — doit commencer par http(s)://."
                  :error="fieldError('website')"
                />
                <BaseInput
                  v-model="assoForm.discord"
                  label="Lien Discord"
                  type="url"
                  name="discord"
                  placeholder="https://discord.gg/…"
                  hint="Facultatif — lien d’invitation public."
                  :error="fieldError('discord')"
                />
              </div>

              <div>
                <label for="adhesion-games" class="mb-1 block text-xs font-medium text-gray-300">
                  Jeux pratiqués <span class="text-brand-red-light" aria-hidden="true">*</span>
                </label>
                <TagInput
                  v-model="assoForm.games"
                  input-id="adhesion-games"
                  :suggestions="gameSuggestions"
                  placeholder="League of Legends, Valorant… (Entrée pour ajouter)"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Saisie libre avec suggestions issues des associations du réseau.
                </p>
                <p v-if="fieldError('games')" class="mt-1 text-xs text-rose-400" role="alert">
                  {{ fieldError('games') }}
                </p>
              </div>

              <div class="grid gap-5 sm:grid-cols-2">
                <BaseInput
                  v-model="assoForm.membersCount"
                  label="Nombre d’adhérents"
                  type="number"
                  name="membersCount"
                  placeholder="Ex. : 25"
                  hint="Facultatif — estimation approximative."
                  :error="fieldError('membersCount')"
                />
                <BaseFileInput
                  v-model="logoFile"
                  label="Logo de la structure"
                  :accept="LOGO_ACCEPT"
                  input-id="adhesion-logo"
                  hint="Facultatif — PNG ou JPG, aperçu affiché à la sélection."
                />
              </div>

              <div class="border-t border-brand-card-border pt-5">
                <BaseCheckbox
                  v-model="assoForm.acceptCgu"
                  label="J’accepte les conditions d’utilisation et la politique de confidentialité"
                  required
                  input-id="adhesion-asso-cgu"
                  name="acceptCgu"
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

            <!-- Envoi -->
            <div class="mt-8 border-t border-brand-card-border pt-6">
              <BaseButton
                type="submit"
                variant="primary"
                :loading="formStore.adhesionState.submitting"
              >
                {{ texts.submitButton }}
              </BaseButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>
