<script setup lang="ts">
/**
 * Page Actualités — mise en éditoriale : article à la une + grille 2 colonnes
 * (pagination 9 par page) et barre latérale (catégories, auteurs, archives
 * par mois, newsletter). Fiche d'article ouverte en modale + JSON-LD NewsArticle.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import NewsCard from '@/components/NewsCard.vue';
import NewsDetailModal from '@/components/NewsDetailModal.vue';
import CategoryFilter, { type CategoryOption } from '@/components/CategoryFilter.vue';
import Accordion, { type AccordionItem } from '@/components/ui/Accordion.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseInput from '@/components/ui/BaseInput.vue';
import BaseSelect, { type SelectOption } from '@/components/ui/BaseSelect.vue';
import Pagination from '@/components/Pagination.vue';
import RichText from '@/components/ui/RichText.vue';
import { useModal } from '@/composables/useModal';
import { useAppStore } from '@/stores/app';
import { useDataStore } from '@/stores/data';
import { content, pages } from '@/utils/content';
import { injectJsonLd, removeJsonLd } from '@/utils/seo';
import { parseIsoDate } from '@/utils/helpers';
import type { NewsItem } from '@/types';

/** Identifiant technique du bloc JSON-LD injecté (SEO). */
const JSON_LD_ID = 'tec-news-featured';
/** Actualités affichées par page (hors article à la une). */
const PAGE_SIZE = 9;

const dataStore = useDataStore();
const appStore = useAppStore();
const modal = useModal();

/** Textes de la page (`pages.news` de `content.json`). */
const texts = pages.news;

/* --------------------------------------------------------- état & filtres */
const selectedCategories = ref<string[]>([]);
const author = ref('');
const page = ref(1);

/** Options du filtre par catégories (avec compteurs). */
const categoryOptions = computed<CategoryOption[]>(() => {
  const counts = new Map<string, number>();
  dataStore.news.forEach((item) => {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  });
  return [...counts.entries()].map(([label, count]) => ({ id: label, label, count }));
});

/** Auteurs uniques (sélecteur de la barre latérale). */
const authorOptions = computed<SelectOption[]>(() => {
  const unique = [...new Set(dataStore.news.map((item) => item.author))].sort((a, b) =>
    a.localeCompare(b, 'fr')
  );
  return [
    { value: '', label: texts.sidebar.allAuthors },
    ...unique.map((name) => ({ value: name, label: name })),
  ];
});

/** Actualités filtrées (du plus récent au plus ancien). */
const filtered = computed<NewsItem[]>(() =>
  dataStore.sortedNews.filter((item) => {
    if (selectedCategories.value.length > 0 && !selectedCategories.value.includes(item.category)) {
      return false;
    }
    if (author.value && item.author !== author.value) return false;
    return true;
  })
);

/** Article à la une : premier des résultats (bascule `featured` si présente). */
const featured = computed<NewsItem | undefined>(() => {
  const flagged = filtered.value.find((item) => item.featured);
  return flagged ?? filtered.value[0];
});

/** Grille : résultats sans l'article à la une. */
const rest = computed<NewsItem[]>(() =>
  filtered.value.filter((item) => item.id !== featured.value?.id)
);

const totalPages = computed(() => Math.max(1, Math.ceil(rest.value.length / PAGE_SIZE)));

const paginated = computed<NewsItem[]>(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return rest.value.slice(start, start + PAGE_SIZE);
});

/* ------------------------------------------------------------- archives */
interface ArchiveEntry {
  id: string;
  title: string;
  items: NewsItem[];
}

/** Regroupe les actualités par mois de publication (décroissant). */
const archives = computed<ArchiveEntry[]>(() => {
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
  const groups = new Map<string, ArchiveEntry>();

  for (const item of dataStore.sortedNews) {
    const date = parseIsoDate(item.date);
    const key = item.date.slice(0, 7); // AAAA-MM
    const label = date ? formatter.format(date) : item.date;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, { id: key, title: label, items: [item] });
    }
  }
  return [...groups.values()];
});

const archiveItems = computed<AccordionItem[]>(() =>
  archives.value.map((archive) => ({ id: archive.id, title: archive.title }))
);

const archiveById = computed<Record<string, NewsItem[]>>(() =>
  Object.fromEntries(archives.value.map((archive) => [archive.id, archive.items]))
);

/* -------------------------------------------------------- synchronisations */
// Un changement de filtre revient à la première page.
watch([selectedCategories, author], () => {
  page.value = 1;
});

watch(totalPages, (total) => {
  if (page.value > total) page.value = total;
});

function resetFilters(): void {
  selectedCategories.value = [];
  author.value = '';
  page.value = 1;
}

/* -------------------------------------------------------------- newsletter */
const newsletterEmail = ref('');

function subscribe(): void {
  const email = newsletterEmail.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    appStore.showToast(texts.newsletter.invalidEmail, 'error');
    return;
  }
  // Stub : aucun envoi réseau, la saisie est simplement confirmée.
  newsletterEmail.value = '';
  appStore.showToast(texts.newsletter.success, 'success');
}

/* --------------------------------------------------------------- modales */
function openNewsDetail(news: NewsItem): void {
  modal.open(NewsDetailModal, { title: news.title, news, size: 'xl' });
}

