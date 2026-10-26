<script setup lang="ts">
/**
 * Page Événements — agenda à onglets (à venir / passés / par catégorie)
 * avec filtres communs (recherche, catégorie, plage de dates),
 * pagination 12 par page et fiche détaillée en modale.
 */
import { computed, onMounted, ref, watch } from 'vue';

import EventCard from '@/components/EventCard.vue';
import EventDetailModal from '@/components/EventDetailModal.vue';
import SearchInput from '@/components/SearchInput.vue';
import Accordion, { type AccordionItem } from '@/components/ui/Accordion.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue';
import BaseSelect, { type SelectOption } from '@/components/ui/BaseSelect.vue';
import Pagination from '@/components/Pagination.vue';
import { useModal } from '@/composables/useModal';
import { useAppStore } from '@/stores/app';
import { useDataStore } from '@/stores/data';
import { groupBy } from '@/utils/helpers';
import type { EventItem } from '@/types';

/** Onglets disponibles de l'agenda. */
type EventTab = 'upcoming' | 'past' | 'byCategory';

/** Libellés des onglets (pills). */
const TABS: { id: EventTab; label: string }[] = [
  { id: 'upcoming', label: 'À venir' },
  { id: 'past', label: 'Passés' },
  { id: 'byCategory', label: 'Par catégorie' },
];

/** Message d'état vide selon l'onglet actif. */
const EMPTY_MESSAGES: Record<EventTab, string> = {
  upcoming: 'Aucun événement à venir ne correspond à vos filtres — revenez vite !',
  past: 'Aucun événement passé ne correspond à vos filtres.',
  byCategory: 'Aucun événement à afficher pour le moment.',
};

/** Nombre d'événements affichés par page (hors onglet « Par catégorie »). */
const PAGE_SIZE = 12;

const dataStore = useDataStore();
const appStore = useAppStore();
const modal = useModal();

const pageTitle = 'Événements';
const pageDescription =
  'Agenda des tournois, LAN et rendez-vous esport organisés par le réseau TEC à Toulouse et en Occitanie.';

/** Jour courant (ISO) figé au montage : découpe « à venir » / « passé ». */
const todayIso = new Date().toISOString().slice(0, 10);

/* --------------------------------------------------------- état & filtres */
const activeTab = ref<EventTab>('upcoming');
const search = ref('');
const category = ref('');
const dateStart = ref('');
const dateEnd = ref('');
const page = ref(1);

