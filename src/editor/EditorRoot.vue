<script setup lang="ts">
/**
 * Mode édition du site (`?edit`) : barre d'outils, connexion, panneau des
 * textes, édition en place et fiches rapides (associations, événements,
 * actualités). Chargé à la demande par `App.vue`.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { getCollection } from '@/editor/collections';
import ContentNode from '@/editor/components/ContentNode.vue';
import LoginForm from '@/editor/components/LoginForm.vue';
import RecordForm from '@/editor/components/RecordForm.vue';
import { exitEditMode } from '@/editor/editMode';
import { editorFocus, focusFields } from '@/editor/focus';
import { createInlineEditor } from '@/editor/inline';
import { labelFor, labelForPath } from '@/editor/labels';
import {
  contentSession,
  discardContentSession,
  isContentDirty,
  prepareContentSession,
  saveContentSession,
} from '@/editor/contentSession';
import {
  canEdit,
  isPocketBaseEnabled,
  logout,
  POCKETBASE_URL,
  refreshSession,
  session,
  sessionLabel,
} from '@/editor/pb';
import { ADMIN_ROUTE_NAME } from '@/router';
import { useAppStore } from '@/stores/app';
import { useDataStore } from '@/stores/data';
import { content } from '@/utils/content';

import '@/editor/editor.css';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const dataStore = useDataStore();

const ready = ref(false);
const loggedIn = computed(() => Boolean(session.user) && canEdit());

/* ----------------------------------------------------------- état contenu */
const dirty = computed(() => ready.value && loggedIn.value && isContentDirty.value);
const saving = computed(() => contentSession.saving);
const errors = computed(() => contentSession.errors);
const warning = computed(() => contentSession.warning);

/* ------------------------------------------------------------------ panneau */
type Tab = 'page' | 'common' | 'data';
const panelOpen = ref(false);
const tab = ref<Tab>('page');
const navigating = ref(false);
const selection = ref<string[]>([]);

const pageKey = computed(() => route.meta.contentKey);
const pageLabel = computed(() => (pageKey.value ? labelFor(pageKey.value) : ''));

function openFields(paths: string[]): void {
  selection.value = paths;
  panelOpen.value = true;
  if (paths.every((path) => path.startsWith('pages.'))) tab.value = 'page';
  else tab.value = 'common';
  focusFields(paths);
}

watch(panelOpen, (open) => document.documentElement.classList.toggle('tec-panel-open', open));
watch(
  () => route.name,
  () => {
    selection.value = [];
    editorFocus.paths = [];
  }
);

/* ----------------------------------------------------------- fiche rapide */
const recordTarget = ref<{ collection: string; slug: string } | null>(null);
const recordCollection = computed(() =>
  recordTarget.value ? getCollection(recordTarget.value.collection) : undefined
);

function openRecord(collection: string, slug: string): void {
  recordTarget.value = { collection, slug };
}

async function onRecordChanged(message: string): Promise<void> {
  recordTarget.value = null;
  appStore.showToast(message, 'success');
  await dataStore.forceRefresh();
}

/* ------------------------------------------------------------ en place */
const inline = createInlineEditor({
  getPageKey: () => pageKey.value,
  isNavigating: () => navigating.value || !loggedIn.value,
  openFields,
  openRecord,
  onChange: () => undefined,
});

watch(
  () => [loggedIn.value, ready.value] as const,
  ([isLogged, isReady]) => {
    if (isLogged && isReady) inline.start();
    else inline.stop();
  }
);

// Les textes changent (panneau, annulation) → nouveau repérage des éléments.
watch(content, () => inline.rescan(), { deep: true });

/* --------------------------------------------------------------- actions */
async function save(): Promise<void> {
  const ok = await saveContentSession();
  if (ok) {
    inline.clearDirty();
    appStore.showToast('Modifications enregistrées et publiées.', 'success');
  } else if (contentSession.errors.length > 0) {
    panelOpen.value = true;
  }
}

function discard(): void {
  if (!dirty.value) return;
  if (!window.confirm('Annuler toutes les modifications non enregistrées ?')) return;
  discardContentSession();
  inline.clearDirty();
}

