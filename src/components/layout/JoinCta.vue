<script setup lang="ts">
/**
 * Appel à l'adhésion (bandeau rouge sur photo) affiché avant le pied de page.
 */
import { layout } from '@/utils/content';
import { toLink } from '@/utils/navigation';
import { publicUrl } from '@/utils/paths';

const cta = layout.joinCta;
const button = toLink(cta.button);

const BG_IMAGE = publicUrl('/media/hero-esport.jpg');
</script>

<template>
  <section class="cta" aria-labelledby="join-cta-title" :style="{ backgroundImage: `url('${BG_IMAGE}')` }">
    <div class="relative z-10 max-w-4xl mx-auto px-4 py-12 text-center">
      <h2 id="join-cta-title" class="font-bebas text-4xl md:text-6xl text-white">{{ cta.title }}</h2>
      <p class="mt-1 text-white/90">{{ cta.text }}</p>
      <RouterLink id="cta-adhesion" :to="button.to" class="btn-dark mt-6 px-8! py-3!">{{ button.label }}</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.cta {
  position: relative;
  background-size: cover;
  background-position: center;
}
.cta::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(190, 40, 45, 0.85);
}
</style>