/** Minuscules sans accents (comparaison insensible à la casse/accents). */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Options du sélecteur de catégorie (avec compteurs + option « toutes »). */
const categoryOptions = computed<SelectOption[]>(() => {
  const counts = new Map<string, number>();
  dataStore.events.forEach((event) => {
    const key = event.category.trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [
    { value: '', label: 'Toutes les catégories' },
    ...[...counts.entries()].map(([label, count]) => ({
      value: label,
      label: `${label} (${count})`,
    })),
  ];
});

/** Événements filtrés par recherche, catégorie et plage de dates. */
const baseFiltered = computed<EventItem[]>(() => {
  const terms = normalize(search.value).split(/\s+/).filter(Boolean);

  return dataStore.events.filter((event) => {
    if (terms.length > 0) {
      const haystack = normalize(
        [event.title, event.organizer, event.description, event.category].join(' ')
      );
      if (!terms.every((term) => haystack.includes(term))) return false;
    }
    if (category.value && normalize(event.category) !== normalize(category.value)) return false;
    if (dateStart.value && (event.endDate ?? event.date) < dateStart.value) return false;
    if (dateEnd.value && event.date > dateEnd.value) return false;
    return true;
  });
});

/** Onglet « À venir » : date >= aujourd'hui et non annulé (tri croissant). */
const upcoming = computed<EventItem[]>(() =>
  baseFiltered.value
    .filter((event) => event.date >= todayIso && event.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
);

/** Onglet « Passés » : date < aujourd'hui (tri décroissant). */
const past = computed<EventItem[]>(() =>
  baseFiltered.value
    .filter((event) => event.date < todayIso)
    .sort((a, b) => b.date.localeCompare(a.date))
);

/** Liste paginée de l'onglet courant (upcoming / past). */
const currentList = computed<EventItem[]>(() =>
  activeTab.value === 'past' ? past.value : upcoming.value
);

const totalPages = computed(() => Math.max(1, Math.ceil(currentList.value.length / PAGE_SIZE)));

const paginated = computed<EventItem[]>(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return currentList.value.slice(start, start + PAGE_SIZE);
});

/** Regroupement par catégorie (onglet « Par catégorie »), ordre chronologique. */
const sortedByDate = computed<EventItem[]>(() =>
  [...baseFiltered.value].sort((a, b) => a.date.localeCompare(b.date))
);
const eventsByCategory = computed<Record<string, EventItem[]>>(() =>
  groupBy(sortedByDate.value, 'category')
);
const categoryItems = computed<AccordionItem[]>(() =>
  Object.entries(eventsByCategory.value).map(([name, events]) => ({
    id: name,
    title: `${name} (${events.length})`,
  }))
);

const hasActiveFilters = computed(
  () =>
    search.value !== '' || category.value !== '' || dateStart.value !== '' || dateEnd.value !== ''
);

// Un changement de filtre ou d'onglet revient à la page 1.
watch([search, category, dateStart, dateEnd, activeTab], () => {
  page.value = 1;
});

// Borne la page courante si la liste se réduit.
watch(totalPages, (total) => {
  if (page.value > total) page.value = total;
});

/** Réinitialise les filtres de l'agenda. */
function resetFilters(): void {
  search.value = '';
  category.value = '';
  dateStart.value = '';
  dateEnd.value = '';
  page.value = 1;
}

/* --------------------------------------------------------------- modales */
function openEventDetail(event: EventItem): void {
  modal.open(EventDetailModal, { title: event.title, event, size: 'xl' });
}

/* --------------------------------------------------------------- cycle */
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
</script>

<template>
  <section class="max-w-6xl mx-auto px-4 py-12 md:py-20">
    <header class="mb-10 text-center">
      <h1 class="section-title text-[clamp(2.4rem,5vw,3.5rem)]!">Les événements <span>toulousains</span></h1>
      <p class="mx-auto mt-5 text-base text-[#333] max-w-2xl">{{ pageDescription }}</p>
    </header>

    <!-- Onglets -->
    <div class="flex flex-wrap justify-center gap-2" role="group" aria-label="Filtrer les événements par période">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        type="button"
        class="btn-sm"
        :class="activeTab === tab.id ? 'btn-red' : 'btn-outline-red'"
        :aria-pressed="activeTab === tab.id"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Filtres communs -->
    <div class="mt-6 glass-card rounded-2xl p-5">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SearchInput
          v-model="search"
          label="Rechercher"
          placeholder="Tournoi, LAN, organisateur…"
          input-id="events-search"
        />
        <BaseSelect
          v-model="category"
          label="Catégorie"
          :options="categoryOptions"
          select-id="events-category"
        />
        <BaseDatePicker v-model="dateStart" label="Du" input-id="events-date-start" />
        <BaseDatePicker v-model="dateEnd" label="Au" input-id="events-date-end" />
      </div>

      <div
        class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-brand-card-border pt-4"
      >
        <p class="text-xs text-gray-500" role="status" aria-live="polite">
          {{
            activeTab === 'byCategory'
              ? `${baseFiltered.length} événement(s)`
              : `${currentList.length} événement(s) — page ${page} sur ${totalPages}`
          }}
        </p>
        <BaseButton variant="ghost" size="sm" :disabled="!hasActiveFilters" @click="resetFilters()">
          Réinitialiser
        </BaseButton>
      </div>
    </div>

    <!-- État vide -->
    <div
      v-if="currentList.length === 0 && activeTab !== 'byCategory'"
      class="mt-8 glass-card rounded-2xl p-10 text-center"
    >
      <div
        class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-red/10 text-4xl"
        aria-hidden="true"
      >
        🗓️
      </div>
      <h2 class="mt-5 font-bebas text-2xl text-white">Rien à l'horizon… pour l'instant</h2>
      <p class="mx-auto mt-2 max-w-md text-sm text-gray-400">{{ EMPTY_MESSAGES[activeTab] }}</p>
      <BaseButton
        v-if="hasActiveFilters"
        variant="outline"
        size="sm"
        class="mt-6"
        @click="resetFilters()"
      >
        Réinitialiser les filtres
      </BaseButton>
    </div>

    <!-- Onglets À venir / Passés -->
    <div v-else-if="activeTab !== 'byCategory'" class="mt-8">
      <h2 class="sr-only">
        {{ activeTab === 'past' ? 'Événements passés' : 'Événements à venir' }}
      </h2>
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <EventCard
          v-for="event in paginated"
          :key="event.id"
          :event="event"
          @open="openEventDetail(event)"
        />
      </div>
      <div class="mt-8">
        <Pagination v-model="page" :total-pages="totalPages" label="Pagination des événements" />
      </div>
    </div>

    <!-- Onglet Par catégorie -->
    <div v-else class="mt-8">
      <h2 class="sr-only">Événements par catégorie</h2>

      <div v-if="baseFiltered.length === 0" class="glass-card rounded-2xl p-10 text-center">
        <div
          class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-red/10 text-4xl"
          aria-hidden="true"
        >
          🏆
        </div>
        <h3 class="mt-5 font-bebas text-2xl text-white">Aucune catégorie à afficher</h3>
        <p class="mx-auto mt-2 max-w-md text-sm text-gray-400">
          {{ EMPTY_MESSAGES.byCategory }}
        </p>
        <BaseButton
          v-if="hasActiveFilters"
          variant="outline"
          size="sm"
          class="mt-6"
          @click="resetFilters()"
        >
          Réinitialiser les filtres
        </BaseButton>
      </div>

      <Accordion v-else :items="categoryItems" :default-open="[0]">
        <template #content="{ item }">
          <div class="grid gap-4 sm:grid-cols-2">
            <EventCard
              v-for="event in eventsByCategory[item.id ?? ''] ?? []"
              :key="event.id"
              :event="event"
              @open="openEventDetail(event)"
            />
          </div>
        </template>
      </Accordion>
    </div>
  </section>
</template>
