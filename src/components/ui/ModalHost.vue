<script setup lang="ts">
/**
 * Hôte de la modale globale (rendu dans un `<Teleport to="body">` d'App.vue).
 * Gère le piège de focus, la touche Échap, le clic sur le voile et le lock scroll.
 */
import { computed, ref, watch } from 'vue';

import { useFocusTrap } from '@/composables/useFocusTrap';
import { useModal } from '@/composables/useModal';

/** Props optionnelles attendues par le contenu de la modale. */
interface ModalHostProps {
  title?: string;
  /** Largeur de la modale (`md` : défaut, `xl` : fiches détaillées) */
  size?: 'md' | 'xl';
}

const { isOpen, content, props, close } = useModal();

const dialogRef = ref<HTMLElement | null>(null);
const modalTitle = computed(() => (props.value as ModalHostProps).title);
const sizeClass = computed(() =>
  (props.value as ModalHostProps).size === 'xl' ? 'max-w-3xl' : 'max-w-lg'
);

/** Mémorise l'overflow précédent du <body> pendant le lock scroll. */
let previousBodyOverflow = '';

function lockScroll(): void {
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
}

function unlockScroll(): void {
  document.body.style.overflow = previousBodyOverflow;
}

// Piège de focus + fermeture par Échap.
useFocusTrap(dialogRef, { active: isOpen, onEscape: close });

// Verrouillage du scroll de la page tant que la modale est ouverte.
watch(
  isOpen,
  (open) => {
    if (open) {
      lockScroll();
    } else {
      unlockScroll();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div
    v-if="isOpen"
    ref="dialogRef"
    class="fixed inset-0 z-[60] flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="modalTitle ? 'modal-title' : undefined"
    :aria-label="modalTitle ? undefined : 'Fenêtre de dialogue'"
    tabindex="-1"
  >
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm"
      aria-hidden="true"
      @click="close()"
    ></div>

    <div
      :class="[
        sizeClass,
        'relative glass-card rounded-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl',
      ]"
    >
      <header
        v-if="modalTitle"
        class="flex items-center justify-between p-4 border-b border-brand-card-border"
      >
        <h2 id="modal-title" class="font-bebas text-xl text-white">{{ modalTitle }}</h2>
        <button
          type="button"
          class="p-1 text-gray-400 hover:text-brand-red-light transition-colors rounded-lg"
          aria-label="Fermer"
          @click="close()"
        >
          ✕
        </button>
      </header>

      <component :is="content" v-bind="props" class="p-4" />
    </div>
  </div>
</template>
