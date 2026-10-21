<script setup lang="ts">
/**
 * Layout par défaut : skip-link, en-tête, conteneur principal et pied de page.
 */
import SiteFooter from '@/components/layout/SiteFooter.vue';
import SiteHeader from '@/components/layout/SiteHeader.vue';
</script>

<template>
  <a href="#main-content" class="skip-link">Aller au contenu principal</a>
  <SiteHeader />
  <main id="main-content" role="main" class="min-h-[calc(100vh-200px)]">
    <slot />
  </main>
  <SiteFooter />
</template>
