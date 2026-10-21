<script setup lang="ts">
/**
 * Bannière de consentement cookies (RGPD) — rendue dans `<Teleport to="body">`.
 * Les préférences détaillées s'ouvrent dans la modale globale (stub).
 */
import CookiePreferencesPanel from '@/components/ui/CookiePreferencesPanel.vue';
import { useCookieConsent } from '@/composables/useCookieConsent';
import { useModal } from '@/composables/useModal';
import BaseButton from '@/components/ui/BaseButton.vue';

const { status, accept, decline } = useCookieConsent();
const { open } = useModal();

function openPreferences(): void {
  open(CookiePreferencesPanel, { title: 'Préférences cookies' });
}
</script>

<template>
  <div
    v-if="status === 'pending'"
    class="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-brand-card-border p-4 md:p-6 shadow-2xl"
    role="dialog"
    aria-label="Consentement cookies"
  >
    <div class="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="text-sm text-gray-300 leading-relaxed max-w-3xl">
        <p class="font-medium text-white mb-1">Cookies et mesures d'audience</p>
        <p class="text-xs sm:text-sm text-gray-400">
          Nous utilisons des cookies pour mesurer l'audience du site et améliorer votre expérience.
          Aucune donnée personnelle n'est vendue à des tiers.
          <RouterLink
            to="/mentions-legales#cookies"
            class="underline underline-offset-4 hover:text-brand-red-light transition-colors"
            >En savoir plus</RouterLink
          >
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 justify-end shrink-0">
        <BaseButton variant="ghost" size="sm" @click="openPreferences()">Personnaliser</BaseButton>
        <BaseButton variant="outline" size="sm" @click="decline()">Refuser</BaseButton>
        <BaseButton variant="primary" size="sm" @click="accept()">Tout accepter</BaseButton>
      </div>
    </div>
  </div>
</template>
