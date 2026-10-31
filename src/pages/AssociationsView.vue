<script setup lang="ts">
/**
 * Page Associations — annuaire filtrable du réseau :
 * recherche textuelle, filtres jeux / villes (sélection multiple),
 * pagination (12 par page) et fiche détaillée en modale.
 * Les filtres actifs sont synchronisés avec l'URL (débouncés).
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AssociationCard from '@/components/AssociationCard.vue';
import AssociationDetailModal from '@/components/AssociationDetailModal.vue';
import CategoryFilter, { type CategoryOption } from '@/components/CategoryFilter.vue';
import Pagination from '@/components/Pagination.vue';
import SearchInput from '@/components/SearchInput.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import RichText from '@/components/ui/RichText.vue';
import { useModal } from '@/composables/useModal';
import { useAppStore } from '@/stores/app';
import { useDataStore } from '@/stores/data';
import type { Association } from '@/types';
import { pages } from '@/utils/content';

/** Nombre d'associations affichées par page. */
const PAGE_SIZE = 12;
/** Délai de synchronisation des filtres vers l'URL (ms). */
const URL_DEBOUNCE_MS = 300;

const dataStore = useDataStore();
const appStore = useAppStore();
const modal = useModal();
const route = useRoute();
const router = useRouter();

/** Textes de la page (`pages.associations` de `content.json`). */
const texts = pages.associations;

/* --------------------------------------------------------- état & filtres */
const query = ref('');
const selectedGames = ref<string[]>([]);
const selectedCities = ref<string[]>([]);
const page = ref(1);

/** Découpe la chaîne CSV « jeux » d'une association en tags nettoyés. */
function parseGames(games?: string): string[] {
  return (games ?? '')
    .split(',')
    .map((game) => game.trim())
    .filter(Boolean);
}

/** Lisibilité : évite les `typeof unknown` répétés dans les computeds. */
function toStringList(value: unknown): string[] {
  return typeof value === 'string' && value.trim() !== ''
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

/** Jeux uniques de tout l'annuaire (tri alphabétique FR). */
const allGames = computed<string[]>(() => {
  const unique = new Set<string>();
  dataStore.associations.forEach((association) => {
    parseGames(association.games).forEach((game) => unique.add(game));
  });
  return [...unique].sort((a, b) => a.localeCompare(b, 'fr'));
});

/** Villes uniques déclarées par les associations (masqué si aucune). */
const allCities = computed<string[]>(() => {
  const unique = new Set<string>();
  dataStore.associations.forEach((association) => {
    const city = association.city?.trim();
    if (city) unique.add(city);
  });
  return [...unique].sort((a, b) => a.localeCompare(b, 'fr'));
});

/** Options du filtre « jeux » avec le nombre d'associations correspondantes. */
const gameOptions = computed<CategoryOption[]>(() =>
  allGames.value.map((game) => ({
    id: game,
    label: game,
    count: dataStore.associations.filter((association) =>
      parseGames(association.games).includes(game)
    ).length,
  }))
);

/** Options du filtre « villes » avec le nombre d'associations correspondantes. */
const cityOptions = computed<CategoryOption[]>(() =>
  allCities.value.map((city) => ({
    id: city,
    label: city,
    count: dataStore.associations.filter((association) => association.city === city).length,
  }))
);

/** Liste filtrée : recherche textuelle puis filtres jeux / villes. */
const filtered = computed<Association[]>(() =>
  dataStore.searchAssociations(query.value).filter((association) => {
    const games = parseGames(association.games);
    const matchesGame =
      selectedGames.value.length === 0 || selectedGames.value.some((game) => games.includes(game));
    const matchesCity =
      selectedCities.value.length === 0 ||
      (association.city !== undefined &&
        association.city.trim() !== '' &&
        selectedCities.value.includes(association.city));
    return matchesGame && matchesCity;
  })
);

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)));

/** Page courante (12 éléments). */
const paginated = computed<Association[]>(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return filtered.value.slice(start, start + PAGE_SIZE);
});

const hasActiveFilters = computed(
  () => query.value !== '' || selectedGames.value.length > 0 || selectedCities.value.length > 0
);

/* ------------------------------------------------------------ URL ↔ état */
/** Reconstruit l'objet query à partir des filtres courants. */
function buildQuery(): Record<string, string> {
  const next: Record<string, string> = {};
  if (query.value) next.q = query.value;
  if (selectedGames.value.length > 0) next.games = selectedGames.value.join(',');
  if (selectedCities.value.length > 0) next.cities = selectedCities.value.join(',');
  return next;
}

