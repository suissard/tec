<script setup lang="ts">
/**
 * ESSAI 3 — Effet griffure, technique « masque d'écorçure + rayures animées ».
 *
 * Principe :
 *  - `-webkit-mask-image` applique un SVG sur toute la photo : blanc opaque partout
 *    sauf sur le bord gauche, où un dégradé vers le transparent est perturbé par un
 *    filtre de bruit (fractal noise + déplacement). Résultat : bord « écorcé »,
 *    organique et aléatoire ;
 *  - trois rayures de griffes défilent en traversant la frontière (animation
 *    de balayage), pour le côté « coup de patte d'animal ».
 */
import EssaiHeroContent from '@/components/essais/EssaiHeroContent.vue';

const HERO_IMAGE = '/media/hero-esport.jpg';

/* SVG inline encodé en data-URI : fond blanc opaque, bord gauche « écorcé » par bruit. */
const MASK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000"><defs><filter id="r"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" stitchTiles="stitch" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="11" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="0.7"/></filter><linearGradient id="e" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#fff" stop-opacity="0"/><stop offset="26%" stop-color="#fff" stop-opacity="0.35"/><stop offset="34%" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="1000" height="1000" fill="#fff"/><rect x="0" y="0" width="320" height="1000" fill="url(#e)" filter="url(#r)"/></svg>`;

const maskStyle = {
  backgroundImage: `url('${HERO_IMAGE}')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  WebkitMaskImage: `url(${MASK_SVG})`,
  maskImage: `url(${MASK_SVG})`,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskPosition: '0 0',
  maskPosition: '0 0',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
};
</script>

<template>
  <section class="essai3 relative overflow-hidden" aria-labelledby="essai3-title">
    <span class="essai3__badge">Essai 3 — Masque d'écorçure + rayures</span>

    <!-- Photo scène esport, bord gauche masqué pour un aspect « écorcé / arraché » -->
    <div
      class="essai3__image"
      :style="maskStyle"
      aria-hidden="true"
    ></div>

    <!-- Rayures de griffes qui défilent sur la frontière -->
    <div class="essai3__swipes" aria-hidden="true">
      <span class="essai3__swipe" style="--i: 1" />
      <span class="essai3__swipe" style="--i: 2" />
      <span class="essai3__swipe" style="--i: 3" />
    </div>

    <!-- Petite ombre de profondeur sur le fond gris -->
    <div class="essai3__wound" aria-hidden="true"></div>

    <div class="relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-24">
      <EssaiHeroContent />
    </div>
  </section>
</template>

<style scoped>
/* ---------- Badge technique ---------- */
.essai3__badge {
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
.essai3__image {
  position: absolute;
  inset: 0 0 0 auto;
  width: 55%;
  height: 100%;
  background-size: cover;
  background-position: center;
  animation: essai3-in 1s ease-out both;
  will-change: mask-image;
}

/* ---------- Ombre de profondeur ---------- */
.essai3__wound {
  position: absolute;
  left: 45%;
  top: 0;
  bottom: 0;
  width: 9px;
  transform: translateX(-50%);
  z-index: 3;
  pointer-events: none;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.5), transparent 70%);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.4);
}

/* ---------- Rayures de griffes animées ---------- */
.essai3__swipes {
  position: absolute;
  left: 45%;
  top: 0;
  bottom: 0;
  width: 13%;
  transform: translateX(-50%);
  z-index: 4;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20%;
}

.essai3__swipe {
  position: absolute;
  left: 50%;
  width: 60%;
  max-width: 160px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(227, 6, 19, 0.14) 65%,
    transparent
  );
  filter: blur(3px);
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.45);
  opacity: 0;
  transform-origin: center;
}

.essai3__swipe:nth-child(1) {
  transform: translate(-50%, -10%) rotate(10deg);
  animation: essai3-swipe-1 1.1s ease-out both;
}
.essai3__swipe:nth-child(2) {
  transform: translate(-50%, 8%) rotate(14deg);
  animation: essai3-swipe-2 1.4s ease-out both;
}
.essai3__swipe:nth-child(3) {
  transform: translate(-50%, 16%) rotate(7deg);
  animation: essai3-swipe-3 1.75s ease-out both;
}

@keyframes essai3-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
}

@keyframes essai3-swipe-1 {
  from {
    transform: translate(-50%, -10%) rotate(10deg) translateX(-170%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -10%) rotate(10deg);
    opacity: 1;
  }
}
@keyframes essai3-swipe-2 {
  from {
    transform: translate(-50%, 8%) rotate(14deg) translateX(-170%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 8%) rotate(14deg);
    opacity: 1;
  }
}
@keyframes essai3-swipe-3 {
  from {
    transform: translate(-50%, 16%) rotate(7deg) translateX(-170%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 16%) rotate(7deg);
    opacity: 1;
  }
}

/* ---------- Responsive ---------- */
@media (max-width: 767px) {
  .essai3__image {
    width: 100%;
    opacity: 0.3;
    -webkit-mask: none;
    mask: none;
  }
  .essai3__swipes,
  .essai3__wound {
    display: none;
  }
  .essai3__badge {
    font-size: 0.65rem;
    padding: 0.25rem 0.7rem;
  }
}
</style>
