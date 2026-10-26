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

const dataStore = useDataStore();
const appStore = useAppStore();
const modal = useModal();

/** Visuel du héros (à remplacer par une photo officielle d'événement). */
const HERO_IMAGE = '/media/hero-esport.jpg';


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
    <section class="hero" aria-labelledby="home-title">
      <div class="hero__image" :style="{ backgroundImage: `url('${HERO_IMAGE}')` }" aria-hidden="true"></div>

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
              <img :src="association.logo" :alt="association.name" loading="lazy" />
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
.hero__image {
  position: absolute;
  inset: 0 0 0 auto;
  width: 55%;
  background-size: cover;
  background-position: center;
  /* bord gauche « déchiré » */
  clip-path: polygon(8% 0, 100% 0, 100% 100%, 3% 100%, 6% 92%, 2% 84%, 7% 75%, 3% 66%, 8% 57%, 2% 48%, 6% 38%, 1% 28%, 7% 18%, 3% 9%);
  animation: hero-in 0.9s ease-out both;
}
@media (max-width: 767px) {
  .hero__image {
    width: 100%;
    opacity: 0.25;
    clip-path: none;
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