function quit(): void {
  if (
    dirty.value &&
    !window.confirm('Des modifications ne sont pas enregistrées. Quitter quand même ?')
  )
    return;
  if (dirty.value) discardContentSession();
  inline.stop();
  document.documentElement.classList.remove('tec-panel-open');
  exitEditMode();
  if ('edit' in route.query) {
    const query = { ...route.query };
    delete query.edit;
    void router.replace({ query });
  }
}

function signOut(): void {
  if (
    dirty.value &&
    !window.confirm('Des modifications ne sont pas enregistrées. Se déconnecter quand même ?')
  )
    return;
  if (dirty.value) discardContentSession();
  logout();
}

async function onLoggedIn(): Promise<void> {
  await prepareContentSession();
}

const adminHref = computed(() => router.resolve({ name: ADMIN_ROUTE_NAME }).href);

function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (!dirty.value) return;
  event.preventDefault();
}

function onShortcut(event: KeyboardEvent): void {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && loggedIn.value) {
    event.preventDefault();
    void save();
  }
}

onMounted(async () => {
  window.addEventListener('beforeunload', onBeforeUnload);
  window.addEventListener('keydown', onShortcut);
  if (isPocketBaseEnabled) {
    await refreshSession();
    if (loggedIn.value) await prepareContentSession();
  }
  ready.value = true;
});

onBeforeUnmount(() => {
  inline.stop();
  window.removeEventListener('beforeunload', onBeforeUnload);
  window.removeEventListener('keydown', onShortcut);
  document.documentElement.classList.remove('tec-panel-open');
});
</script>

