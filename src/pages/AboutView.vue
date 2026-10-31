<script setup lang="ts">
/**
 * Page « Qui sommes-nous ? » — présentation du collectif :
 * mission, bureau (2 membres), partenaires, chiffres clés et histoire (jalons).
 */
import { computed, onMounted, ref } from 'vue';

import HeroSection from '@/components/HeroSection.vue';
import Accordion, { type AccordionItem } from '@/components/ui/Accordion.vue';
import ImageCarousel, { type CarouselItem } from '@/components/ui/ImageCarousel.vue';
import StatsCounter, { type StatItem } from '@/components/StatsCounter.vue';
import { useAppStore } from '@/stores/app';
import { useDataStore } from '@/stores/data';
import { LOGO_PLACEHOLDER, STORAGE_KEYS } from '@/utils/constants';
import { pages } from '@/utils/content';
import { publicUrl } from '@/utils/paths';

/** Textes de la page (`pages.about` de `content.json`) : équipe, partenaires, jalons… */
const texts = pages.about;
const TEAM = texts.team.members;
const PARTNERS: CarouselItem[] = texts.partners.logos;
const HISTORY: AccordionItem[] = texts.history.items;

const dataStore = useDataStore();
const appStore = useAppStore();

/** Nombre de candidatures bénévoles enregistrées dans le navigateur. */
const volunteerCount = ref(0);

function countStoredEntries(key: string): number {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

/** Villes uniques déclarées par les associations membres. */
const uniqueCities = computed<string[]>(() => {
  const unique = new Set<string>();
  dataStore.associations.forEach((association) => {
    const city = association.city?.trim();
    if (city) unique.add(city);
  });
  return [...unique];
});

/** Chiffres clés du réseau (compteurs animés). */
const stats = computed<StatItem[]>(() => [
  { value: dataStore.associations.length, label: texts.stats.associations },
  { value: dataStore.getUpcomingEvents().length, label: texts.stats.upcomingEvents },
  { value: volunteerCount.value, label: texts.stats.volunteers },
  { value: uniqueCities.value.length, label: texts.stats.cities },
]);

/** Repli visuel si la photo de l'équipe est absente (404). */
function onPhotoError(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (img.src !== LOGO_PLACEHOLDER) {
    img.src = LOGO_PLACEHOLDER;
  }
}

onMounted(async () => {
  volunteerCount.value = countStoredEntries(STORAGE_KEYS.volunteers);

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
</script>

<template>
  <div>
    <HeroSection v-bind="texts.hero" />

    <!-- Mission -->
    <section class="max-w-6xl mx-auto px-4 py-10 md:py-14" aria-labelledby="about-mission">
      <div class="glass-card rounded-3xl p-8 md:p-12">
        <p class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light">
          {{ texts.mission.eyebrow }}
        </p>
        <h2 id="about-mission" class="mt-2 font-bebas text-3xl md:text-4xl text-white">
          {{ texts.mission.title }}
        </h2>
        <p class="mt-4 max-w-3xl text-sm md:text-base text-gray-400 leading-relaxed">
          {{ texts.mission.text }}
        </p>
      </div>
    </section>

    <!-- Équipe -->
    <section class="max-w-6xl mx-auto px-4 py-10 md:py-14" aria-labelledby="about-team">
      <p class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light">
        {{ texts.team.eyebrow }}
      </p>
      <h2 id="about-team" class="mt-1 font-bebas text-3xl md:text-4xl text-white">{{ texts.team.title }}</h2>

      <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:mx-auto lg:max-w-3xl">
        <article
          v-for="member in TEAM"
          :key="member.name"
          class="glass-card rounded-2xl p-6 text-center"
        >
          <img
            :src="publicUrl(member.photo)"
            :alt="`Portrait de ${member.name}`"
            loading="lazy"
            class="mx-auto h-28 w-28 rounded-full bg-white/5 object-cover"
            @error="onPhotoError"
          />
          <h3 class="mt-4 font-bebas text-xl text-white">{{ member.name }}</h3>
          <p class="text-xs uppercase tracking-wider text-brand-red-light">{{ member.role }}</p>
          <p class="mt-3 text-sm text-gray-400">{{ member.bio }}</p>
        </article>
      </div>
    </section>

    <!-- Partenaires -->
    <section
      class="bg-brand-card-bg/40 border-y border-brand-card-border"
      aria-labelledby="about-partners"
    >
      <div class="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <p class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light">
          {{ texts.partners.eyebrow }}
        </p>
        <h2 id="about-partners" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
          {{ texts.partners.title }}
        </h2>
        <div class="mt-6">
          <ImageCarousel :items="PARTNERS" label="Logos des partenaires" />
        </div>
      </div>
    </section>

    <!-- Chiffres clés -->
    <StatsCounter :stats="stats" />

    <!-- Histoire -->
    <section class="max-w-6xl mx-auto px-4 py-10 md:py-14" aria-labelledby="about-history">
      <p class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light">
        {{ texts.history.eyebrow }}
      </p>
      <h2 id="about-history" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
        {{ texts.history.title }}
      </h2>
      <div class="mt-6">
        <Accordion :items="HISTORY" :default-open="[0]" />
      </div>
    </section>
  </div>
</template>
