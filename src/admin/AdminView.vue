<script setup lang="ts">
/**
 * Administration du site (`/admin`) : connexion éditeur puis gestion des
 * textes, associations, événements, actualités, médias et historique.
 * Les onglets sont reflétés dans l'URL (`/admin?tab=events`).
 */
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AdminCollection from '@/admin/AdminCollection.vue';
import AdminContent from '@/admin/AdminContent.vue';
import AdminDashboard from '@/admin/AdminDashboard.vue';
import AdminHistory from '@/admin/AdminHistory.vue';
import AdminMedia from '@/admin/AdminMedia.vue';
import { COLLECTIONS } from '@/editor/collections';
import LoginForm from '@/editor/components/LoginForm.vue';
import { isContentDirty, prepareContentSession } from '@/editor/contentSession';
import {
  canEdit,
  isPocketBaseEnabled,
  logout,
  POCKETBASE_URL,
  refreshSession,
  session,
  sessionLabel,
} from '@/editor/pb';
import { routeNames } from '@/router';
import { publicUrl } from '@/utils/paths';

import '@/editor/editor.css';

type TabId = 'dashboard' | 'content' | 'associations' | 'events' | 'news' | 'media' | 'history';

const TABS: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'content', label: 'Textes du site' },
  ...COLLECTIONS.map((collection) => ({ id: collection.name as TabId, label: collection.label })),
  { id: 'media', label: 'Médiathèque' },
  { id: 'history', label: 'Historique des textes' },
];

const route = useRoute();
const router = useRouter();

const ready = ref(false);
const menuOpen = ref(false);
const loggedIn = computed(() => Boolean(session.user) && canEdit());

const tab = computed<TabId>(() => {
  const wanted = String(route.query.tab ?? 'dashboard');
  return (TABS.find((item) => item.id === wanted)?.id ?? 'dashboard') as TabId;
});
const currentCollection = computed(() =>
  COLLECTIONS.find((collection) => collection.name === tab.value)
);

function go(id: TabId): void {
  menuOpen.value = false;
  void router.replace({ query: id === 'dashboard' ? {} : { tab: id } });
}

const siteHref = computed(() => router.resolve({ name: routeNames.Home }).href);
const editHref = computed(
  () => router.resolve({ name: routeNames.Home, query: { edit: '' } }).href
);

async function onLoggedIn(): Promise<void> {
  await prepareContentSession();
}

function signOut(): void {
  if (
    isContentDirty.value &&
    !window.confirm('Des textes ne sont pas enregistrés. Se déconnecter quand même ?')
  )
    return;
  logout();
}

onMounted(async () => {
  if (isPocketBaseEnabled) {
    await refreshSession();
    if (loggedIn.value) await prepareContentSession();
  }
  ready.value = true;
});
</script>

