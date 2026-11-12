<script setup lang="ts">
/**
 * Liste filtrable d'une collection (associations, événements, actualités)
 * avec création / modification / suppression via `RecordForm`.
 */
import type { RecordModel } from 'pocketbase';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { CollectionDef } from '@/editor/collections';
import RecordForm from '@/editor/components/RecordForm.vue';
import { errorMessage, pb } from '@/editor/pb';
import { routeNames } from '@/router';
import { useAppStore } from '@/stores/app';
import { useDataStore } from '@/stores/data';
import { publicUrl } from '@/utils/paths';

const props = defineProps<{ collection: CollectionDef }>();

const router = useRouter();
const appStore = useAppStore();
const dataStore = useDataStore();

const records = ref<RecordModel[]>([]);
const loading = ref(true);
const error = ref('');
const search = ref('');
/** `null` = formulaire fermé, `''` = création, sinon id de l'enregistrement */
const editing = ref<string | null>(null);

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const filtered = computed(() => {
  const terms = normalize(search.value).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return records.value;
  return records.value.filter((record) => {
    const haystack = normalize(
      props.collection.searchFields.map((field) => String(record[field] ?? '')).join(' ')
    );
    return terms.every((term) => haystack.includes(term));
  });
});

const imageField = computed(() => props.collection.fields.find((field) => field.type === 'image'));

function thumbnail(record: RecordModel): string {
  const field = imageField.value;
  if (!field) return '';
  const file = field.fileField ? record[field.fileField] : '';
  if (typeof file === 'string' && file) return pb.files.getURL(record, file, { thumb: '400x0' });
  const path = record[field.name];
  return typeof path === 'string' && path ? publicUrl(path) : '';
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    records.value = await pb
      .collection(props.collection.name)
      .getFullList({ sort: props.collection.sort });
  } catch (caught) {
    error.value = errorMessage(caught);
  } finally {
    loading.value = false;
  }
}

async function onSaved(record: RecordModel): Promise<void> {
  appStore.showToast(
    `« ${String(record[props.collection.titleField] ?? '')} » enregistré.`,
    'success'
  );
  editing.value = null;
  await Promise.all([load(), dataStore.forceRefresh()]);
}

async function onDeleted(): Promise<void> {
  appStore.showToast('Élément supprimé.', 'success');
  editing.value = null;
  await Promise.all([load(), dataStore.forceRefresh()]);
}

const PAGE_BY_COLLECTION = {
  associations: routeNames.Associations,
  events: routeNames.Events,
  news: routeNames.News,
} as const;

/** Page publique listant la collection, ouverte en mode édition. */
const siteHref = computed(
  () =>
    router.resolve({ name: PAGE_BY_COLLECTION[props.collection.name], query: { edit: '' } }).href
);

onMounted(load);
</script>

<template>
  <div class="max-w-5xl">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="tec-admin-title">{{ collection.label }}</h1>
        <p class="mt-1 text-sm text-white/60">{{ records.length }} élément(s)</p>
      </div>
      <button type="button" class="tec-admin-btn is-primary" @click="editing = ''">
        + Ajouter {{ collection.singular }}
      </button>
    </div>

    <input
      v-model="search"
      type="search"
      class="tec-admin-input mt-6"
      :placeholder="`Rechercher dans les ${collection.label.toLowerCase()}…`"
      aria-label="Rechercher"
    />

    <p v-if="error" class="tec-admin-errors mt-4">{{ error }}</p>
    <p v-else-if="loading" class="mt-6 text-sm text-white/60">Chargement…</p>

    <ul v-else class="mt-4 divide-y divide-white/5 tec-admin-card">
      <li v-for="record in filtered" :key="record.id">
        <button
          type="button"
          class="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-white/5"
          @click="editing = record.id"
        >
          <span
            v-if="imageField"
            class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded bg-white/5"
          >
            <img
              v-if="thumbnail(record)"
              :src="thumbnail(record)"
              alt=""
              class="max-h-full max-w-full object-contain"
            />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-semibold">{{ record[collection.titleField] }}</span>
            <span class="block truncate text-xs text-white/50">
              <template v-for="(column, index) in collection.columns" :key="column">
                <template v-if="record[column]"
                  >{{ index > 0 ? ' · ' : '' }}{{ record[column] }}</template
                >
              </template>
              <span class="font-mono"> · {{ record.slug }}</span>
            </span>
          </span>
          <span
            v-if="record.featured"
            class="rounded bg-brand-red/20 px-2 py-0.5 text-xs text-brand-red-light"
            >À la une</span
          >
          <span class="text-xs text-white/40" aria-hidden="true">Modifier →</span>
        </button>
      </li>
      <li v-if="filtered.length === 0" class="px-4 py-6 text-center text-sm text-white/50">
        Aucun résultat.
      </li>
    </ul>

    <!-- Formulaire -->
    <div
      v-if="editing !== null"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:py-12"
      role="dialog"
      aria-modal="true"
      :aria-label="editing ? 'Modifier' : 'Ajouter'"
      @click.self="editing = null"
      @keydown.esc="editing = null"
    >
      <div class="tec-admin-card w-full max-w-3xl p-6 shadow-2xl">
        <div class="mb-5 flex items-start justify-between gap-4">
          <h2 class="font-bebas text-3xl">
            {{ editing ? 'Modifier' : `Ajouter ${collection.singular}` }}
          </h2>
          <a
            :href="siteHref"
            target="_blank"
            rel="noopener"
            class="text-xs text-white/50 underline hover:text-white"
          >
            Voir la page du site ↗
          </a>
        </div>
        <RecordForm
          :collection="collection"
          :record-id="editing || undefined"
          @saved="onSaved"
          @deleted="onDeleted"
          @cancel="editing = null"
        />
      </div>
    </div>
  </div>
</template>