/* ----------------------------------------------------------------- cycle */
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

  // Données structurées de l'article à la une (SEO).
  const lead = featured.value;
  if (lead) {
    injectJsonLd(JSON_LD_ID, {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: lead.title,
      description: lead.excerpt,
      datePublished: lead.date,
      dateModified: lead.date,
      articleSection: lead.category,
      author: { '@type': 'Person', name: lead.author },
      publisher: {
        '@type': 'Organization',
        name: content.site.name,
        url: window.location.origin,
      },
      mainEntityOfPage: window.location.href,
      image: lead.image ?? undefined,
    });
  }
});

onBeforeUnmount(() => {
  removeJsonLd(JSON_LD_ID);
});
</script>

<template>
  <section class="max-w-6xl mx-auto px-4 py-12 md:py-20">
    <header class="mb-10">
      <h1 class="font-bebas text-4xl md:text-5xl lg:text-6xl text-white">{{ texts.hero.title }}</h1>
      <p v-if="texts.hero.subtitle" class="mt-4 text-lg text-gray-400 max-w-2xl"><RichText :text="texts.hero.subtitle" /></p>
    </header>

    <div class="grid gap-8 lg:grid-cols-12">
      <!-- Colonne principale -->
      <div class="lg:col-span-8">
        <h2 class="sr-only">Toutes les actualités</h2>

        <!-- État vide -->
        <div v-if="filtered.length === 0" class="glass-card rounded-2xl p-10 text-center">
          <div
            class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-red/10 text-4xl"
            aria-hidden="true"
          >
            📰
          </div>
          <h3 class="mt-5 font-bebas text-2xl text-white">{{ texts.empty.title }}</h3>
          <p class="mx-auto mt-2 max-w-md text-sm text-gray-400">
            {{ texts.empty.text }}
          </p>
          <BaseButton variant="outline" size="sm" class="mt-6" @click="resetFilters()">
            {{ texts.empty.reset }}
          </BaseButton>
        </div>

        <template v-else>
          <!-- Article à la une (page 1 uniquement) -->
          <NewsCard
            v-if="page === 1 && featured"
            :news="featured"
            variant="featured"
            @open="openNewsDetail(featured)"
          />

          <!-- Grille 2 colonnes -->
          <div class="mt-6 grid gap-5 sm:grid-cols-2">
            <NewsCard
              v-for="(news, index) in paginated"
              :key="news.id"
              v-reveal="index"
              :news="news"
              variant="default"
              @open="openNewsDetail(news)"
            />
          </div>

          <div class="mt-8">
            <Pagination
              v-model="page"
              :total-pages="totalPages"
              label="Pagination des actualités"
            />
          </div>
        </template>
      </div>

      <!-- Barre latérale -->
      <aside class="lg:col-span-4 space-y-6" aria-label="Filtres et archives">
        <!-- Catégories -->
        <section class="glass-card rounded-2xl p-5" aria-labelledby="news-categories">
          <h2 id="news-categories" class="font-bebas text-xl text-white mb-3">{{ texts.sidebar.categoriesTitle }}</h2>
          <CategoryFilter
            v-model:selected="selectedCategories"
            :options="categoryOptions"
            legend="Filtrer par catégorie"
            :hide-legend="true"
          />
        </section>

        <!-- Auteurs -->
        <section class="glass-card rounded-2xl p-5" aria-labelledby="news-authors">
          <h2 id="news-authors" class="font-bebas text-xl text-white mb-3">{{ texts.sidebar.authorsTitle }}</h2>
          <BaseSelect
            v-model="author"
            :label="texts.sidebar.authorLabel"
            :options="authorOptions"
            select-id="news-author"
          />
        </section>

        <!-- Archives par mois -->
        <section class="glass-card rounded-2xl p-5" aria-labelledby="news-archives">
          <h2 id="news-archives" class="font-bebas text-xl text-white mb-3">{{ texts.sidebar.archivesTitle }}</h2>
          <Accordion v-if="archiveItems.length > 0" :items="archiveItems">
            <template #content="{ item }">
              <div class="space-y-1">
                <NewsCard
                  v-for="news in archiveById[item.id ?? ''] ?? []"
                  :key="news.id"
                  :news="news"
                  variant="compact"
                  @open="openNewsDetail(news)"
                />
              </div>
            </template>
          </Accordion>
          <p v-else class="text-sm text-gray-500">{{ texts.sidebar.archivesEmpty }}</p>
        </section>

        <!-- Newsletter (stub) -->
        <section class="glass-card rounded-2xl p-5" aria-labelledby="news-newsletter">
          <h2 id="news-newsletter" class="font-bebas text-xl text-white mb-2">{{ texts.newsletter.title }}</h2>
          <p class="text-sm text-gray-400 mb-4">
            {{ texts.newsletter.text }}
          </p>
          <form class="space-y-3" novalidate @submit.prevent="subscribe">
            <BaseInput
              v-model="newsletterEmail"
              type="email"
              :label="texts.newsletter.emailLabel"
              :placeholder="texts.newsletter.emailPlaceholder"
              autocomplete="email"
              input-id="newsletter-email"
            />
            <BaseButton type="submit" variant="primary" size="sm" class="w-full">
              {{ texts.newsletter.button }}
            </BaseButton>
          </form>
        </section>
      </aside>
    </div>
  </section>
</template>
