<template>
  <!-- Contenu commun du héros (titre, accroche, CTA) — identique sur chaque essai
       pour ne juger que l'effet de frontière entre fond gris et photo. -->
  <div class="max-w-xl">
    <p class="font-rajdhani text-[10px] md:text-xs font-bold uppercase tracking-widest text-brand-red mb-2 sm:mb-3">
      Essai d'effet visuel — page d'accueil
    </p>
    <h1 class="font-bebas leading-[0.9] text-6xl md:text-8xl text-[#141414] mb-4 sm:mb-5">
      Fédérer<br />
      l’esport<br />
      <span class="text-brand-red">à Toulouse</span>
    </h1>
    <p class="mt-4 sm:mt-5 text-base md:text-lg font-semibold text-[#1d1d1d] leading-relaxed">
      Le réseau des associations<br />
      et événements gaming en Occitanie
    </p>
    <div class="mt-8 sm:mt-10 flex flex-wrap gap-4">
      <RouterLink
        to="/evenements"
        class="btn-red"
        aria-label="Voir les événements"
      >
        Voir les événements
      </RouterLink>
      <RouterLink
        to="/adhesion"
        class="btn-outline-red"
        aria-label="Rejoindre le T.E.C"
      >
        Rejoindre le T.E.C
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>
