<script setup lang="ts">
/**
 * ESSAI 2 — Effet griffure, technique « masque SVG découpé + filtre de fourrure ».
 *
 * Principe :
 *  - un `<clipPath>` SVG définit le bord gauche de la photo : une ligne verticale
 *    irrégulière qui simule du tissu/peau déchiré par des griffes ;
 *  - un filtre SVG (`feTurbulence` + `feDisplacementMap`) rend le bord organique,
 *    poilu, « écorcé » plutôt que géométrique ;
 *  - une petite bande de « blessure » (ombre + stries) marque la frontière sur le
 *    fond gris clair.
 */
import EssaiHeroContent from '@/components/essais/EssaiHeroContent.vue';

const HERO_IMAGE = '/media/hero-esport.jpg';
</script>

<template>
  <section class="essai2 relative overflow-hidden" aria-labelledby="essai2-title">
    <span class="essai2__badge">Essai 2 — Masque SVG déchiré</span>

    <!-- Définitions du masque et du filtre (invisible, sert uniquement la photo) -->
    <svg class="essai2__defs" width="0" height="0" aria-hidden="true">
      <defs>
        <clipPath id="essai2-edge" clipPathUnits="objectBoundingBox">
          <!-- Bord droit (photo intacte) + bord gauche irrégulier « griffé » -->
          <path
            d="M 0 0 L 1 0 L 1 1 L 0 1
               L 0.04 0.95 L 0 0.88 L 0.05 0.82 L 0.01 0.74 L 0.06 0.68 L 0 0.60
               L 0.04 0.52 L 0 0.44 L 0.05 0.36 L 0.01 0.28 L 0.06 0.20 L 0 0.12 L 0.04 0.06 Z"
          />
        </clipPath>

        <filter id="essai2-fur" x="-3%" y="-3%" width="106%" height="106%">
          <!-- Bruit de base pour l'aspect poil / écorce -->
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03"
            numOctaves="4"
            stitchTiles="stitch"
            result="fur"
          />
          <!-- Déplace les bords du masque pour les rendre irréguliers -->
          <feDisplacementMap
            in="SourceGraphic"
            in2="fur"
            scale="5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
      </defs>
    </svg>

    <!-- Photo scène esport, découpée par le masque griffé -->
    <div
      class="essai2__image"
      :style="{ backgroundImage: `url('${HERO_IMAGE}')` }"
      aria-hidden="true"
    ></div>

    <!-- Marque de « blessure » sur le fond gris, à la frontière -->
    <div class="essai2__wound" aria-hidden="true">
      <span class="essai2__stria stria-1" />
      <span class="essai2__stria stria-2" />
      <span class="essai2__stria stria-3" />
    </div>

    <div class="relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-24">
      <EssaiHeroContent />
    </div>
  </section>
</template>

<style scoped>
/* ---------- Badge technique ---------- */
.essai2__badge {
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

/* ---------- Photo ---------- */
.essai2__image {
  position: absolute;
  inset: 0 0 0 auto;
  width: 55%;
  height: 100%;
  background-size: cover;
  background-position: center;
  /* Découpage par le masque SVG : bord gauche organique et irrégulier */
  clip-path: url(#essai2-edge);
  -webkit-clip-path: url(#essai2-edge);
  animation: essai2-in 1s ease-out both;
  will-change: clip-path;
}

/* ---------- Blessure sur le fond gris ---------- */
.essai2__wound {
  position: absolute;
  left: 45%;
  top: 0;
  bottom: 0;
  width: 14px;
  transform: translateX(-50%);
  z-index: 3;
  pointer-events: none;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.55), transparent 75%);
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.45);
}

/* Stries de griffes sur la blessure (marques de sang séché / peau) */
.essai2__stria {
  position: absolute;
  left: 50%;
  width: 70%;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(0, 0, 0, 0.5) 0%,
    rgba(227, 6, 19, 0.15) 45%,
    transparent 70%
  );
  filter: blur(1.5px);
  transform: translateX(-50%);
  opacity: 0;
}
.essai2__stria-1 { top: 18%; transform: translateX(-50%) rotate(8deg); animation: essai2-stria-1 1.2s ease-out both; }
.essai2__stria-2 { top: 50%; transform: translateX(-50%) rotate(12deg); animation: essai2-stria-2 1.5s ease-out both; }
.essai2__stria-3 { top: 82%; transform: translateX(-50%) rotate(5deg); animation: essai2-stria-3 1.8s ease-out both; }

@keyframes essai2-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
}
@keyframes essai2-stria-1 {
  from { transform: translateX(-50%) rotate(8deg) translateX(-140%); opacity: 0; }
  to { transform: translateX(-50%) rotate(8deg); opacity: 1; }
}
@keyframes essai2-stria-2 {
  from { transform: translateX(-50%) rotate(12deg) translateX(-140%); opacity: 0; }
  to { transform: translateX(-50%) rotate(12deg); opacity: 1; }
}
@keyframes essai2-stria-3 {
  from { transform: translateX(-50%) rotate(5deg) translateX(-140%); opacity: 0; }
  to { transform: translateX(-50%) rotate(5deg); opacity: 1; }
}

/* ---------- Responsive ---------- */
@media (max-width: 767px) {
  .essai2__image {
    width: 100%;
    opacity: 0.3;
    clip-path: none;
  }
  .essai2__wound {
    display: none;
  }
  .essai2__badge {
    font-size: 0.65rem;
    padding: 0.25rem 0.7rem;
  }
}
</style>