<template>
  <div data-tec-editor class="tec-editor">
    <!-- Connexion -->
    <div
      v-if="ready && !loggedIn"
      class="fixed inset-0 z-[9995] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tec-editor-login-title"
    >
      <div class="tec-admin-card w-full max-w-sm p-6 shadow-2xl">
        <p class="font-rajdhani text-xs font-bold uppercase tracking-[0.3em] text-brand-red-light">
          Mode édition
        </p>
        <h2 id="tec-editor-login-title" class="mt-1 mb-5 font-bebas text-3xl text-white">
          Connexion éditeur
        </h2>
        <template v-if="isPocketBaseEnabled">
          <LoginForm @success="onLoggedIn" />
        </template>
        <p v-else class="text-sm text-white/75">
          L’édition en ligne nécessite PocketBase : définissez <code>VITE_POCKETBASE_URL</code> puis
          relancez le site (voir <code>docs/pocketbase.md</code>).
        </p>
        <button
          type="button"
          class="mt-4 w-full text-center text-xs text-white/60 underline hover:text-white"
          @click="quit"
        >
          Quitter le mode édition
        </button>
      </div>
    </div>

    <template v-if="ready && loggedIn">
      <!-- Barre d'outils -->
      <div class="tec-editor-bar" role="toolbar" aria-label="Mode édition">
        <span
          class="flex items-center gap-2 pr-1 text-xs font-semibold uppercase tracking-wider text-white/80"
        >
          <span
            class="h-2 w-2 rounded-full"
            :class="dirty ? 'bg-amber-400' : 'bg-emerald-400'"
            aria-hidden="true"
          />
          <span class="hidden sm:inline">{{ dirty ? 'Non enregistré' : 'À jour' }}</span>
        </span>

        <div class="tec-editor-switch" role="group" aria-label="Action au clic">
          <button type="button" :aria-pressed="!navigating" @click="navigating = false">
            Éditer
          </button>
          <button type="button" :aria-pressed="navigating" @click="navigating = true">
            Naviguer
          </button>
        </div>

        <button
          type="button"
          class="tec-admin-btn is-small"
          :aria-pressed="panelOpen"
          @click="panelOpen = !panelOpen"
        >
          Panneau
        </button>
        <button
          type="button"
          class="tec-admin-btn is-small"
          :disabled="!dirty || saving"
          @click="discard"
        >
          Annuler
        </button>
        <button
          type="button"
          class="tec-admin-btn is-primary is-small"
          :disabled="!dirty || saving"
          title="Ctrl+S"
          @click="save()"
        >
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
        <a
          :href="adminHref"
          class="tec-admin-btn is-small tec-editor-admin-link"
          target="_blank"
          rel="noopener"
          >Admin ↗</a
        >
        <button type="button" class="tec-admin-btn is-small" @click="quit">Quitter</button>
      </div>

      <!-- Panneau latéral -->
      <aside v-show="panelOpen" class="tec-editor-panel" aria-label="Panneau d’édition">
        <header class="flex items-start justify-between gap-3 border-b border-white/10 p-4">
          <div class="min-w-0">
            <p
              class="font-rajdhani text-[0.65rem] font-bold uppercase tracking-[0.3em] text-brand-red-light"
            >
              Mode édition
            </p>
            <p class="truncate text-sm text-white/80">{{ sessionLabel() }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button type="button" class="tec-admin-btn is-small" @click="signOut">
              Déconnexion
            </button>
            <button
              type="button"
              class="tec-admin-btn is-small"
              aria-label="Fermer le panneau"
              @click="panelOpen = false"
            >
              ✕
            </button>
          </div>
        </header>

        <nav class="flex border-b border-white/10 text-sm" aria-label="Sections">
          <button
            type="button"
            class="tec-editor-tab"
            :aria-pressed="tab === 'page'"
            @click="tab = 'page'"
          >
            Cette page
          </button>
          <button
            type="button"
            class="tec-editor-tab"
            :aria-pressed="tab === 'common'"
            @click="tab = 'common'"
          >
            Commun
          </button>
          <button
            type="button"
            class="tec-editor-tab"
            :aria-pressed="tab === 'data'"
            @click="tab = 'data'"
          >
            Données
          </button>
        </nav>

        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <p
            v-if="warning"
            class="rounded-md border border-amber-400/50 bg-amber-400/10 p-3 text-xs text-amber-100"
          >
            {{ warning }}
          </p>
          <div v-if="errors.length" class="tec-admin-errors" role="alert">
            <p class="mb-1 font-semibold">Enregistrement impossible :</p>
            <ul class="list-disc pl-4 space-y-0.5">
              <li v-for="line in errors" :key="line">{{ line }}</li>
            </ul>
          </div>

          <section
            v-if="selection.length"
            class="rounded-md border border-brand-red/50 bg-brand-red/5 p-3"
          >
            <div class="mb-2 flex items-center justify-between">
              <h3 class="text-xs font-bold uppercase tracking-wider text-brand-red-light">
                Texte sélectionné
              </h3>
              <button
                type="button"
                class="text-xs text-white/50 hover:text-white"
                @click="selection = []"
              >
                effacer
              </button>
            </div>
            <p v-if="selection.length > 1" class="mb-2 text-xs text-white/60">
              Ce texte apparaît à {{ selection.length }} endroits : modifiez celui qui convient.
            </p>
            <div class="space-y-3">
              <ContentNode
                v-for="path in selection"
                :key="path"
                :path="path"
                :depth="1"
                :label="labelForPath(path)"
              />
            </div>
          </section>

          <template v-if="tab === 'page'">
            <ContentNode
              v-if="pageKey"
              :key="pageKey"
              :path="`pages.${pageKey}`"
              :label="pageLabel"
            />
            <p v-else class="text-sm text-white/60">Cette page n’a pas de textes éditables.</p>
          </template>

          <template v-else-if="tab === 'common'">
            <ContentNode path="navigation" :depth="1" />
            <ContentNode path="layout" :depth="1" />
            <ContentNode path="site" :depth="1" />
          </template>

          <div v-else class="space-y-3 text-sm text-white/75">
            <p>
              Les <strong>associations</strong>, <strong>événements</strong> et
              <strong>actualités</strong> se modifient via le badge
              <span class="tec-record-badge static! inline-block">✎ Modifier</span> sur leurs
              cartes, ou dans l’administration :
            </p>
            <a :href="adminHref" target="_blank" rel="noopener" class="tec-admin-btn w-full"
              >Ouvrir l’administration ↗</a
            >
            <a
              v-if="POCKETBASE_URL"
              :href="`${POCKETBASE_URL}/_/`"
              target="_blank"
              rel="noopener"
              class="tec-admin-btn w-full"
            >
              Console PocketBase (superuser) ↗
            </a>
          </div>
        </div>

        <footer class="border-t border-white/10 p-3 text-[0.7rem] leading-relaxed text-white/50">
          Clic sur un texte encadré : modification directe (Entrée pour valider, Échap pour
          annuler). Alt + clic ou « Naviguer » : suivre les liens. Ctrl + S : enregistrer.
        </footer>
      </aside>

      <!-- Fiche rapide -->
      <div
        v-if="recordTarget && recordCollection"
        class="fixed inset-0 z-[9996] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:py-12"
        role="dialog"
        aria-modal="true"
        aria-label="Modifier la fiche"
        @click.self="recordTarget = null"
      >
        <div class="tec-admin-card w-full max-w-2xl p-6 shadow-2xl">
          <h2 class="mb-5 font-bebas text-3xl text-white">
            Modifier — {{ recordCollection.label }}
          </h2>
          <RecordForm
            :collection="recordCollection"
            :slug="recordTarget.slug"
            @saved="onRecordChanged('Fiche enregistrée.')"
            @deleted="onRecordChanged('Fiche supprimée.')"
            @cancel="recordTarget = null"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style>
html.tec-editing body {
  padding-bottom: 4.5rem;
}
@media (min-width: 1024px) {
  html.tec-panel-open body {
    margin-right: 26rem;
  }
}
.tec-editor {
  font-family: Inter, system-ui, sans-serif;
  color: #fff;
}
.tec-editor-bar {
  position: fixed;
  left: 50%;
  bottom: 1rem;
  z-index: 9992;
  display: flex;
  max-width: calc(100vw - 1rem);
  transform: translateX(-50%);
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 10px;
  border: 1px solid rgb(255 255 255 / 0.12);
  background: rgb(20 20 25 / 0.94);
  padding: 0.45rem 0.6rem;
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.45);
  backdrop-filter: blur(10px);
}
/* Mobile : barre pleine largeur, compacte (le lien Admin est dans le panneau). */
@media (max-width: 639px) {
  .tec-editor-bar {
    left: 0.5rem;
    right: 0.5rem;
    bottom: 0.5rem;
    max-width: none;
    transform: none;
    gap: 0.3rem;
  }
  .tec-editor-bar .tec-editor-admin-link {
    display: none;
  }
}
@media (min-width: 1024px) {
  html.tec-panel-open .tec-editor-bar {
    left: calc((100vw - 26rem) / 2);
  }
}
.tec-editor-switch {
  display: inline-flex;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid rgb(255 255 255 / 0.18);
}
.tec-editor-switch button {
  padding: 0.3rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(255 255 255 / 0.7);
  cursor: pointer;
}
.tec-editor-switch button[aria-pressed='true'] {
  background: var(--color-brand-red, #e30613);
  color: #fff;
}
.tec-editor-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 9991;
  display: flex;
  width: min(26rem, 100vw);
  flex-direction: column;
  border-left: 1px solid rgb(255 255 255 / 0.1);
  background: #111116;
  box-shadow: -12px 0 30px rgb(0 0 0 / 0.35);
}
/* Petits écrans : le panneau recouvre la page, la barre reste accessible dessous. */
@media (max-width: 1023px) {
  .tec-editor-panel {
    padding-bottom: 6.5rem;
  }
}
.tec-editor-tab {
  flex: 1;
  padding: 0.6rem 0.5rem;
  font-weight: 600;
  color: rgb(255 255 255 / 0.6);
  border-bottom: 2px solid transparent;
  cursor: pointer;
}
.tec-editor-tab[aria-pressed='true'] {
  color: #fff;
  border-bottom-color: var(--color-brand-red, #e30613);
}
</style>
