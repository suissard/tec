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
  <article class="tec-card p-6 flex flex-col h-full text-left">
    <div class="flex items-start gap-4">
      <img
        :src="publicUrl(association.logo)"
        :alt="`Logo de ${association.name}`"
        loading="lazy"
        class="h-14 w-14 shrink-0 rounded-md bg-white/60 object-contain p-1"
        :class="association.imgClass"
        @error="onLogoError"
      />
      <div class="min-w-0">
        <h3 class="font-bebas text-2xl text-[#141414] leading-tight">
          {{ association.name }}
        </h3>
        <p class="mt-0.5 font-rajdhani text-xs font-bold uppercase tracking-wider text-brand-red">
          {{ capitalize(association.category) }}
        </p>
        <p v-if="association.city" class="mt-1 inline-flex items-center gap-1.5 text-xs text-[#333]">
          <svg class="h-3.5 w-3.5 text-brand-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
          {{ association.city }}
        </p>
      </div>
    </div>

    <p class="mt-4 text-sm text-[#333] line-clamp-3 flex-1">
      {{ association.description }}
    </p>

    <ul v-if="games.length > 0" class="mt-4 flex flex-wrap gap-1.5" aria-label="Jeux pratiqués">
      <li
        v-for="game in games.slice(0, 4)"
        :key="game"
        class="border border-brand-red/30 bg-brand-red/10 px-2 py-0.5 text-[11px] text-[#222]"
      >
        {{ game }}
      </li>
      <li v-if="games.length > 4" class="px-1 py-0.5 text-[11px] text-[#4a4a4a]">
        +{{ games.length - 4 }}
      </li>
    </ul>

    <button
      type="button"
      class="btn-red btn-sm mt-5 self-start"
      :aria-label="`Voir la fiche détaillée de ${association.name}`"
      @click="emit('open')"
    >
      Voir la fiche
    </button>
  </article>
</template>
