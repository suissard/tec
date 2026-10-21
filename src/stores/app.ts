import { ref } from 'vue';
import { defineStore } from 'pinia';

import { TOAST_DURATION } from '@/utils/constants';
import { uid } from '@/utils/helpers';
import type { Toast, ToastType } from '@/types';

/** État de l'application (hors données métier et formulaires). */
export interface AppState {
  isMobileMenuOpen: boolean;
  isLoading: boolean;
  toasts: Toast[];
}

/** Nombre maximum de toasts affichés simultanément. */
const MAX_VISIBLE_TOASTS = 3;

/** Timers d'auto-masquage, indexés par identifiant de toast. */
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearToastTimer(id: string): void {
  const timer = toastTimers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    toastTimers.delete(id);
  }
}

/**
 * Store d'état global de l'application (menu mobile, chargement, toasts).
 * Chaque toast est auto-masqué après `TOAST_DURATION` (timer par toast).
 */
export const useAppStore = defineStore('app', () => {
  /* ---------------------------------------------------------------- state */
  const isMobileMenuOpen = ref(false);
  const isLoading = ref(false);
  const toasts = ref<Toast[]>([]);

  /* -------------------------------------------------------------- actions */
  /**
   * Ouvre ou ferme le menu mobile.
   * @returns `{void}`
   */
  function toggleMobileMenu(): void {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
  }

  /**
   * Ouvre le menu mobile (utile au survol/focus sur desktop).
   * @returns `{void}`
   */
  function openMobileMenu(): void {
    isMobileMenuOpen.value = true;
  }

  /**
   * Ferme le menu mobile.
   * @returns `{void}`
   */
  function closeMobileMenu(): void {
    isMobileMenuOpen.value = false;
  }

  /**
   * Active ou désactive l'indicateur de chargement global.
   * @param value `true` pendant le chargement
   * @returns `{void}`
   */
  function setLoading(value: boolean): void {
    isLoading.value = value;
  }

  /**
   * Ajoute un toast (auto-masquage après `TOAST_DURATION`).
   * La pile est bornée à `MAX_VISIBLE_TOASTS` entrées.
   *
   * @param message Message affiché
   * @param type Variante visuelle (`info` par défaut)
   * @returns `{void}`
   */
  function showToast(message: string, type: ToastType = 'info'): void {
    const toast: Toast = { id: uid('toast'), message, type };
    toasts.value.push(toast);

    while (toasts.value.length > MAX_VISIBLE_TOASTS) {
      const removed = toasts.value.shift();
      if (removed) clearToastTimer(removed.id);
    }

    toastTimers.set(
      toast.id,
      setTimeout(() => hideToast(toast.id), TOAST_DURATION)
    );
  }

  /**
   * Masque un toast par son identifiant.
   * Sans identifiant, masque tous les toasts affichés.
   *
   * @param id Identifiant du toast (omission = vider la pile)
   * @returns `{void}`
   */
  function hideToast(id?: string): void {
    if (id === undefined) {
      toastTimers.forEach((timer) => clearTimeout(timer));
      toastTimers.clear();
      toasts.value = [];
      return;
    }

    clearToastTimer(id);
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  return {
    isMobileMenuOpen,
    isLoading,
    toasts,
    toggleMobileMenu,
    openMobileMenu,
    closeMobileMenu,
    setLoading,
    showToast,
    hideToast,
  };
});
