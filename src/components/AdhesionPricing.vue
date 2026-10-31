<script setup lang="ts">
/**
 * Panneau tarifs d'adhésion (maquette 2026) : membres individuels (1 €),
 * membres sympathisants (5 €) et entités morales (50 €) avec leurs avantages.
 */
import { pages } from '@/utils/content';
import { publicUrl } from '@/utils/paths';

/** Formules et avantages (`pages.adhesion.pricing` de `content.json`). */
const pricing = pages.adhesion.pricing;
</script>

<template>
  <section class="max-w-6xl mx-auto px-4 pt-6" aria-labelledby="pricing-title">
    <div class="pricing tec-panel">
      <img :src="publicUrl('/media/tec-bandeau.svg')" alt="" class="pricing__bandeau" aria-hidden="true" />
      <img :src="publicUrl('/media/tec-logo-only-croix.svg')" alt="" class="pricing__croix" aria-hidden="true" />
      <h2 id="pricing-title" class="relative font-bebas text-5xl text-center text-[#141414]">{{ pricing.title }}</h2>

      <div class="relative mt-6 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        <article v-for="offer in pricing.offers" :key="offer.price" class="offer">
          <header class="text-center">
            <p class="font-bebas text-5xl text-brand-red">{{ offer.price }}</p>
            <h3 class="font-bebas text-2xl leading-tight text-[#141414]"><template v-for="(line, index) in offer.title" :key="index"><br v-if="index > 0" />{{ line }}</template></h3>
          </header>
          <ul class="mt-6 space-y-4 text-xs uppercase text-[#1d1d1d]">
            <li v-for="group in offer.groups" :key="group.title">
              <p class="font-bold">▪ {{ group.title }}</p>
              <ul class="mt-1 ml-6 list-disc space-y-0.5">
                <li v-for="item in group.items" :key="item">{{ item }}</li>
              </ul>
            </li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pricing {
  position: relative;
  overflow: hidden;
  padding: 2.5rem 2rem 2.5rem;
  background: rgba(190, 190, 190, 0.55);
}
/* Bandeau rouge + croix TEC en haut à gauche (maquette) */
.pricing__bandeau {
  position: absolute;
  top: 0;
  left: 0;
  width: 300px;
  height: auto;
  pointer-events: none;
}
.pricing__croix {
  position: absolute;
  top: 18px;
  left: 18px;
  width: 130px;
  height: auto;
  pointer-events: none;
  animation: croix-in 0.8s ease-out both;
}
@keyframes croix-in {
  from {
    opacity: 0;
    transform: rotate(-20deg) scale(0.8);
  }
}
.offer {
  transition: transform 0.25s;
}
.offer:hover {
  transform: translateY(-3px);
}
@media (max-width: 767px) {
  .pricing__bandeau {
    width: 160px;
    opacity: 0.5;
  }
  .pricing__croix {
    width: 70px;
    opacity: 0.6;
  }
}
</style>