<template>
  <div class="tec-admin min-h-screen bg-brand-dark text-white font-sans">
    <!-- PocketBase non configuré -->
    <div v-if="!isPocketBaseEnabled" class="flex min-h-screen items-center justify-center p-4">
      <div class="tec-admin-card w-full max-w-lg p-8">
        <h1 class="font-bebas text-4xl">Administration indisponible</h1>
        <p class="mt-3 text-sm text-white/75">
          Le site n’est pas relié à une base PocketBase. Définissez la variable
          <code class="text-brand-red-light">VITE_POCKETBASE_URL</code> (ex. dans
          <code>.env.local</code>), puis relancez le site. La procédure complète est décrite dans
          <code>docs/pocketbase.md</code>.
        </p>
        <a :href="siteHref" class="tec-admin-btn mt-6">← Retour au site</a>
      </div>
    </div>

    <!-- Connexion -->
    <div v-else-if="ready && !loggedIn" class="flex min-h-screen items-center justify-center p-4">
      <div class="w-full max-w-sm">
        <img
          :src="publicUrl('/media/logo-clair.svg')"
          alt="Toulouse Esport Connect"
          class="mx-auto mb-8 h-16 w-auto"
        />
        <div class="tec-admin-card p-6 shadow-2xl">
          <p
            class="font-rajdhani text-xs font-bold uppercase tracking-[0.3em] text-brand-red-light"
          >
            Administration
          </p>
          <h1 class="mt-1 mb-5 font-bebas text-3xl">Connexion</h1>
          <LoginForm @success="onLoggedIn" />
        </div>
        <a
          :href="siteHref"
          class="mt-6 block text-center text-xs text-white/60 underline hover:text-white"
        >
          ← Retour au site
        </a>
      </div>
    </div>

    <!-- Interface -->
    <div v-else-if="ready" class="lg:flex">
      <!-- Barre mobile -->
      <div class="flex items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden">
        <img :src="publicUrl('/media/logo-clair.svg')" alt="TEC" class="h-8 w-auto" />
        <button
          type="button"
          class="tec-admin-btn is-small"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          Menu
        </button>
      </div>

      <aside
        class="border-white/10 bg-brand-card-bg lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r"
        :class="menuOpen ? 'block border-b' : 'hidden lg:flex'"
      >
        <div class="hidden p-6 lg:block">
          <img
            :src="publicUrl('/media/logo-clair.svg')"
            alt="Toulouse Esport Connect"
            class="h-12 w-auto"
          />
          <p
            class="mt-3 font-rajdhani text-xs font-bold uppercase tracking-[0.3em] text-brand-red-light"
          >
            Administration
          </p>
        </div>
        <nav class="flex-1 space-y-0.5 px-3 py-3 lg:py-0" aria-label="Sections de l’administration">
          <button
            v-for="item in TABS"
            :key="item.id"
            type="button"
            class="tec-admin-nav"
            :aria-current="tab === item.id ? 'page' : undefined"
            @click="go(item.id)"
          >
            {{ item.label }}
            <span
              v-if="item.id === 'content' && isContentDirty"
              class="ml-auto h-2 w-2 rounded-full bg-amber-400"
              title="Non enregistré"
            />
          </button>
        </nav>
        <div class="space-y-2 border-t border-white/10 p-4 text-sm">
          <a :href="editHref" target="_blank" rel="noopener" class="tec-admin-btn w-full is-primary"
            >Éditer le site ↗</a
          >
          <a :href="siteHref" target="_blank" rel="noopener" class="tec-admin-btn w-full"
            >Voir le site ↗</a
          >
          <a
            v-if="session.collection === '_superusers'"
            :href="`${POCKETBASE_URL}/_/`"
            target="_blank"
            rel="noopener"
            class="tec-admin-btn w-full"
          >
            Console PocketBase ↗
          </a>
          <div class="flex items-center justify-between gap-2 pt-2">
            <span class="truncate text-xs text-white/60" :title="sessionLabel()">{{
              sessionLabel()
            }}</span>
            <button
              type="button"
              class="text-xs text-white/60 underline hover:text-white"
              @click="signOut"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      <main class="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-10">
        <AdminDashboard v-if="tab === 'dashboard'" @go="go" />
        <AdminContent v-else-if="tab === 'content'" />
        <AdminCollection
          v-else-if="currentCollection"
          :key="currentCollection.name"
          :collection="currentCollection"
        />
        <AdminMedia v-else-if="tab === 'media'" />
        <AdminHistory v-else-if="tab === 'history'" @restored="go('content')" />
      </main>
    </div>
  </div>
</template>

<style>
.tec-admin-nav {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  border-radius: 6px;
  padding: 0.55rem 0.8rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgb(255 255 255 / 0.7);
  text-align: left;
  cursor: pointer;
  transition:
    background 150ms,
    color 150ms;
}
.tec-admin-nav:hover {
  background: rgb(255 255 255 / 0.06);
  color: #fff;
}
.tec-admin-nav[aria-current='page'] {
  background: rgb(227 6 19 / 0.15);
  color: #fff;
  box-shadow: inset 3px 0 0 var(--color-brand-red, #e30613);
}
.tec-admin h1.tec-admin-title {
  font-family: var(--font-bebas);
  font-size: 2.4rem;
  line-height: 1;
}
</style>
