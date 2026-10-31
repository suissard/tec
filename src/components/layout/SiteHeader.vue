<script setup lang="ts">
/**
 * En-tête du site : logo, navigation desktop, CTA et menu mobile accessible
 * (piège de focus, touche Échap, fermeture automatique à la navigation).
 */
import { useWindowScroll } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import BaseButton from '@/components/ui/BaseButton.vue';
import { useFocusTrap } from '@/composables/useFocusTrap';
import { routeNames } from '@/router';
import { useAppStore } from '@/stores/app';
import { EXTERNAL_LINKS } from '@/utils/constants';
import {
  CONTACT_NAV,
  DESKTOP_CTA,
  MAIN_NAV,
  MOBILE_ACTIONS,
  PRIMARY_NAV,
} from '@/utils/navigation';
import { publicUrl } from '@/utils/paths';

const appStore = useAppStore();
const route = useRoute();

const isMenuOpen = computed(() => appStore.isMobileMenuOpen);

// En-tête resserré (et souligné d'un filet rouge) dès qu'on a quitté le haut de page.
const { y: scrollY } = useWindowScroll();
const isScrolled = computed(() => scrollY.value > 40);
const mobileMenu = ref<HTMLElement | null>(null);

function toggleMobileMenu(): void {
  appStore.toggleMobileMenu();
}

function closeMobileMenu(): void {
  appStore.closeMobileMenu();
}

// Piège de focus du panneau mobile (Tab cyclique + Échap + restauration du focus).
useFocusTrap(mobileMenu, {
  active: isMenuOpen,
  onEscape: closeMobileMenu,
});

// Fermeture automatique à chaque navigation.
watch(
  () => route.path,
  () => closeMobileMenu()
);
</script>

<template>
  <header
    class="sticky top-0 z-40 bg-[#232323] transition-shadow duration-300 ease-out-expo"
    :class="isScrolled ? 'shadow-[0_4px_20px_rgba(0,0,0,0.5)]' : 'shadow-[0_2px_12px_rgba(0,0,0,0.35)]'"
  >
    <nav
      class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4 transition-[height] duration-300 ease-out-expo"
      :class="isScrolled ? 'md:h-16' : 'md:h-20'"
      aria-label="Navigation principale"
    >
      <!-- Logo -->
      <RouterLink
        :to="{ name: routeNames.Home }"
        class="flex items-center p-1 rounded-xl transition-transform hover:scale-105"
        aria-label="Toulouse Esport Connect — Accueil"
      >
        <img
          :src="publicUrl('/media/logo-clair.svg')"
          alt="Toulouse Esport Connect"
          class="h-10 w-auto transition-[height] duration-300 ease-out-expo"
          :class="isScrolled ? 'md:h-10' : 'md:h-12'"
          width="160"
          height="48"
        />
      </RouterLink>

      <!-- Navigation desktop -->
      <ul class="hidden lg:flex items-center gap-8 mr-auto ml-12">
        <li v-for="item in PRIMARY_NAV" :key="item.label">
          <RouterLink :to="item.to" class="nav-link tec-nav-link">
            {{ item.label }}
          </RouterLink>
        </li>
      </ul>

      <!-- CTA desktop -->
      <div class="hidden lg:flex items-center gap-10">
        <RouterLink :to="CONTACT_NAV.to" class="nav-link tec-nav-link">
          {{ CONTACT_NAV.label }}
        </RouterLink>
        <RouterLink id="header-adhesion" :to="DESKTOP_CTA.to" class="btn-red px-8!">
          {{ DESKTOP_CTA.label }}
        </RouterLink>
      </div>

      <!-- Bascule menu mobile -->
      <button
        type="button"
        class="lg:hidden p-2 rounded-lg text-gray-300 hover:text-brand-red-light hover:bg-white/5 transition-colors"
        :aria-expanded="appStore.isMobileMenuOpen ? 'true' : 'false'"
        aria-controls="mobile-menu"
        :aria-label="appStore.isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
        @click="toggleMobileMenu()"
      >
        <svg
          class="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path v-if="!appStore.isMobileMenuOpen" d="M4 7h16M4 12h16M4 17h16" />
          <path v-else d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </nav>

    <!-- Filet rouge : se trace depuis la gauche quand l'en-tête se resserre -->
    <span
      class="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-brand-red transition-transform duration-500 ease-out-expo"
      :class="isScrolled ? 'scale-x-100' : 'scale-x-0'"
      aria-hidden="true"
    />

    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="appStore.isMobileMenuOpen"
        class="fixed inset-0 bg-black/50 z-40 lg:hidden"
        aria-hidden="true"
        @click="closeMobileMenu()"
      />
    </Transition>

    <!-- Panneau mobile -->
    <Transition name="mobile-panel">
      <aside
        v-if="appStore.isMobileMenuOpen"
        id="mobile-menu"
        ref="mobileMenu"
        tabindex="-1"
        class="fixed inset-y-0 right-0 z-50 w-full md:max-w-xs bg-brand-card-bg shadow-xl border-l border-brand-card-border flex flex-col p-4 overflow-y-auto"
        aria-label="Menu de navigation"
      >
        <div class="flex items-center justify-between mb-6">
          <span class="font-bebas text-2xl text-white">TEC</span>
          <button
            type="button"
            class="p-2 rounded-lg text-gray-300 hover:text-brand-red-light hover:bg-white/5"
            aria-label="Fermer le menu"
            @click="closeMobileMenu()"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav aria-label="Navigation mobile">
          <ul class="space-y-1">
            <li v-for="item in MAIN_NAV" :key="`mobile-${item.label}`">
              <RouterLink
                :to="item.to"
                class="block w-full text-left py-2.5 px-3 rounded-lg text-gray-300 hover:text-brand-red-light hover:bg-white/5 transition-colors"
              >
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </nav>

        <div class="mt-6 pt-4 border-t border-brand-card-border flex flex-col gap-2">
          <BaseButton variant="discord" size="sm" class="w-full" :href="EXTERNAL_LINKS.discord">
            Rejoindre le Discord
          </BaseButton>
          <BaseButton
            v-for="action in MOBILE_ACTIONS"
            :key="action.label"
            :variant="action.variant"
            size="sm"
            class="w-full"
            :to="action.to"
          >
            {{ action.label }}
          </BaseButton>
        </div>
      </aside>
    </Transition>
  </header>
</template>
