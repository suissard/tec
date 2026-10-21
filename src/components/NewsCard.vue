<script setup lang="ts">
/**
 * Carte d'actualité TEC avec 3 variantes :
 * - `featured` : grande image 16:9, titre en h2, extrait long et appel à la lecture ;
 * - `default`  : vignette 4:3, titre, extrait court et méta ;
 * - `compact`  : titre + date uniquement (colonne latérale).
 * Un clic ouvre la fiche détaillée (modale) via l'événement `open`.
 */
import { computed } from 'vue';

import { IMAGE_PLACEHOLDER } from '@/utils/constants';
import { formatDateLong, formatDateShort, truncate } from '@/utils/helpers';
import type { NewsItem } from '@/types';

interface Props {
  /** Actualité affichée */
  news: NewsItem;
  /** Variante visuelle de la carte */
  variant?: 'featured' | 'default' | 'compact';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
});

const emit = defineEmits<{ open: [] }>();

const isFeatured = computed(() => props.variant === 'featured');
const isCompact = computed(() => props.variant === 'compact');

/** Image de l'article, avec repli sur le placeholder TEC. */
const imageUrl = computed(() => props.news.image ?? IMAGE_PLACEHOLDER);

/** Date longue (« 15 octobre 2026 ») pour les cartes pleines. */
const longDate = computed(() => formatDateLong(props.news.date));

/** Date courte (« 15 OCT. ») pour la carte compacte. */
const shortDate = computed(() => formatDateShort(props.news.date));

/** Extrait tronqué selon la variante (featured : plus verbeux). */
const excerpt = computed(() => truncate(props.news.excerpt ?? '', isFeatured.value ? 220 : 140));

/** Temps de lecture par défaut (minuterie éditoriale). */
const readTime = computed(() => props.news.readTime ?? 3);

/** Repli sur l'image de parcours si le visuel du JSON est introuvable. */
function onImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (img.src !== IMAGE_PLACEHOLDER) {
    img.src = IMAGE_PLACEHOLDER;
  }
}
</script>

<template>
  <!-- Variante compacte : titre + date (sidebar) -->
  <article v-if="isCompact" class="flex items-baseline justify-between gap-3 py-1">
    <h3 class="min-w-0">
      <button
        type="button"
        class="text-left text-sm text-gray-200 hover:text-brand-red-light transition-colors"
        :aria-label="`Lire l’actualité : ${news.title}`"
        @click="emit('open')"
      >
        {{ news.title }}
      </button>
    </h3>
    <time class="shrink-0 text-[11px] uppercase tracking-wider text-gray-500" :datetime="news.date">
      {{ shortDate }}
    </time>
  </article>

  <!-- Variante mise en avant : grande carte d'accueil -->
  <article
    v-else-if="isFeatured"
    class="glass-card rounded-2xl overflow-hidden h-full text-left flex flex-col"
  >
    <div class="relative aspect-video overflow-hidden">
      <img
        :src="imageUrl"
        :alt="`Illustration : ${news.title}`"
        class="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        @error="onImageError"
      />
      <span
        class="absolute left-4 top-4 rounded-full bg-brand-red px-3 py-1 text-[11px] font-rajdhani font-bold uppercase tracking-wider text-white glow-red-sm"
      >
        {{ news.category }}
      </span>
    </div>

    <div class="flex flex-1 flex-col p-5 sm:p-6">
      <h2 class="font-bebas text-2xl sm:text-3xl text-white leading-tight">
        <button
          type="button"
          class="hover:text-brand-red-light transition-colors focus-visible:outline-none"
          :aria-label="`Lire l’actualité : ${news.title}`"
          @click="emit('open')"
        >
          {{ news.title }}
        </button>
      </h2>

      <p class="mt-3 text-sm text-gray-400 leading-relaxed flex-1">{{ excerpt }}</p>

      <p class="mt-4 text-xs text-gray-500">
        <span class="sr-only">Auteur : </span>{{ news.author }}
        <span aria-hidden="true">·</span>
        <time :datetime="news.date">{{ longDate }}</time>
        <span aria-hidden="true">·</span>
        <span class="whitespace-nowrap">⏱ {{ readTime }} min de lecture</span>
      </p>

      <button
        type="button"
        class="mt-5 self-start rounded-xl border border-brand-red/50 px-4 py-2 text-xs font-rajdhani font-bold uppercase tracking-wider text-brand-red-light transition-colors hover:bg-brand-red/10 focus-visible:outline-none"
        :aria-label="`Lire la suite de : ${news.title}`"
        @click="emit('open')"
      >
        Lire la suite
      </button>
    </div>
  </article>

  <!-- Variante par défaut : vignette 4:3 + résumé -->
  <article v-else class="glass-card rounded-2xl overflow-hidden h-full text-left flex flex-col">
    <div class="relative aspect-[4/3] overflow-hidden">
      <img
        :src="imageUrl"
        :alt="`Illustration : ${news.title}`"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        @error="onImageError"
      />
      <span
        class="absolute left-3 top-3 rounded-full bg-brand-dark/80 px-2.5 py-1 text-[11px] font-rajdhani font-bold uppercase tracking-wider text-brand-red-light border border-brand-red/40"
      >
        {{ news.category }}
      </span>
    </div>

    <div class="flex flex-1 flex-col p-5">
      <h3 class="font-bebas text-xl text-white leading-tight">
        <button
          type="button"
          class="hover:text-brand-red-light transition-colors focus-visible:outline-none"
          :aria-label="`Lire l’actualité : ${news.title}`"
          @click="emit('open')"
        >
          {{ news.title }}
        </button>
      </h3>

      <p class="mt-2 text-sm text-gray-400 line-clamp-3 flex-1">{{ excerpt }}</p>

      <p class="mt-4 text-xs text-gray-500">
        {{ news.author }}
        <span aria-hidden="true">·</span>
        <time :datetime="news.date">{{ longDate }}</time>
      </p>

      <button
        type="button"
        class="mt-4 self-start text-xs font-rajdhani font-bold uppercase tracking-wider text-brand-red-light hover:text-white transition-colors focus-visible:outline-none"
        :aria-label="`Lire la suite de : ${news.title}`"
        @click="emit('open')"
      >
        Lire la suite →
      </button>
    </div>
  </article>
</template>
