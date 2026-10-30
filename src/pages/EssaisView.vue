<script setup lang="ts">
/**
 * Page de comparaison des essais d'effet « griffure » sur la page d'accueil.
 *
 * Trois techniques sont proposées entre le fond gris clair (`texture-light`) et
 * la photo de scène esport (`hero-esport.jpg`) :
 *
 *  - /essai1  — pure CSS : `clip-path` polygone + 3 rayures de griffes dégradées
 *  - /essai2  — masque SVG découpé (`clipPath`) + filtre de fourrure (bruit +
 *               déplacement) + stries de blessure
 *  - /essai3  — `-webkit-mask-image` SVG (bord « écorcé ») + rayures animées
 *
 * Ouvrez chaque lien pour comparer le rendu et choisissez le meilleur.
 */
import { RouterLink } from 'vue-router';
import { routeNames } from '@/router';

const ESSAIS = [
  {
    path: { name: routeNames.Essai1 },
    title: 'Essai 1 — Griffes pure CSS',
    technique: 'clip-path polygone + rayures dégradées',
    description:
      'Le bord gauche de la photo est découpé par un polygone irrégulier ; trois rayures de griffes (ours/loup) traversent la frontière avec une ombre de profondeur.',
  },
  {
    path: { name: routeNames.Essai2 },
    title: 'Essai 2 — Masque SVG déchiré',
    technique: 'clipPath SVG + filtre de fourrure (feTurbulence)',
    description:
      'Un masque SVG définit un bord organique « arraché », rendu poilu par un filtre de bruit et de déplacement. Stries de blessure sur le fond gris.',
  },
  {
    path: { name: routeNames.Essai3 },
    title: 'Essai 3 — Masque d’écorçure + rayures',
    technique: '-webkit-mask-image SVG (bruit) + rayures animées',
    description:
      'Un masque SVG écorce le bord gauche de la photo (fractal noise + déplacement). Trois griffes balayent la frontière au chargement.',
  },
  {
    path: { name: routeNames.EssaiMask },
    title: 'Essai — Masque dechirure.png',
    technique: '-webkit-mask-image avec votre image dechirure.png',
    description:
      'Votre masque image (noir opaque = fond gris, transparent = photo) placé entre le fond gris clair et la photo esport pour une frontière griffée organique.',
  },
] as const;
</script>

<template>
  <section class="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div class="text-center mb-12 sm:mb-16">
      <p class="font-rajdhani text-xs font-bold uppercase tracking-widest text-brand-red mb-3">
        Comparaison des effets de griffure
      </p>
      <h1 class="font-bebas text-4xl sm:text-5xl text-[#141414] mb-4">
        Choisir le meilleur rendu
      </h1>
      <p class="text-gray-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
        Chaque page reprend le même héros (fond gris clair à gauche, photo de scène
        esport à droite) avec une technique différente pour la frontière entre les
        deux. Ouvrez un essai pour le voir en grand, puis choisissez celui qui sera
        intégré à la page d'accueil.
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
      <article
        v-for="essai in ESSAIS"
        :key="essai.title"
        class="group rounded-3xl border border-white/20 bg-white/40 p-6 sm:p-8 hover:border-brand-red/50 hover:bg-white/60 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
      >
        <div class="mb-5">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red text-[10px] font-rajdhani font-bold uppercase tracking-wider">
            {{ essai.technique }}
          </span>
        </div>

        <h2 class="font-bebas text-2xl sm:text-3xl text-[#141414] mb-2 group-hover:text-brand-red transition-colors">
          {{ essai.title }}
        </h2>
        <p class="text-sm text-gray-600 mb-6 leading-relaxed">
          {{ essai.description }}
        </p>

        <RouterLink
          :to="essai.path"
          class="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-[#141414] text-white font-rajdhani font-bold text-xs uppercase tracking-wider hover:bg-brand-red hover:scale-105 transition-all shadow-lg"
        >
          Voir l’essai
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </RouterLink>
      </article>
    </div>

    <div class="mt-12 sm:mt-16 pt-8 border-t border-white/20 text-center">
      <p class="text-xs text-gray-500 uppercase tracking-widest">
        Retour à l’accueil :
      </p>
      <RouterLink
        to="/"
        class="mt-2 inline-flex items-center gap-2 text-brand-red font-rajdhani font-bold text-xs uppercase hover:underline transition-colors"
      >
        Accueil TEC
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" />
        </svg>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
/* Aucun style spécifique : les utilitaires Tailwind suffisent. */
</style>
