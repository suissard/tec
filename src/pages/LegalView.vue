<script setup lang="ts">
/**
 * Page Mentions légales — statut de l'association, RGPD, cookies et CGU.
 * Sommaire latéral collant avec scrollspy (IntersectionObserver) et bouton
 * d'impression ; ancres `#rgpd` / `#cookies` référencées depuis le pied de page.
 */
import { onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';

import HeroSection from '@/components/HeroSection.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import CookiePreferencesPanel from '@/components/ui/CookiePreferencesPanel.vue';
import RichText from '@/components/ui/RichText.vue';
import { useIntersectionObserver } from '@/composables/useIntersectionObserver';
import { useModal } from '@/composables/useModal';
import { useAppStore } from '@/stores/app';
import { useDataStore } from '@/stores/data';
import { pages } from '@/utils/content';

/** Textes de la page (`pages.legal` de `content.json`). */
const texts = pages.legal;

/** Sections de la page (ancres du sommaire), dans l'ordre du JSON. */
const SECTIONS = texts.sections;

/** Tableau des cookies (affiché dans la section marquée `cookieTable`). */
const COOKIES = texts.cookies;

const dataStore = useDataStore();
const appStore = useAppStore();
const { open } = useModal();

/* ------------------------------------------------------------------ scrollspy */
/** Éléments DOM des sections (un ref par section, index aligné sur SECTIONS). */
const sectionEls = SECTIONS.map(() => ref<HTMLElement | null>(null));

/** Section actuellement soulignée dans le sommaire. */
const activeSection = ref<string>(SECTIONS[0].id);

/**
 * Observers de scrollspy : une instance par section, sur une bande de lecture
 * dans le tiers supérieur de l'écran (`rootMargin -66%` en bas).
 * `threshold: 0` : une section plus haute que la bande ne pourrait jamais
 * atteindre un seuil élevé — on retient donc la première intersection.
 */
const sectionObservers = SECTIONS.map((_section, index) =>
  useIntersectionObserver(sectionEls[index], {
    threshold: 0,
    rootMargin: '-100px 0px -66% 0px',
  })
);

sectionObservers.forEach((observer, index) => {
  watch(observer.isIntersecting, (isIntersecting) => {
    if (isIntersecting) {
      activeSection.value = SECTIONS[index].id;
    }
  });
});

/** Callbacks de ref stables (identité préservée entre deux rendus). */
const sectionRefCallbacks = SECTIONS.map(
  (_section, index) =>
    (el: Element | ComponentPublicInstance | null): void => {
      sectionEls[index].value = (el as HTMLElement | null) ?? null;
    }
);

/** Ouvre le panneau de préférences cookies dans la modale globale. */
function openCookiePreferences(): void {
  open(CookiePreferencesPanel, { title: 'Préférences cookies' });
}

/** Imprime la page via le dialogue d'impression du navigateur. */
function printPage(): void {
  window.print();
}

onMounted(async () => {
  appStore.setLoading(true);
  try {
    await dataStore.loadAll();
    if (dataStore.error) {
      appStore.showToast('Erreur chargement données', 'error');
    }
  } catch {
    appStore.showToast('Erreur chargement données', 'error');
  } finally {
    appStore.setLoading(false);
  }
});

onBeforeUnmount(() => {
  sectionObservers.forEach((observer) => observer.stop());
});
</script>

<template>
  <div>
    <HeroSection v-bind="texts.hero" />

    <div class="max-w-6xl mx-auto px-4 py-10 md:py-14">
      <div class="flex flex-col gap-8 lg:flex-row-reverse">
        <!-- Sommaire -->
        <aside class="lg:w-64 lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Sommaire des mentions légales">
            <p
              class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light"
            >
              {{ texts.summaryTitle }}
            </p>
            <ul class="mt-3 space-y-2">
              <li v-for="section in SECTIONS" :key="section.id">
                <a
                  :href="`#${section.id}`"
                  class="nav-link block border-l-2 pl-3 text-sm transition-colors"
                  :class="
                    activeSection === section.id
                      ? 'active border-brand-red text-brand-red-light font-medium'
                      : 'border-brand-card-border text-gray-400 hover:border-gray-500 hover:text-white'
                  "
                  :aria-current="activeSection === section.id ? 'true' : undefined"
                >
                  {{ section.title }}
                </a>
              </li>
            </ul>
            <div class="mt-6 border-t border-brand-card-border pt-4">
              <BaseButton variant="ghost" size="sm" @click="printPage">
                {{ texts.printButton }}
              </BaseButton>
            </div>
          </nav>
        </aside>

        <!-- Contenu -->
        <div class="min-w-0 flex-1 space-y-8">
          <section
            v-for="(section, index) in SECTIONS"
            :id="section.id"
            :key="section.id"
            :ref="sectionRefCallbacks[index]"
            :aria-labelledby="`legal-${section.id}`"
            class="glass-card scroll-mt-28 rounded-2xl p-6 md:p-8"
          >
            <h2 :id="`legal-${section.id}`" class="font-bebas text-2xl md:text-3xl text-white">
              {{ section.title }}
            </h2>

            <p v-if="section.intro" class="mt-3 text-sm leading-relaxed text-gray-400">
              <RichText :text="section.intro" />
            </p>

            <dl v-if="section.details?.length" class="mt-4 space-y-3 text-sm">
              <div v-for="detail in section.details" :key="detail.term" class="sm:flex sm:gap-4">
                <dt class="sm:w-48 shrink-0 text-gray-500">{{ detail.term }}</dt>
                <dd class="text-gray-200"><RichText :text="detail.value" /></dd>
              </div>
            </dl>

            <!-- Tableau des cookies -->
            <template v-if="section.cookieTable">
              <div class="mt-4 overflow-x-auto">
                <table class="w-full min-w-[36rem] text-left text-sm">
                  <caption class="sr-only">
                    {{ COOKIES.caption }}
                  </caption>
                  <thead>
                    <tr class="border-b border-brand-card-border text-xs uppercase tracking-wider">
                      <th scope="col" class="py-2 pr-4 font-medium text-gray-500">{{ COOKIES.columns.name }}</th>
                      <th scope="col" class="py-2 pr-4 font-medium text-gray-500">{{ COOKIES.columns.purpose }}</th>
                      <th scope="col" class="py-2 pr-4 font-medium text-gray-500">{{ COOKIES.columns.duration }}</th>
                      <th scope="col" class="py-2 font-medium text-gray-500">{{ COOKIES.columns.type }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="cookie in COOKIES.rows"
                      :key="cookie.name"
                      class="border-b border-brand-card-border/60 last:border-b-0"
                    >
                      <td class="py-3 pr-4 font-mono text-xs text-gray-200">{{ cookie.name }}</td>
                      <td class="py-3 pr-4 text-gray-400">{{ cookie.purpose }}</td>
                      <td class="py-3 pr-4 text-gray-400">{{ cookie.duration }}</td>
                      <td class="py-3 text-gray-400">{{ cookie.type }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-5 flex flex-wrap items-center gap-4">
                <BaseButton variant="outline" size="sm" @click="openCookiePreferences">
                  {{ COOKIES.manageButton }}
                </BaseButton>
                <p class="text-xs text-gray-500">{{ COOKIES.note }}</p>
              </div>
            </template>

            <template v-for="block in section.blocks ?? []" :key="block.title">
              <h3 class="mt-6 font-bebas text-xl text-white">{{ block.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-gray-400">
                <RichText :text="block.text" />
              </p>
            </template>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
