<script setup lang="ts">
/**
 * Carrousel d'images/logos : défilement automatique (pause au survol et au focus),
 * navigation par points et flèches, mise en pause si la page est masquée.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

/** Visuel affiché dans le carrousel. */
export interface CarouselItem {
  src: string;
  alt: string;
  /** Libellé facultatif affiché sous le logo */
  label?: string;
}

interface Props {
  items: CarouselItem[];
  /** Intervalle de défilement automatique (ms) */
  interval?: number;
  /** Libellé accessible du carrousel */
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  interval: 4000,
  label: 'Carrousel',
});

const currentIndex = ref(0);
const isPaused = ref(false);

let timer: ReturnType<typeof setInterval> | null = null;

const currentItem = computed(() => props.items[currentIndex.value]);

function goTo(index: number): void {
  currentIndex.value = (index + props.items.length) % props.items.length;
}

function next(): void {
  goTo(currentIndex.value + 1);
}

function previous(): void {
  goTo(currentIndex.value - 1);
}

function startAutoPlay(): void {
  stopAutoPlay();
  if (props.items.length < 2) return;
  timer = setInterval(() => {
    if (!isPaused.value && !document.hidden) next();
  }, props.interval);
}

function stopAutoPlay(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

onMounted(startAutoPlay);
onBeforeUnmount(stopAutoPlay);
</script>

<template>
  <div
    v-if="items.length > 0"
    class="relative w-full"
    role="group"
    :aria-label="label"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
    @focusin="isPaused = true"
    @focusout="isPaused = false"
  >
    <div
      class="relative h-32 sm:h-36 overflow-hidden rounded-2xl border border-brand-card-border bg-white/[0.03]"
    >
      <Transition name="fade" mode="out-in">
        <div
          :key="currentIndex"
          class="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4"
        >
          <img
            :src="currentItem.src"
            :alt="currentItem.alt"
            class="max-h-16 sm:max-h-20 max-w-[60%] object-contain"
            loading="lazy"
          />
          <p v-if="currentItem.label" class="text-xs text-gray-400 text-center">
            {{ currentItem.label }}
          </p>
        </div>
      </Transition>

      <!-- Contrôles (uniquement si plusieurs items) -->
      <template v-if="items.length > 1">
        <button
          type="button"
          class="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-brand-dark/70 border border-brand-card-border text-gray-300 hover:text-white hover:border-brand-red transition-colors flex items-center justify-center"
          :aria-label="`Élément précédent : ${label}`"
          @click="previous"
        >
          ‹
        </button>
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-brand-dark/70 border border-brand-card-border text-gray-300 hover:text-white hover:border-brand-red transition-colors flex items-center justify-center"
          :aria-label="`Élément suivant : ${label}`"
          @click="next"
        >
          ›
        </button>

        <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2" role="tablist">
          <button
            v-for="(item, index) in items"
            :key="item.alt"
            type="button"
            role="tab"
            class="h-2 w-2 rounded-full transition-colors"
            :class="index === currentIndex ? 'bg-brand-red' : 'bg-white/25 hover:bg-white/50'"
            :aria-selected="index === currentIndex"
            :aria-label="'Afficher ' + (item.label ?? item.alt)"
            @click="goTo(index)"
          ></button>
        </div>
      </template>
    </div>

    <p class="mt-2 text-center text-xs text-gray-500" aria-live="polite">
      {{ currentIndex + 1 }} / {{ items.length }}<span v-if="isPaused"> — défilement en pause</span>
    </p>
  </div>
</template>