/** Restitue les filtres depuis l'URL au montage (partage de lien). */
function readQueryFromUrl(): void {
  query.value = typeof route.query.q === 'string' ? route.query.q : '';
  selectedGames.value = toStringList(route.query.games);
  selectedCities.value = toStringList(route.query.cities);
}

let urlTimer: ReturnType<typeof setTimeout> | undefined;

// Tout changement de filtre remet à la page 1 et met à jour l'URL (debounce).
watch([query, selectedGames, selectedCities], () => {
  page.value = 1;
  if (urlTimer !== undefined) clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    urlTimer = undefined;
    void router.replace({ query: buildQuery() });
  }, URL_DEBOUNCE_MS);
});

// Le nombre de pages peut se réduire après filtrage : on borne la page courante.
watch(totalPages, (total) => {
  if (page.value > total) page.value = total;
});

onBeforeUnmount(() => {
  if (urlTimer !== undefined) clearTimeout(urlTimer);
});

/** Réinitialise tous les filtres (et l'URL). */
function resetFilters(): void {
  query.value = '';
  selectedGames.value = [];
  selectedCities.value = [];
  page.value = 1;
}

/* --------------------------------------------------------------- modales */
function openAssociationDetail(association: Association): void {
  modal.open(AssociationDetailModal, { title: association.name, association, size: 'xl' });
}

/* --------------------------------------------------------------- cycle */
onMounted(async () => {
  readQueryFromUrl();

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
    <header class="mb-10">
      <h1 class="font-bebas text-4xl md:text-5xl lg:text-6xl text-white">{{ texts.hero.title }}</h1>
      <p v-if="texts.hero.subtitle" class="mt-4 text-lg text-gray-400 max-w-2xl"><RichText :text="texts.hero.subtitle" /></p>
    </header>

    <div class="grid gap-8 lg:grid-cols-12">
      <!-- Filtres (collants sur grand écran) -->
      <aside
        class="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 self-start"
        aria-label="Filtres de l'annuaire"
      >
        <div class="glass-card rounded-2xl p-5 space-y-6">
          <SearchInput
            v-model="query"
            :label="texts.filters.searchLabel"
            :placeholder="texts.filters.searchPlaceholder"
            input-id="associations-search"
          />

          <div>
            <p class="text-xs font-medium text-gray-300 mb-2">{{ texts.filters.gamesTitle }}</p>
            <CategoryFilter
              v-model:selected="selectedGames"
              :options="gameOptions"
              legend="Filtrer par jeu"
            />
            <p v-if="gameOptions.length === 0" class="text-xs text-gray-500">
              {{ texts.filters.gamesEmpty }}
            </p>
          </div>

          <div v-if="allCities.length > 0">
            <p class="text-xs font-medium text-gray-300 mb-2">{{ texts.filters.citiesTitle }}</p>
            <CategoryFilter
              v-model:selected="selectedCities"
              :options="cityOptions"
              legend="Filtrer par ville"
            />
          </div>

          <div
            class="flex items-center justify-between gap-3 border-t border-brand-card-border pt-4"
          >
            <p class="text-xs text-gray-500" role="status" aria-live="polite">
              {{ filtered.length }} résultat{{ filtered.length > 1 ? 's' : '' }}
            </p>
            <BaseButton
              variant="ghost"
              size="sm"
              :disabled="!hasActiveFilters"
              @click="resetFilters()"
            >
              {{ texts.filters.reset }}
            </BaseButton>
          </div>
        </div>
      </aside>

      <!-- Grille des associations -->
      <div class="lg:col-span-8 xl:col-span-9">
        <h2 class="sr-only">Résultats de l'annuaire</h2>
        <!-- État vide : aucun résultat -->
        <div v-if="filtered.length === 0" class="glass-card rounded-2xl p-10 text-center">
          <div
            class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-red/10 text-4xl"
            aria-hidden="true"
          >
            🔍
          </div>
          <h2 class="mt-5 font-bebas text-2xl text-white">{{ texts.empty.title }}</h2>
          <p class="mx-auto mt-2 max-w-md text-sm text-gray-400">
            {{ hasActiveFilters ? texts.empty.textWithFilters : texts.empty.text }}
          </p>
          <BaseButton
            v-if="hasActiveFilters"
            variant="outline"
            size="sm"
            class="mt-6"
            @click="resetFilters()"
          >
            {{ texts.empty.reset }}
          </BaseButton>
        </div>

        <template v-else>
          <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AssociationCard
              v-for="(association, index) in paginated"
              :key="association.id"
              v-reveal="index"
              :association="association"
              @open="openAssociationDetail(association)"
            />
          </div>

          <div class="mt-8">
            <Pagination
              v-model="page"
              :total-pages="totalPages"
              label="Pagination des associations"
            />
          </div>
        </template>
      </div>
    </div>
  </section>
</template>
