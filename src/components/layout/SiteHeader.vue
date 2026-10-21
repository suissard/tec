<script setup lang="ts">
/**
 * En-tête du site : logo, navigation desktop, CTA et menu mobile accessible
 * (piège de focus, touche Échap, fermeture automatique à la navigation).
 */
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import BaseButton from '@/components/ui/BaseButton.vue';
import { useFocusTrap } from '@/composables/useFocusTrap';
import { routeNames } from '@/router';
import { useAppStore } from '@/stores/app';
import { EXTERNAL_LINKS } from '@/utils/constants';

interface NavItem {
  label: string;
  to: { name: routeNames };
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Accueil', to: { name: routeNames.Home } },
  { label: 'Associations', to: { name: routeNames.Associations } },
  { label: 'Événements', to: { name: routeNames.Events } },
  { label: 'Actualités', to: { name: routeNames.News } },
  { label: 'Qui sommes-nous ?', to: { name: routeNames.About } },
  { label: 'Contact', to: { name: routeNames.Contact } },
];

const appStore = useAppStore();
const route = useRoute();

const isMenuOpen = computed(() => appStore.isMobileMenuOpen);
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
    class="sticky top-0 z-40 bg-brand-dark/95 border-b border-brand-card-border transition-all duration-300"
  >
    <nav
      class="max-w-6xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4"
      aria-label="Navigation principale"
    >
      <!-- Logo -->
      <RouterLink
        :to="{ name: routeNames.Home }"
        class="flex items-baseline gap-2 p-1 rounded-xl group"
        aria-label="Toulouse Esport Connect — Accueil"
      >
        <span
          class="font-bebas text-2xl md:text-3xl text-white group-hover:text-brand-red-light transition-colors"
          >TEC</span
        >
        <span class="font-sans text-xs text-gray-400 hidden sm:block">Toulouse Esport Connect</span>
      </RouterLink>

      <!-- Navigation desktop -->
      <ul class="hidden lg:flex items-center gap-6">
        <li v-for="item in NAV_ITEMS" :key="item.label">
          <RouterLink
            :to="item.to"
            class="nav-link relative inline-block py-2 text-sm text-gray-300 hover:text-brand-red-light transition-colors"
          >
            {{ item.label }}
          </RouterLink>
        </li>
      </ul>

      <!-- CTA desktop -->
      <div class="hidden lg:flex items-center gap-3">
        <BaseButton variant="ghost" size="sm" :href="EXTERNAL_LINKS.discord">Discord</BaseButton>
        <BaseButton variant="primary" size="sm" to="/adhesion">Adhésion</BaseButton>
        <BaseButton variant="outline" size="sm" to="/benevolat">Bénévolat</BaseButton>
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
            <li v-for="item in NAV_ITEMS" :key="`mobile-${item.label}`">
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
          <BaseButton variant="primary" size="sm" class="w-full" to="/adhesion">
            Adhésion
          </BaseButton>
          <BaseButton variant="outline" size="sm" class="w-full" to="/benevolat">
            Bénévolat
          </BaseButton>
        </div>
      </aside>
    </Transition>
  </header>
</template>
