<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

import CookieBanner from '@/components/ui/CookieBanner.vue';
import ModalHost from '@/components/ui/ModalHost.vue';
import ToastHost from '@/components/ui/ToastHost.vue';
import { useCookieConsent } from '@/composables/useCookieConsent';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { editMode, syncEditModeFromUrl } from '@/editor/editMode';
import { applyRouteSeo, useHashHistory } from '@/router';
import { content } from '@/utils/content';
import { publicUrl } from '@/utils/paths';

/** Barre et outils du mode édition (`?edit`), chargés uniquement à la demande. */
const EditorRoot = defineAsyncComponent(() => import('@/editor/EditorRoot.vue'));

const { init } = useCookieConsent();
const route = useRoute();

/** Pages d'administration : rendu sans en-tête ni pied de page. */
const isBlankLayout = computed(() => route.meta.layout === 'blank');

// `?edit` dans l'URL (avant ou après le `#` en hash routing) active le mode édition.
watch(
  () => route.fullPath,
  () => syncEditModeFromUrl(route.query),
  { immediate: true }
);

// Titre d'onglet / description à jour quand les textes changent (base, édition).
watch(
  () => route.meta.contentKey && content.pages[route.meta.contentKey].meta,
  () => applyRouteSeo(route),
  { deep: true }
);

/** Routes principales dont le document est préchargé après le premier rendu. */
const PREFETCH_ROUTES = ['/', '/associations', '/evenements', '/actualites'];

/**
 * Préchauffe la navigation en demandant au navigateur de prefetcher
 * les documents des routes les plus visitées ( `<link rel="prefetch">` ).
 *
 * Sans objet en hash routing (une seule page HTML) et les URL doivent être
 * préfixées par le `base` (ex. `/tec/associations` sur GitHub Pages).
 */
function prefetchRoutes(paths: readonly string[]): void {
  if (useHashHistory) return;
  for (const path of paths) {
    const href = publicUrl(path);
    if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'document';
    link.href = href;
    document.head.appendChild(link);
  }
}

onMounted(() => {
  init();
  prefetchRoutes(PREFETCH_ROUTES);
});
</script>

<template>
  <RouterView v-if="isBlankLayout" />
  <DefaultLayout v-else>
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </DefaultLayout>

  <Teleport to="body">
    <ModalHost />
    <ToastHost />
    <CookieBanner v-if="!isBlankLayout" />
    <EditorRoot v-if="editMode.active && !isBlankLayout" />
  </Teleport>
</template>
