<script setup lang="ts">
/**
 * Page Accueil — vitrine du réseau : héros, chiffres clés, prochains événements,
 * dernières actualités, associations en avant et appels à l'action.
 */
import { computed, onMounted, ref } from 'vue';

import AssociationCard from '@/components/AssociationCard.vue';
import EventCard from '@/components/EventCard.vue';
import HeroSection from '@/components/HeroSection.vue';
import NewsCard from '@/components/NewsCard.vue';
import AssociationDetailModal from '@/components/AssociationDetailModal.vue';
import EventDetailModal from '@/components/EventDetailModal.vue';
import NewsDetailModal from '@/components/NewsDetailModal.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import StatsCounter, { type StatItem } from '@/components/StatsCounter.vue';
import { useModal } from '@/composables/useModal';
import { useAppStore } from '@/stores/app';
import { useDataStore } from '@/stores/data';
import { STORAGE_KEYS } from '@/utils/constants';
import type { Association, EventItem, NewsItem } from '@/types';

const dataStore = useDataStore();
const appStore = useAppStore();
const modal = useModal();

const pageDescription =
  "Le réseau fédérateur des associations esportives toulousaines : annuaire, agenda et actualités de l'écosystème local.";

/** Retourne une copie mélangée du tableau (Fisher-Yates). */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

/** Nombre de candidatures bénévoles enregistrées dans le navigateur. */
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

/* ------------------------------------------------------------- données */
const upcomingEvents = computed<EventItem[]>(() => dataStore.getUpcomingEvents(3));
const latestNews = computed<NewsItem[]>(() => dataStore.getLatestNews(3));
/** Échantillon d'associations mis en avant (nouvelle sélection à chaque visite). */
const featuredAssociations = computed<Association[]>(() =>
  shuffle(dataStore.associations).slice(0, 4)
);

/** Nombre de bénévoles (persistance locale du formulaire). */
const volunteerCount = ref(0);

const stats = computed<StatItem[]>(() => [
  { value: dataStore.associations.length, label: 'Associations membres' },
  {
    value: dataStore.events.filter((event) => event.status !== 'cancelled').length,
    label: 'Événements organisés',
  },
  { value: volunteerCount.value, label: 'Bénévoles engagés' },
]);

/* --------------------------------------------------------------- modales */
function openEventDetail(event: EventItem): void {
  modal.open(EventDetailModal, { title: event.title, event, size: 'xl' });
}

function openNewsDetail(news: NewsItem): void {
  modal.open(NewsDetailModal, { title: news.title, news, size: 'xl' });
}

function openAssociationDetail(association: Association): void {
  modal.open(AssociationDetailModal, { title: association.name, association, size: 'xl' });
}

/* -------------------------------------------------------------- cycle */
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
    <HeroSection
      eyebrow="Toulouse Esport Connect"
      title="L’esport toulousain, ensemble"
      :subtitle="pageDescription"
    >
      <template #actions>
        <BaseButton variant="primary" to="/associations">Découvrir les associations</BaseButton>
        <BaseButton variant="outline" to="/evenements">Voir l’agenda</BaseButton>
        <BaseButton variant="ghost" to="/benevolat">Devenir bénévole</BaseButton>
      </template>
    </HeroSection>

    <StatsCounter :stats="stats" />

    <!-- Prochains événements -->
    <section class="max-w-6xl mx-auto px-4 py-10 md:py-14" aria-labelledby="home-events">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light"
          >
            Agenda
          </p>
          <h2 id="home-events" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
            Prochains événements
          </h2>
        </div>
        <BaseButton variant="outline" size="sm" to="/evenements">Tout l’agenda</BaseButton>
      </div>

      <p v-if="upcomingEvents.length === 0" class="mt-6 text-sm text-gray-400">
        Aucun événement à venir pour le moment — revenez vite !
      </p>
      <div v-else class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <EventCard
          v-for="event in upcomingEvents"
          :key="event.id"
          :event="event"
          @open="openEventDetail(event)"
        />
      </div>
    </section>

    <!-- Dernières actualités -->
    <section
      class="bg-brand-card-bg/40 border-y border-brand-card-border"
      aria-labelledby="home-news"
    >
      <div class="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light"
            >
              Actualités
            </p>
            <h2 id="home-news" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
              Les dernières nouvelles
            </h2>
          </div>
          <BaseButton variant="outline" size="sm" to="/actualites">Toutes les actus</BaseButton>
        </div>

        <p v-if="latestNews.length === 0" class="mt-6 text-sm text-gray-400">
          Aucune actualité publiée pour l’instant.
        </p>
        <div v-else class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <NewsCard
            v-for="news in latestNews"
            :key="news.id"
            :news="news"
            @open="openNewsDetail(news)"
          />
        </div>
      </div>
    </section>

    <!-- Associations en avant -->
    <section class="max-w-6xl mx-auto px-4 py-10 md:py-14" aria-labelledby="home-associations">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light"
          >
            Le réseau
          </p>
          <h2 id="home-associations" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
            Nos associations membres
          </h2>
        </div>
        <BaseButton variant="outline" size="sm" to="/associations">Tout l’annuaire</BaseButton>
      </div>

      <p v-if="featuredAssociations.length === 0" class="mt-6 text-sm text-gray-400">
        Le réseau est en cours de constitution — bientôt des news !
      </p>
      <div v-else class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <AssociationCard
          v-for="association in featuredAssociations"
          :key="association.id"
          :association="association"
          @open="openAssociationDetail(association)"
        />
      </div>
    </section>

    <!-- Appel à l'action final -->
    <section class="max-w-6xl mx-auto px-4 pb-16" aria-labelledby="home-cta">
      <div class="glass-card rounded-3xl p-8 md:p-12 text-center">
        <h2 id="home-cta" class="font-bebas text-3xl md:text-4xl text-white glow-text">
          Ensemble, faisons rayonner l’esport toulousain !
        </h2>
        <p class="mx-auto mt-3 max-w-2xl text-sm md:text-base text-gray-400">
          Association, club, créateur ou simple passionné : rejoignez le collectif, proposez vos
          événements et participez à la vie du réseau.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-4">
          <BaseButton variant="primary" to="/adhesion">Adhérer au réseau</BaseButton>
          <BaseButton variant="outline" to="/benevolat">Devenir bénévole</BaseButton>
          <BaseButton variant="ghost" to="/contact">Nous contacter</BaseButton>
        </div>
      </div>
    </section>
  </div>
</template>
