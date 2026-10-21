<script setup lang="ts">
/**
 * Stub des préférences cookies (rendu dans la modale globale).
 * Aucun backend : le choix est persisté via `useCookieConsent` (localStorage).
 */
import { ref } from 'vue';

import BaseButton from '@/components/ui/BaseButton.vue';
import { useCookieConsent } from '@/composables/useCookieConsent';
import { useModal } from '@/composables/useModal';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
const { status, accept, decline } = useCookieConsent();
const { close } = useModal();

const analyticsEnabled = ref(status.value === 'granted');

function acceptAll(): void {
  accept();
  close();
  appStore.showToast('Tous les cookies sont acceptés.', 'success');
}

function declineAll(): void {
  decline();
  close();
  appStore.showToast('Cookies optionnels refusés.', 'info');
}

function savePreferences(): void {
  if (analyticsEnabled.value) {
    accept();
    appStore.showToast('Préférences enregistrées : mesure d’audience acceptée.', 'success');
  } else {
    decline();
    appStore.showToast('Préférences enregistrées : mesure d’audience refusée.', 'info');
  }
  close();
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-gray-300">
      Choisissez les cookies autorisés sur ce site. Les cookies techniques nécessaires au
      fonctionnement restent toujours actifs.
    </p>

    <ul class="space-y-3">
      <li class="flex items-start justify-between gap-4 rounded-xl border border-white/10 p-3">
        <div>
          <p class="text-sm font-medium text-white">Cookies techniques</p>
          <p class="text-xs text-gray-400">
            Mémorisation de vos préférences de navigation (obligatoire).
          </p>
        </div>
        <span class="text-xs text-gray-500 uppercase shrink-0">Requis</span>
      </li>

      <li class="flex items-start justify-between gap-4 rounded-xl border border-white/10 p-3">
        <div>
          <label for="cookie-analytics" class="text-sm font-medium text-white cursor-pointer"
            >Mesure d'audience (PostHog)</label
          >
          <p class="text-xs text-gray-400">
            Statistiques anonymes pour améliorer le site. Aucune revente de données.
          </p>
        </div>
        <input
          id="cookie-analytics"
          v-model="analyticsEnabled"
          type="checkbox"
          class="mt-1 h-4 w-4 accent-brand-red shrink-0 cursor-pointer"
        />
      </li>
    </ul>

    <p class="text-xs text-gray-500">
      Consultez le détail dans nos
      <RouterLink
        to="/mentions-legales#cookies"
        class="underline underline-offset-4 hover:text-brand-red-light transition-colors"
        >mentions légales</RouterLink
      >.
    </p>

    <div class="flex flex-wrap gap-3 pt-2 border-t border-white/10">
      <BaseButton variant="primary" size="sm" @click="acceptAll">Tout accepter</BaseButton>
      <BaseButton variant="outline" size="sm" @click="declineAll">Tout refuser</BaseButton>
      <BaseButton variant="ghost" size="sm" @click="savePreferences">Enregistrer</BaseButton>
    </div>
  </div>
</template>
