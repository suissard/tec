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
import { publicUrl } from '@/utils/paths';

/** Membre du bureau affiché dans l'équipe. */
interface TeamMember {
  name: string;
  role: string;
  /** Chemin de la photo (repli automatique si le fichier est absent) */
  photo: string;
  bio: string;
}

/** Bureau de l'association (données statiques). */
const TEAM: TeamMember[] = [
  {
    name: 'Julien Fontanilles Paltou',
    role: 'Président / Fondateur',
    photo: '/media/team/julien-paltou.jpg',
    bio: 'Porte la vision du collectif et coordonne les grands dossiers du réseau TEC.',
  },
  {
    name: 'Roro',
    role: 'Trésorier / Événementiel',
    photo: '/media/team/roro.jpg',
    bio: 'Suit les comptes et orchestre la logistique des événements du réseau.',
  },
];

/** Logos partenaires (placeholders — à remplacer dans `media/partners/`). */
const PARTNERS: CarouselItem[] = [
  {
    src: 'https://placehold.co/300x100/141419/E30613?text=Partenaire+1',
    alt: 'Partenaire 1',
    label: 'Partenaire 1',
  },
  {
    src: 'https://placehold.co/300x100/141419/FFFFFF?text=Partenaire+2',
    alt: 'Partenaire 2',
    label: 'Partenaire 2',
  },
  {
    src: 'https://placehold.co/300x100/141419/FF3847?text=Partenaire+3',
    alt: 'Partenaire 3',
    label: 'Partenaire 3',
  },
  {
    src: 'https://placehold.co/300x100/141419/E30613?text=Partenaire+4',
    alt: 'Partenaire 4',
    label: 'Partenaire 4',
  },
];

/** Jalons clés du collectif, année par année. */
const HISTORY: AccordionItem[] = [
  {
    id: '2020',
    title: '2020 — La création',
    content:
      "Naissance de Toulouse Esport Connect : quelques associations et passionnés décident de structurer un collectif commun pour fédérer l'esport toulousain.",
  },
  {
    id: '2021',
    title: '2021 — Le premier événement',
    content:
      "Première LAN organisée par le collectif : l'idée prend forme sur le terrain et révèle les besoins partagés des associations membres.",
  },
  {
    id: '2022',
    title: '2022 — 50 associations accompagnées',
    content:
      'Le réseau atteint 50 structures accompagnées : clubs esport, associations de versus fighting, LAN parties et associations étudiantes.',
  },
  {
    id: '2023',
    title: '2023 — 100 bénévoles engagés',
    content:
      "La communauté dépasse les 100 bénévoles réguliers, moteur de l'événementiel, de la communication et du support technique du réseau.",
  },
  {
    id: '2024',
    title: '2024 — Un réseau structuré',
    content:
      'Consolidation du collectif : bureau élu, partenariats renforcés et outils partagés au service des associations et des adhérents.',
  },
];

const dataStore = useDataStore();
const appStore = useAppStore();

const pageTitle = 'Qui sommes-nous ?';
const pageDescription =
  "Toulouse Esport Connect fédère les acteurs de l'esport local autour d'une mission commune : structurer, accompagner et faire rayonner l'écosystème.";

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
  { value: dataStore.associations.length, label: 'Associations membres' },
  { value: dataStore.getUpcomingEvents().length, label: 'Événements à venir' },
  { value: volunteerCount.value, label: 'Bénévoles engagés' },
  { value: uniqueCities.value.length, label: 'Villes représentées' },
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
    <HeroSection :title="pageTitle" :subtitle="pageDescription" eyebrow="Toulouse Esport Connect" />

    <!-- Mission -->
    <section class="max-w-6xl mx-auto px-4 py-10 md:py-14" aria-labelledby="about-mission">
      <div class="glass-card rounded-3xl p-8 md:p-12">
        <p class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light">
          Notre mission
        </p>
        <h2 id="about-mission" class="mt-2 font-bebas text-3xl md:text-4xl text-white">
          Un collectif au service de l'écosystème
        </h2>
        <p class="mt-4 max-w-3xl text-sm md:text-base text-gray-400 leading-relaxed">
          Toulouse Esport Connect rassemble les associations, clubs et acteurs de l'esport
          toulousain autour d'objectifs communs : partager les bonnes pratiques, accompagner la
          création et la structuration des associations, faciliter l'accès aux événements et donner
          de la visibilité aux initiatives locales. Le collectif fonctionne par la contribution de
          ses membres et de ses bénévoles.
        </p>
      </div>
    </section>

    <!-- Équipe -->
    <section class="max-w-6xl mx-auto px-4 py-10 md:py-14" aria-labelledby="about-team">
      <p class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light">
        Le bureau
      </p>
      <h2 id="about-team" class="mt-1 font-bebas text-3xl md:text-4xl text-white">L'équipe</h2>

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
          Ils nous soutiennent
        </p>
        <h2 id="about-partners" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
          Nos partenaires
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
        Notre histoire
      </p>
      <h2 id="about-history" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
        Les jalons du collectif
      </h2>
      <div class="mt-6">
        <Accordion :items="HISTORY" :default-open="[0]" />
      </div>
    </section>
  </div>
</template>
