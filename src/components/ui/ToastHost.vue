<script setup lang="ts">
/**
 * Hôte des notifications toast (rendu dans un `<Teleport to="body">` d'App.vue).
 * Les toasts sont pilotés par le store `app` (auto-retrait après délai).
 */
import { computed } from 'vue';

import { useAppStore } from '@/stores/app';
import type { ToastType } from '@/types';

const appStore = useAppStore();

/** Couleur de la bordure gauche selon le type de toast. */
const BORDER_BY_TYPE: Record<ToastType, string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-brand-red',
  info: 'border-l-sky-500',
};

function borderClass(type: ToastType): string {
  return BORDER_BY_TYPE[type];
}

/** Texte alternatif du bouton de fermeture d'un toast. */
function dismissLabel(message: string): string {
  return `Fermer la notification : ${message}`;
}

const hasToasts = computed(() => appStore.toasts.length > 0);
</script>

<template>
  <div
    v-if="hasToasts"
    class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end"
    aria-label="Notifications"
  >
    <Transition v-for="toast in appStore.toasts" :key="toast.id" name="slide-fade">
      <div
        :key="toast.id"
        class="glass-card rounded-xl border-l-4 px-4 py-3 min-w-[280px] max-w-md shadow-lg flex items-start gap-3"
        :class="borderClass(toast.type)"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p class="text-sm text-gray-100 flex-1">{{ toast.message }}</p>
        <button
          type="button"
          class="shrink-0 text-gray-400 hover:text-white transition-colors"
          :aria-label="dismissLabel(toast.message)"
          @click="appStore.hideToast(toast.id)"
        >
          ✕
        </button>
      </div>
    </Transition>
  </div>
</template>
