<script setup lang="ts">
/**
 * ESSAI MASK — Effet griffure avec votre image `dechirure.png`.
 *
 * Principe :
 *  - le fond gris clair (`texture-light`, #dcdcdc) occupe toute la page d'accueil ;
 *  - la photo de scène esport est positionnée à droite (55 %) ;
 *  - entre les deux, un élément de couleur gris clair porte votre masque
 *    `dechirure.png` en `-webkit-mask-image` :
 *      • noir opaque  = le gris clair reste visible (le "plus gros" du fond) ;
 *      • transparent  = la photo esport apparaît à travers (la griffure).
 *
 * Résultat : une frontière organique, bestiale, faite par un animal, qui
 * laisse voir la photo uniquement là où votre masque est transparent.
 */
import EssaiHeroContent from '@/components/essais/EssaiHeroContent.vue';

const HERO_IMAGE = '/media/hero-esport.jpg';
const MASK_IMAGE = '/media/dechirure.png';

/* Style du masque : fond gris clair découpé par dechirure.png */
const maskStyle = {
  backgroundColor: '#dcdcdc',
  WebkitMaskImage: `url(${MASK_IMAGE})`,
  maskImage: `url(${MASK_IMAGE})`,
  /* Remplit la zone de la photo sans déformation excessive ; à ajuster
     selon la cadrage de votre image dechirure.png (cover / contain / 100% 100%) */
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
};
</script>

<template>
  <section class="essai-mask relative overflow-hidden" aria-labelledby="essai-mask-title">
    <span class="essai-mask__badge">Essai — Masque dechirure.png</span>

    <!-- Photo scène esport (côté droit, 55 %) -->
    <div
      class="essai-mask__image"
      :style="{ backgroundImage: `url('${HERO_IMAGE}')` }"
      aria-hidden="true"
    ></div>

    <!-- Masque griffure : gris clair découpé par dechirure.png, placé entre
         le fond gris (à gauche) et la photo (à droite) -->
    <div class="essai-mask__mask" :style="maskStyle" aria-hidden="true">
      <!-- Fine ombre de relief sur le côté gauche de la griffe (côté gris) -->
      <span class="essai-mask__edge" aria-hidden="true" />
    </div>

    <div class="relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-24">
      <EssaiHeroContent />
    </div>
  </section>
</template>

<style scoped>
/* ---------- Badge technique ---------- */
.essai-mask__badge {
  position: absolute;
  top: 1.2rem;
  left: 1.2rem;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: rgba(20, 20, 20, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(6px);
  font: 700 0.7rem var(--font-rajdhani);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

/* ---------- Photo esport ---------- */
.essai-mask__image {
  position: absolute;
  inset: 0 0 0 auto;
  width: 55%;
  height: 100%;
  background-size: cover;
  background-position: center;
  animation: essai-mask-in 1s ease-out both;
}

/* ---------- Masque griffure (gris clair + dechirure.png) ---------- */
.essai-mask__mask {
  position: absolute;
  inset: 0 0 0 auto;
  width: 55%;
  height: 100%;
  /* même zone que la photo : le gris clair y est "découpé" par le masque */
  z-index: 3;
  pointer-events: none;
  animation: essai-mask-in 1s ease-out both;
}

/* Ombre de relief sur le bord gauche de la griffe (côté fond gris) */
.essai-mask__edge {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  box-shadow: inset -8px 0 24px rgba(0, 0, 0, 0.18);
  pointer-events: none;
}

@keyframes essai-mask-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
}

/* ---------- Responsive ---------- */
@media (max-width: 767px) {
  .essai-mask__image,
  .essai-mask__mask {
    width: 100%;
    inset: 0;
  }
  .essai-mask__badge {
    font-size: 0.65rem;
    padding: 0.25rem 0.7rem;
  }
}
</style>
