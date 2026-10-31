<script setup lang="ts">
/**
 * Fiche détaillée d'une association (contenu de la modale globale, size `xl`).
 * Affiche logo, présentation, jeux (lecture seule), catégorie et liens utiles.
 * La fermeture passe par `useModal().close()` (Échap / voile gérés par ModalHost).
 */
import { computed } from 'vue';

import TagInput from '@/components/ui/TagInput.vue';
import { useModal } from '@/composables/useModal';
import { LOGO_PLACEHOLDER } from '@/utils/constants';
import { capitalize } from '@/utils/helpers';
import { publicUrl } from '@/utils/paths';
import type { Association } from '@/types';

interface Props {
  /** Association détaillée */
  association: Association;
  /** Titre affiché dans l'en-tête de `ModalHost` (prop absorbée) */
  title?: string;
  /** Taille de la modale (pilotée par `ModalHost`, absorbée ici) */
  size?: 'md' | 'xl';
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  size: 'xl',
});

const { close } = useModal();

/** Jeux déclarés par l'association (chaîne CSV du JSON). */
const games = computed(() =>
  (props.association.games ?? '')
    .split(',')
    .map((game) => game.trim())
    .filter(Boolean)
);

/** URL du site web garantie non vide (rendu conditionnel). */
const websiteUrl = computed(() => props.association.website ?? '');

/** Repli sur le placeholder si le logo du JSON est introuvable. */
function onLogoError(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (img.src !== LOGO_PLACEHOLDER) {
    img.src = LOGO_PLACEHOLDER;
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Identité -->
    <div class="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
      <img
        :src="publicUrl(association.logo)"
        :alt="`Logo de ${association.name}`"
        class="h-40 w-40 sm:h-[180px] sm:w-[180px] shrink-0 rounded-2xl bg-white/5 object-contain p-2"
        :class="association.imgClass"
        @error="onLogoError"
      />
      <div class="min-w-0">
        <h3 class="font-bebas text-3xl text-white leading-tight">{{ association.name }}</h3>
        <p class="mt-1 text-xs uppercase tracking-wider text-brand-red-light">
          {{ capitalize(association.category) }}
        </p>
        <p v-if="association.city" class="mt-1 text-sm text-gray-400">📍 {{ association.city }}</p>
        <a
          v-if="association.email"
          :href="`mailto:${association.email}`"
          class="mt-3 inline-flex items-center gap-2 text-sm text-gray-300 hover:text-brand-red-light transition-colors"
        >
          <span aria-hidden="true">✉</span>
          {{ association.email }}
        </a>
      </div>
    </div>

    <!-- Description -->
    <section aria-label="Présentation">
      <h4 class="font-rajdhani text-sm font-bold uppercase tracking-wider text-gray-300">
        Présentation
      </h4>
      <p class="mt-2 text-sm text-gray-400 leading-relaxed">{{ association.description }}</p>
    </section>

    <!-- Jeux pratiqués (lecture seule) -->
    <section v-if="games.length > 0" aria-label="Jeux pratiqués">
      <h4 class="font-rajdhani text-sm font-bold uppercase tracking-wider text-gray-300 mb-2">
        Jeux pratiqués
      </h4>
      <TagInput :model-value="games" :readonly="true" placeholder="" />
    </section>

    <!-- Liens utiles -->
    <section aria-label="Liens utiles">
      <h4 class="font-rajdhani text-sm font-bold uppercase tracking-wider text-gray-300 mb-2">
        Liens utiles
      </h4>
      <ul class="grid gap-2 sm:grid-cols-2">
        <li v-if="websiteUrl">
          <a
            :href="websiteUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 rounded-xl border border-brand-card-border bg-white/[0.03] px-4 py-3 text-sm text-gray-200 hover:border-brand-red/60 hover:text-white transition-colors"
            :aria-label="`Site web de ${association.name} (nouvel onglet)`"
          >
            <span aria-hidden="true" class="text-brand-red-light">🌐</span>
            Site web
          </a>
        </li>
        <li v-if="association.discord">
          <a
            :href="association.discord"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 rounded-xl border border-brand-card-border bg-white/[0.03] px-4 py-3 text-sm text-gray-200 hover:border-brand-discord/60 hover:text-white transition-colors"
            :aria-label="`Serveur Discord de ${association.name} (nouvel onglet)`"
          >
            <span aria-hidden="true" class="text-[#5865F2]">💬</span>
            Discord
          </a>
        </li>
        <li v-if="association.email">
          <a
            :href="`mailto:${association.email}`"
            class="flex items-center gap-3 rounded-xl border border-brand-card-border bg-white/[0.03] px-4 py-3 text-sm text-gray-200 hover:border-brand-red/60 hover:text-white transition-colors"
            :aria-label="`Envoyer un email à ${association.name}`"
          >
            <span aria-hidden="true" class="text-brand-red-light">✉</span>
            Email
          </a>
        </li>
      </ul>
    </section>

    <!-- Parcours d'adhésion -->
    <div class="flex flex-wrap gap-3 border-t border-brand-card-border pt-5">
      <RouterLink
        :to="`/adhesion?asso=${association.id}`"
        class="inline-flex items-center justify-center rounded-xl bg-brand-red px-6 py-2.5 text-sm font-rajdhani font-bold uppercase tracking-wider text-white glow-red-sm hover:bg-brand-red-hover transition-colors focus-visible:outline-none"
        @click="close()"
      >
        Adhérer au réseau
      </RouterLink>
      <button
        type="button"
        class="rounded-xl border border-brand-card-border px-6 py-2.5 text-sm font-rajdhani font-bold uppercase tracking-wider text-gray-300 hover:text-white hover:border-brand-red/60 transition-colors focus-visible:outline-none"
        @click="close()"
      >
        Fermer
      </button>
    </div>
  </div>
</template>
