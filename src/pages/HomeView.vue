<script setup lang="ts">
/**
 * Page Accueil — maquette « Fédérer l'esport à Toulouse » :
 * héros split, prochains événements, logos des associations,
 * bandeau de chiffres clés et appel à l'adhésion.
 */
import { computed, onMounted } from 'vue';

import AssociationDetailModal from '@/components/AssociationDetailModal.vue';
import EventCard from '@/components/EventCard.vue';
import EventDetailModal from '@/components/EventDetailModal.vue';
import { useModal } from '@/composables/useModal';
import { useAppStore } from '@/stores/app';
import { useDataStore } from '@/stores/data';
import type { Association, EventItem } from '@/types';
import { publicUrl } from '@/utils/paths';

const dataStore = useDataStore();
const appStore = useAppStore();
const modal = useModal();

/** Visuel du héros (à remplacer par une photo officielle d'événement). */
const HERO_IMAGE = publicUrl('/media/hero-esport.jpg');

/* ------------------------------------------------------------- données */
const upcomingEvents = computed<EventItem[]>(() => dataStore.getUpcomingEvents(3));
const associations = computed<Association[]>(() => dataStore.associations.slice(0, 7));



/* --------------------------------------------------------------- modales */
function openEventDetail(event: EventItem): void {
  modal.open(EventDetailModal, { title: event.title, event, size: 'xl' });
}
function openAssociationDetail(association: Association): void {
  modal.open(AssociationDetailModal, { title: association.name, association, size: 'xl' });
}

/* -------------------------------------------------------------- cycle */
onMounted(async () => {
  appStore.setLoading(true);
  try {
    await dataStore.loadAll();
    if (dataStore.error) appStore.showToast('Erreur chargement données', 'error');
  } catch {
    appStore.showToast('Erreur chargement données', 'error');
  } finally {
    appStore.setLoading(false);
  }
});
</script>

<template>
  <div class="home">
    <!-- ============================== HÉROS ============================== -->
    <!-- Pas de fond propre : on laisse apparaître `.texture-light` du <main>
         (même texture béton) pour un raccord invisible entre les sections. -->
    <section class="hero relative overflow-hidden" aria-labelledby="home-title">
      <!-- Wrapper visuel : porte l'ombre de la déchirure (non coupée par le masque) -->
      <div class="hero__visual-wrapper" aria-hidden="true">
        <!-- Photo de scène esport directement découpée par le masque de griffure -->
        <div
          class="hero__image"
          :style="{ backgroundImage: `url('${HERO_IMAGE}')` }"
          aria-hidden="true"
        ></div>
      </div>

      <div class="relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div class="max-w-xl">
          <h1 id="home-title" class="font-bebas leading-[0.9] text-6xl md:text-8xl text-[#141414]">
            Fédérer<br />l’esport<br /><span class="text-brand-red">à Toulouse</span>
          </h1>
          <p class="mt-5 text-base md:text-lg font-semibold text-[#1d1d1d]">
            Le réseau des associations<br />et événements gaming en Occitanie
          </p>
          <div class="mt-8 flex flex-wrap gap-4">
            <RouterLink id="hero-events-btn" to="/evenements" class="btn-red">Voir les événements</RouterLink>
            <RouterLink id="hero-join-btn" to="/adhesion" class="btn-outline-red">Rejoindre le T.E.C</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <div>
      <!-- ======================= PROCHAINS ÉVÉNEMENTS ======================= -->
      <section class="max-w-5xl mx-auto px-4 py-14" aria-labelledby="home-events">
        <h2 id="home-events" class="section-title">Prochains <span>événements</span></h2>

        <p v-if="upcomingEvents.length === 0" class="mt-8 text-center text-sm text-gray-600">
          Aucun événement à venir pour le moment — revenez vite !
        </p>
        <div v-else class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <EventCard v-for="event in upcomingEvents" :key="event.id" :event="event" @open="openEventDetail(event)" />
        </div>

        <div class="mt-8 text-center">
          <RouterLink id="home-all-events" to="/evenements" class="btn-outline-red">Voir tous les événements</RouterLink>
        </div>
      </section>

      <!-- ======================= ASSOCIATIONS ======================= -->
      <section class="max-w-6xl mx-auto px-4 pb-16" aria-labelledby="home-associations">
        <h2 id="home-associations" class="section-title">Les associations <span>toulousaines</span></h2>

        <ul class="mt-10 flex flex-wrap items-center justify-center gap-8 md:gap-12">
          <li v-for="association in associations" :key="association.id">
            <button type="button" class="assoc-logo" :aria-label="`Découvrir ${association.name}`" @click="openAssociationDetail(association)">
              <img :src="publicUrl(association.logo)" :alt="association.name" loading="lazy" />
            </button>
          </li>
        </ul>

        <div class="mt-10 text-center">
          <RouterLink id="home-all-assos" to="/associations" class="btn-outline-red">Voir toutes les associations</RouterLink>
        </div>
      </section>
    </div>

  </div>
</template>

<style scoped>
/* ---------- Héros ---------- */
.hero {
  position: relative;
  overflow: hidden;
}

/* Wrapper : positionnement (58 % à droite) + ombre qui épouse la déchirure */
.hero__visual-wrapper {
  position: absolute;
  inset: 0 0 0 auto;
  width: 58%;
  z-index: 1;
  /* Relief exactement sur le contour alpha du masque de griffure */
  filter: drop-shadow(-8px 0 12px rgba(0, 0, 0, 0.25));
  animation: hero-in 0.9s ease-out both;
}

/* Photo masquée par la griffure :
   - couche 1 : dechirure-inverse.png sur la bande gauche → l'opaque cache la photo
     (fond gris), le transparent laisse voir la photo ;
   - couche 2 : linear-gradient plein à droite pour afficher la photo entière. */
.hero__image {
  --band: 420px;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  -webkit-mask-image:
    url(/media/dechirure-inverse.webp),
    linear-gradient(to right, transparent calc(var(--band) - 1px), black var(--band));
  mask-image:
    url(/media/dechirure-inverse.webp),
    linear-gradient(to right, transparent calc(var(--band) - 1px), black var(--band));
  -webkit-mask-size: var(--band) 100%, 100% 100%;
  mask-size: var(--band) 100%, 100% 100%;
  -webkit-mask-position: left center, center;
  mask-position: left center, center;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}

/* Responsive : fondu vertical propre sur mobile */
@media (max-width: 768px) {
  .hero__visual-wrapper {
    width: 100%;
    height: 45%;
    inset: auto 0 0 0;
    filter: none;
  }
  .hero__image {
    -webkit-mask-image: linear-gradient(to bottom, transparent, black 35%);
    mask-image: linear-gradient(to bottom, transparent, black 35%);
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
  }
}

@keyframes hero-in {
  from { opacity: 0; transform: translateX(40px); }
}

/* ---------- Logos associations ---------- */
.assoc-logo {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  transition: transform 0.25s, filter 0.25s;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.25));
}
.assoc-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
.assoc-logo:hover { transform: scale(1.12); filter: drop-shadow(0 6px 10px rgba(227, 6, 19, 0.4)); }

</style>
