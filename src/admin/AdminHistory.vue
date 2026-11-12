<script setup lang="ts">
/**
 * Historique des textes : chaque enregistrement conserve la version
 * précédente (50 dernières). « Restaurer » charge une version dans l'éditeur ;
 * elle n'est publiée qu'après « Enregistrer ».
 */
import type { RecordModel } from 'pocketbase';
import { onMounted, ref } from 'vue';

import { isContentDirty } from '@/editor/contentSession';
import { errorMessage, pb } from '@/editor/pb';
import { useAppStore } from '@/stores/app';
import { bundledContent, mergeWithDefaults, replaceContent } from '@/utils/content';

const emit = defineEmits<{ restored: [] }>();
const appStore = useAppStore();

const revisions = ref<RecordModel[]>([]);
const loading = ref(true);
const error = ref('');

function formatDate(value: string): string {
  return new Date(value.replace(' ', 'T')).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

async function load(): Promise<void> {
  loading.value = true;
  try {
    revisions.value = await pb.collection('content_revisions').getFullList({
      sort: '-created',
      fields: 'id,created,author',
    });
  } catch (caught) {
    error.value = errorMessage(caught);
  } finally {
    loading.value = false;
  }
}

async function restore(revision: RecordModel): Promise<void> {
  if (
    isContentDirty.value &&
    !window.confirm('Des modifications non enregistrées seront remplacées. Continuer ?')
  )
    return;
  try {
    const full = await pb.collection('content_revisions').getOne(revision.id);
    replaceContent(mergeWithDefaults(bundledContent, full.data));
    appStore.showToast('Version chargée : vérifiez puis « Enregistrer » pour la publier.', 'info');
    emit('restored');
  } catch (caught) {
    error.value = errorMessage(caught);
  }
}

onMounted(load);
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="tec-admin-title">Historique des textes</h1>
    <p class="mt-1 text-sm text-white/60">
      Versions précédant chaque enregistrement (50 dernières). Une version restaurée n’est publiée
      qu’après « Enregistrer ».
    </p>

    <p v-if="error" class="tec-admin-errors mt-4">{{ error }}</p>
    <p v-else-if="loading" class="mt-6 text-sm text-white/60">Chargement…</p>
    <p v-else-if="revisions.length === 0" class="mt-6 text-sm text-white/60">
      Aucune version précédente pour l’instant.
    </p>

    <ul v-else class="tec-admin-card mt-6 divide-y divide-white/5">
      <li
        v-for="revision in revisions"
        :key="revision.id"
        class="flex items-center gap-4 px-4 py-3"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold">Version de {{ revision.author || '—' }}</p>
          <p class="truncate text-xs text-white/50">
            Remplacée le {{ formatDate(String(revision.created)) }}
          </p>
        </div>
        <button type="button" class="tec-admin-btn is-small" @click="restore(revision)">
          Restaurer
        </button>
      </li>
    </ul>
  </div>
</template>
