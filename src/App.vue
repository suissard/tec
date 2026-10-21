<script setup lang="ts">
import { onMounted } from 'vue';

import CookieBanner from '@/components/ui/CookieBanner.vue';
import ModalHost from '@/components/ui/ModalHost.vue';
import ToastHost from '@/components/ui/ToastHost.vue';
import { useCookieConsent } from '@/composables/useCookieConsent';
import DefaultLayout from '@/layouts/DefaultLayout.vue';

const { init } = useCookieConsent();

/** Routes principales dont le document est préchargé après le premier rendu. */
const PREFETCH_ROUTES = ['/', '/associations', '/evenements', '/actualites'];

/**
 * Préchauffe la navigation en demandant au navigateur de prefetcher
 * les documents des routes les plus visitées ( `<link rel="prefetch">` ).
 */
function prefetchRoutes(paths: readonly string[]): void {
  for (const path of paths) {
    if (document.querySelector(`link[rel="prefetch"][href="${path}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'document';
    link.href = path;
    document.head.appendChild(link);
  }
}

onMounted(() => {
  init();
  prefetchRoutes(PREFETCH_ROUTES);
});
</script>

<template>
  <DefaultLayout>
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </DefaultLayout>

  <Teleport to="body">
    <ModalHost />
    <ToastHost />
    <CookieBanner />
  </Teleport>
</template>
