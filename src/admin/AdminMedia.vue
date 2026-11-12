<script setup lang="ts">
/**
 * Médiathèque : téléversement d'images (ou PDF), copie de l'URL à coller dans
 * un champ du site, suppression.
 */
import type { RecordModel } from 'pocketbase';
import { onMounted, ref } from 'vue';

import { errorMessage, pb } from '@/editor/pb';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();

const items = ref<RecordModel[]>([]);
const loading = ref(true);
const uploading = ref(false);
const error = ref('');

function url(record: RecordModel, thumb?: string): string {
  return pb.files.getURL(record, String(record.file), thumb ? { thumb } : {});
}

function isImage(record: RecordModel): boolean {
  return !String(record.file).toLowerCase().endsWith('.pdf');
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    items.value = await pb.collection('media').getFullList({ sort: '-created' });
  } catch (caught) {
    error.value = errorMessage(caught);
  } finally {
    loading.value = false;
  }
}

async function upload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  if (files.length === 0) return;
  uploading.value = true;
  error.value = '';
  try {
    for (const file of files) {
      const form = new FormData();
      form.append('file', file);
      form.append('title', file.name);
      await pb.collection('media').create(form);
    }
    appStore.showToast(`${files.length} fichier(s) ajouté(s).`, 'success');
    await load();
  } catch (caught) {
    error.value = errorMessage(caught);
  } finally {
    uploading.value = false;
    input.value = '';
  }
}

async function copy(record: RecordModel): Promise<void> {
  try {
    await navigator.clipboard.writeText(url(record));
    appStore.showToast('Adresse copiée : collez-la dans un champ image.', 'success');
  } catch {
    window.prompt('Copiez cette adresse :', url(record));
  }
}

async function remove(record: RecordModel): Promise<void> {
  if (
    !window.confirm(
      `Supprimer définitivement « ${String(record.title || record.file)} » ? Les pages qui l’utilisent afficheront une image manquante.`
    )
  )
    return;
  try {
    await pb.collection('media').delete(record.id);
    items.value = items.value.filter((item) => item.id !== record.id);
  } catch (caught) {
    error.value = errorMessage(caught);
  }
}

onMounted(load);
</script>

<template>
  <div class="max-w-5xl">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="tec-admin-title">Médiathèque</h1>
        <p class="mt-1 text-sm text-white/60">
          Images (10 Mo max) et PDF utilisables dans les textes du site.
        </p>
      </div>
      <label class="tec-admin-btn is-primary cursor-pointer">
        {{ uploading ? 'Envoi…' : '+ Ajouter des fichiers' }}
        <input
          type="file"
          accept="image/*,application/pdf"
          multiple
          class="sr-only"
          :disabled="uploading"
          @change="upload"
        />
      </label>
    </div>

    <p v-if="error" class="tec-admin-errors mt-4">{{ error }}</p>
    <p v-if="loading" class="mt-6 text-sm text-white/60">Chargement…</p>
    <p v-else-if="items.length === 0" class="mt-6 text-sm text-white/60">
      Aucun fichier pour l’instant.
    </p>

    <ul class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <li v-for="item in items" :key="item.id" class="tec-admin-card overflow-hidden">
        <a
          :href="url(item)"
          target="_blank"
          rel="noopener"
          class="flex aspect-square items-center justify-center bg-white/5"
        >
          <img
            v-if="isImage(item)"
            :src="url(item, '400x0')"
            :alt="String(item.title)"
            class="max-h-full max-w-full object-contain"
            loading="lazy"
          />
          <span v-else class="font-bebas text-3xl text-white/60">PDF</span>
        </a>
        <div class="space-y-2 p-3">
          <p class="truncate text-xs text-white/70" :title="String(item.title)">
            {{ item.title || item.file }}
          </p>
          <div class="flex gap-2">
            <button type="button" class="tec-admin-btn is-small flex-1" @click="copy(item)">
              Copier l’URL
            </button>
            <button
              type="button"
              class="tec-admin-btn is-small is-danger"
              aria-label="Supprimer"
              @click="remove(item)"
            >
              ✕
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
