<script setup lang="ts">
/**
 * Carte d'une association (annuaire TEC) : logo, nom, ville, badges de jeux.
 * Un clic sur la carte ouvre la fiche détaillée (modale) via l'événement `open`.
 */
import { computed } from 'vue';

import { LOGO_PLACEHOLDER } from '@/utils/constants';
import { capitalize } from '@/utils/helpers';
import { publicUrl } from '@/utils/paths';
import type { Association } from '@/types';

interface Props {
  /** Association affichée */
  association: Association;
}

const props = defineProps<Props>();
const emit = defineEmits<{ open: [] }>();

/** Jeux listés, découparés depuis la chaîne CSV du JSON. */
const games = computed(() =>
  (props.association.games ?? '')
    .split(',')
    .map((game) => game.trim())
    .filter(Boolean)
);

/** Repli sur le placeholder si le logo du JSON est introuvable. */
function onLogoError(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (img.src !== LOGO_PLACEHOLDER) {
    img.src = LOGO_PLACEHOLDER;
  }
}
</script>

<template>
  <article class="glass-card rounded-2xl p-6 flex flex-col h-full text-left">
    <div class="flex items-start gap-4">
      <img
        :src="publicUrl(association.logo)"
        :alt="`Logo de ${association.name}`"
        loading="lazy"
        class="h-14 w-14 shrink-0 rounded-xl bg-white/5 object-contain p-1"
        :class="association.imgClass"
        @error="onLogoError"
      />
      <div class="min-w-0">
        <h3 class="font-bebas text-xl text-white leading-tight">
          {{ association.name }}
        </h3>
        <p class="mt-0.5 text-xs uppercase tracking-wider text-brand-red-light">
          {{ capitalize(association.category) }}
        </p>
        <p v-if="association.city" class="mt-0.5 text-xs text-gray-400">
          📍 {{ association.city }}
        </p>
      </div>
    </div>

    <p class="mt-4 text-sm text-gray-400 line-clamp-3 flex-1">
      {{ association.description }}
    </p>

    <ul v-if="games.length > 0" class="mt-4 flex flex-wrap gap-1.5" aria-label="Jeux pratiqués">
      <li
        v-for="game in games.slice(0, 4)"
        :key="game"
        class="rounded-md bg-brand-red/10 border border-brand-red/30 px-2 py-0.5 text-[11px] text-gray-200"
      >
        {{ game }}
      </li>
      <li v-if="games.length > 4" class="px-1 py-0.5 text-[11px] text-gray-500">
        +{{ games.length - 4 }}
      </li>
    </ul>

    <button
      type="button"
      class="mt-5 w-full rounded-xl border border-brand-red/50 px-4 py-2 text-xs font-rajdhani font-bold uppercase tracking-wider text-brand-red-light transition-colors hover:bg-brand-red/10 focus-visible:outline-none"
      :aria-label="`Voir la fiche détaillée de ${association.name}`"
      @click="emit('open')"
    >
      Voir la fiche
    </button>
  </article>
</template>
