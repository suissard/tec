<script setup lang="ts">
/**
 * Tableau de bord : volumes de contenu, dernière modification des textes et
 * raccourcis vers les actions courantes.
 */
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { COLLECTIONS } from '@/editor/collections';
import { errorMessage, pb, sessionLabel } from '@/editor/pb';
import { routeNames } from '@/router';
import { contentState } from '@/utils/content';

type TabId = 'dashboard' | 'content' | 'associations' | 'events' | 'news' | 'media' | 'history';
const emit = defineEmits<{ go: [TabId] }>();

const router = useRouter();
const counts = reactive<Record<string, number | null>>({});
const lastUpdate = ref<{ date: string; by: string } | null>(null);
const error = ref('');

const editHref = router.resolve({ name: routeNames.Home, query: { edit: '' } }).href;

function formatDate(value: string): string {
  return new Date(value.replace(' ', 'T')).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

onMounted(async () => {
  try {
    await Promise.all([
      ...COLLECTIONS.map(async (collection) => {
        counts[collection.name] = (
          await pb.collection(collection.name).getList(1, 1, { fields: 'id' })
        ).totalItems;
      }),
      (async () => {
        counts.media = (await pb.collection('media').getList(1, 1, { fields: 'id' })).totalItems;
      })(),
      (async () => {
        if (!contentState.recordId) return;
        const record = await pb
          .collection('site_content')
          .getOne(contentState.recordId, { fields: 'updated,updatedBy' });
        lastUpdate.value = { date: String(record.updated), by: String(record.updatedBy || '—') };
      })(),
    ]);
  } catch (caught) {
    error.value = errorMessage(caught);
  }
});
</script>

<template>
  <div class="max-w-5xl">
    <h1 class="tec-admin-title">Bonjour {{ sessionLabel() }}</h1>
    <p class="mt-2 text-sm text-white/65">Gérez ici le contenu du site Toulouse Esport Connect.</p>

    <p v-if="error" class="tec-admin-errors mt-6">{{ error }}</p>

    <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <button
        v-for="collection in COLLECTIONS"
        :key="collection.name"
        type="button"
        class="tec-admin-card p-5 text-left transition hover:border-brand-red"
        @click="emit('go', collection.name)"
      >
        <span class="block font-bebas text-5xl leading-none">{{
          counts[collection.name] ?? '…'
        }}</span>
        <span class="mt-1 block text-sm text-white/70">{{ collection.label }}</span>
      </button>
      <button
        type="button"
        class="tec-admin-card p-5 text-left transition hover:border-brand-red"
        @click="emit('go', 'media')"
      >
        <span class="block font-bebas text-5xl leading-none">{{ counts.media ?? '…' }}</span>
        <span class="mt-1 block text-sm text-white/70">Médias</span>
      </button>
    </div>

    <div class="mt-8 grid gap-4 lg:grid-cols-2">
      <section class="tec-admin-card p-6">
        <h2 class="font-bebas text-2xl">Modifier les textes en direct</h2>
        <p class="mt-2 text-sm text-white/70">
          Ouvrez le site en mode édition : cliquez sur un texte encadré pour le modifier, puis «
          Enregistrer ». Les cartes d’associations, d’événements et d’actualités ont un bouton «
          Modifier ».
        </p>
        <div class="mt-4 flex flex-wrap gap-3">
          <a :href="editHref" target="_blank" rel="noopener" class="tec-admin-btn is-primary"
            >Éditer le site ↗</a
          >
          <button type="button" class="tec-admin-btn" @click="emit('go', 'content')">
            Tous les textes
          </button>
        </div>
        <p v-if="lastUpdate" class="mt-4 text-xs text-white/50">
          Dernière modification des textes : {{ formatDate(lastUpdate.date) }} par
          {{ lastUpdate.by }}
        </p>
      </section>

      <section class="tec-admin-card p-6">
        <h2 class="font-bebas text-2xl">Ajouter du contenu</h2>
        <div class="mt-4 flex flex-wrap gap-3">
          <button
            v-for="collection in COLLECTIONS"
            :key="collection.name"
            type="button"
            class="tec-admin-btn"
            @click="emit('go', collection.name)"
          >
            + {{ collection.singular.replace(/^une? /, '') }}
          </button>
          <button type="button" class="tec-admin-btn" @click="emit('go', 'media')">+ image</button>
        </div>
        <p class="mt-4 text-xs text-white/50">
          Les modifications sont visibles immédiatement sur le site (aucun redéploiement
          nécessaire).
        </p>
      </section>
    </div>
  </div>
</template>
