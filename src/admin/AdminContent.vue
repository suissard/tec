<script setup lang="ts">
/**
 * Textes du site : formulaire complet (toutes les pages + parties communes)
 * ou édition JSON brute pour les utilisateurs avancés. L'enregistrement est
 * validé par le schéma de contenu avant d'être envoyé à PocketBase.
 */
import { computed, ref } from 'vue';

import ContentNode from '@/editor/components/ContentNode.vue';
import {
  contentSession,
  discardContentSession,
  isContentDirty,
  saveContentSession,
} from '@/editor/contentSession';
import { labelFor } from '@/editor/labels';
import { useAppStore } from '@/stores/app';
import { content, replaceContent, snapshotContent } from '@/utils/content';
import type { SiteContent } from '@/utils/contentSchema';

const appStore = useAppStore();

const mode = ref<'form' | 'json'>('form');
const section = ref<string>('pages.home');

/** Sections affichées dans le sélecteur. */
const SECTIONS = computed(() => [
  ...Object.keys(content.pages).map((key) => ({
    path: `pages.${key}`,
    label: `Page · ${labelFor(key)}`,
  })),
  { path: 'navigation', label: 'Menu' },
  { path: 'layout', label: 'Bandeau, adhésion, pied de page, cookies' },
  { path: 'site', label: 'Site (nom, réseaux sociaux)' },
]);

const currentLabel = computed(
  () => SECTIONS.value.find((item) => item.path === section.value)?.label ?? ''
);

/* ------------------------------------------------------------------ JSON */
const jsonText = ref('');
const jsonErrors = ref<string[]>([]);

function openJson(): void {
  jsonText.value = JSON.stringify(snapshotContent(), null, 2);
  jsonErrors.value = [];
  mode.value = 'json';
}

async function applyJson(): Promise<boolean> {
  jsonErrors.value = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText.value);
  } catch (error) {
    jsonErrors.value = [
      `JSON invalide : ${error instanceof Error ? error.message : String(error)}`,
    ];
    return false;
  }
  const { validateContent } = await import('@/utils/contentSchema');
  const errors = validateContent(parsed);
  if (errors.length > 0) {
    jsonErrors.value = errors;
    return false;
  }
  replaceContent(parsed as SiteContent);
  return true;
}

/* --------------------------------------------------------------- actions */
async function save(): Promise<void> {
  if (mode.value === 'json' && !(await applyJson())) return;
  if (await saveContentSession()) appStore.showToast('Textes enregistrés et publiés.', 'success');
}

function discard(): void {
  if (!window.confirm('Annuler toutes les modifications non enregistrées ?')) return;
  discardContentSession();
  if (mode.value === 'json') openJson();
}

function download(): void {
  const blob = new Blob([`${JSON.stringify(snapshotContent(), null, 2)}\n`], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'content.json';
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="max-w-4xl">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="tec-admin-title">Textes du site</h1>
        <p class="mt-1 text-sm text-white/60">
          Astuce : le mode édition du site permet de cliquer directement sur un texte.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="tec-admin-btn"
          :disabled="!isContentDirty || contentSession.saving"
          @click="discard"
        >
          Annuler
        </button>
        <button
          type="button"
          class="tec-admin-btn is-primary"
          :disabled="(!isContentDirty && mode === 'form') || contentSession.saving"
          @click="save"
        >
          {{ contentSession.saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </div>

    <p
      v-if="contentSession.warning"
      class="mt-4 rounded-md border border-amber-400/50 bg-amber-400/10 p-3 text-sm text-amber-100"
    >
      {{ contentSession.warning }}
    </p>
    <div
      v-if="contentSession.errors.length || jsonErrors.length"
      class="tec-admin-errors mt-4"
      role="alert"
    >
      <p class="mb-1 font-semibold">Corrigez ces points avant d’enregistrer :</p>
      <ul class="list-disc space-y-0.5 pl-4">
        <li v-for="line in [...jsonErrors, ...contentSession.errors]" :key="line">{{ line }}</li>
      </ul>
    </div>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <div
        class="tec-editor-switch inline-flex overflow-hidden rounded-md border border-white/20"
        role="group"
        aria-label="Mode"
      >
        <button
          type="button"
          class="tec-admin-seg"
          :aria-pressed="mode === 'form'"
          @click="mode = 'form'"
        >
          Formulaire
        </button>
        <button
          type="button"
          class="tec-admin-seg"
          :aria-pressed="mode === 'json'"
          @click="openJson"
        >
          JSON (avancé)
        </button>
      </div>
      <select
        v-if="mode === 'form'"
        v-model="section"
        class="tec-admin-input w-auto! min-w-64"
        aria-label="Section"
      >
        <option v-for="item in SECTIONS" :key="item.path" :value="item.path">
          {{ item.label }}
        </option>
      </select>
      <button type="button" class="tec-admin-btn is-small ml-auto" @click="download">
        Télécharger content.json
      </button>
    </div>

    <section v-if="mode === 'form'" class="tec-admin-card mt-4 p-5">
      <ContentNode :key="section" :path="section" :label="currentLabel" />
    </section>

    <section v-else class="mt-4">
      <textarea
        v-model="jsonText"
        class="tec-admin-input min-h-[60vh] font-mono text-xs leading-relaxed"
        spellcheck="false"
        aria-label="Contenu JSON"
      />
      <div class="mt-3 flex gap-2">
        <button type="button" class="tec-admin-btn" @click="applyJson">
          Vérifier et prévisualiser
        </button>
        <p class="self-center text-xs text-white/50">
          « Enregistrer » applique puis publie ce JSON.
        </p>
      </div>
    </section>
  </div>
</template>

<style>
.tec-admin-seg {
  padding: 0.45rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgb(255 255 255 / 0.7);
  cursor: pointer;
}
.tec-admin-seg[aria-pressed='true'] {
  background: var(--color-brand-red, #e30613);
  color: #fff;
}
</style>
