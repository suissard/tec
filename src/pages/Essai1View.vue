<script setup lang="ts">
/**
 * ESSAI 1 — Effet griffure, technique « pure CSS ».
 *
 * Principe :
 *  - la photo est découpée sur son bord gauche par un `clip-path` polygon
 *    irrégulier (bord « arraché » vertical) ;
 *  - trois rayures de griffes (pseudo-éléments dégradés floutés) traversent la
 *    frontière fond gris / photo, comme un coup de patte d'ours ou de loup ;
 *  - une bande d'ombre portée sur le côté gris donne l'impression que la photo
 *    a été arrachée.
 */
import EssaiHeroContent from '@/components/essais/EssaiHeroContent.vue';

const HERO_IMAGE = '/media/hero-esport.jpg';
</script>

<template>
  <section class="essai1 relative overflow-hidden" aria-labelledby="essai1-title">
    <span class="essai1__badge">Essai 1 — Griffes pure CSS</span>

    <!-- Photo scène esport, bord gauche « griffé » -->
    <div
      class="essai1__image"
      :style="{ backgroundImage: `url('${HERO_IMAGE}')` }"
      aria-hidden="true"
    ></div>

    <!-- Ombre de la photo « arrachée » sur le fond gris clair -->
    <div class="essai1__wound" aria-hidden="true"></div>

    <!-- Trois rayures de griffes qui balayent la frontière -->
    <div class="essai1__claws" aria-hidden="true">
      <span class="essai1__claw" style="--i: 1" />
      <span class="essai1__claw" style="--i: 2" />
      <span class="essai1__claw" style="--i: 3" />
    </div>

    <div class="relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-24">
      <EssaiHeroContent />
    </div>
  </section>
</template>

<style scoped>
/* ---------- Badge technique ---------- */
.essai1__badge {
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
.essai1__image {
  position: absolute;
  inset: 0 0 0 auto;
  width: 55%;
  height: 100%;
  background-size: cover;
  background-position: center;
  /* Bord gauche irrégulier : effet bord arraché par des griffes */
  clip-path: polygon(
    0 0,
    100% 0,
    100% 100%,
    0 100%,
    3% 95%,
    0 88%,
    5% 82%,
    1% 74%,
    6% 68%,
    0 60%,
    4% 52%,
    0 44%,
    5% 36%,
    1% 28%,
    6% 20%,
    0 12%,
    4% 6%
  );
  animation: essai1-in 1s ease-out both;
  will-change: clip-path;
}

/* Bande d'ombre sur le fond gris, juste à gauche du bord de la photo */
.essai1__wound {
  position: absolute;
  left: 45%;
  top: 0;
  bottom: 0;
  width: 10px;
  transform: translateX(-50%);
  background: linear-gradient(to right, rgba(0, 0, 0, 0.5), transparent 70%);
  opacity: 0.9;
  z-index: 2;
  pointer-events: none;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.35);
}

/* ---------- Rayures de griffes ---------- */
.essai1__claws {
  position: absolute;
  left: 45%;
  top: 0;
  bottom: 0;
  width: 11%;
  transform: translateX(-50%);
  z-index: 3;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16%;
}

.essai1__claw {
  position: absolute;
  left: 50%;
  width: 55%;
  max-width: 150px;
  height: 15px;
  border-radius: 50%;
  /* Tracé de la griffe : dégradé sombre avec un reflet rougeoy au centre */
  background: radial-gradient(
    ellipse 70% 60% at 50% 50%,
    rgba(0, 0, 0, 0.55) 0%,
    rgba(0, 0, 0, 0.4) 35%,
    rgba(227, 6, 19, 0.12) 55%,
    transparent 75%
  );
  filter: blur(2.5px);
  box-shadow: 5px 5px 14px rgba(0, 0, 0, 0.4);
  opacity: 0;
  transform-origin: center;
}

.essai1__claw::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
}

/* Délais décalés pour un effet de balayage bestial (3 coups de patte) */
.essai1__claw:nth-child(1) {
  transform: translate(-50%, -12%) rotate(7deg);
  animation: essai1-swipe-1 1.15s ease-out both;
}
.essai1__claw:nth-child(2) {
  transform: translate(-50%, 6%) rotate(11deg);
  animation: essai1-swipe-2 1.4s ease-out both;
}
.essai1__claw:nth-child(3) {
  transform: translate(-50%, 15%) rotate(4deg);
  animation: essai1-swipe-3 1.65s ease-out both;
}

@keyframes essai1-in {
  from {
    opacity: 0;
    transform: translateX(25px);
  }
}

@keyframes essai1-swipe-1 {
  from {
    transform: translate(-50%, -12%) rotate(7deg) translateX(-150%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -12%) rotate(7deg);
    opacity: 1;
  }
}
@keyframes essai1-swipe-2 {
  from {
    transform: translate(-50%, 6%) rotate(11deg) translateX(-150%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 6%) rotate(11deg);
    opacity: 1;
  }
}
@keyframes essai1-swipe-3 {
  from {
    transform: translate(-50%, 15%) rotate(4deg) translateX(-150%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 15%) rotate(4deg);
    opacity: 1;
  }
}

/* ---------- Responsive ---------- */
@media (max-width: 767px) {
  .essai1__image {
    width: 100%;
    opacity: 0.3;
    clip-path: none;
  }
  .essai1__wound,
  .essai1__claws {
    display: none;
  }
  .essai1__badge {
    font-size: 0.65rem;
    padding: 0.25rem 0.7rem;
  }
}
</style>
