<script setup lang="ts">
/**
 * Layout par défaut : skip-link, en-tête, contenu (fond gris texturé),
 * bandeau chiffres clés, appel à l'adhésion et pied de page.
 */
import JoinCta from '@/components/layout/JoinCta.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import SiteHeader from '@/components/layout/SiteHeader.vue';
import StatsBand from '@/components/layout/StatsBand.vue';
</script>

<template>
  <a href="#main-content" class="skip-link">Aller au contenu principal</a>
  <SiteHeader />
  <main id="main-content" role="main" class="theme-light texture-light min-h-[calc(100vh-200px)]">
    <slot />
  </main>
  <StatsBand />
  <JoinCta />
  <SiteFooter />
</template>
