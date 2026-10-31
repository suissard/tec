<script setup lang="ts">
/**
 * Panneau tarifs d'adhésion (maquette 2026) : membres individuels (1 €),
 * membres sympathisants (5 €) et entités morales (50 €) avec leurs avantages.
 */
import { publicUrl } from '@/utils/paths';

interface Offer {
  price: string;
  title: string[];
  groups: { title: string; items: string[] }[];
}

const OFFERS: Offer[] = [
  {
    price: '1€',
    title: ['Membres', 'individuels'],
    groups: [
      { title: 'Devenir bénévole', items: ['Droits bénévoles et accès au staff TEC', 'Participation active à l’organisation des événements'] },
      { title: 'Rejoindre le réseau esport toulousain', items: ['Accès à une communauté locale active', 'Rencontres et networking avec les acteurs de l’esport', 'Participation aux événements et soirées TEC'] },
      { title: 'Participer à la vie associative', items: ['Droit de vote en assemblée générale', 'Possibilité de proposer des projets et idées', 'Possibilité de rejoindre les groupes de travail TEC'] },
      { title: 'Gagner en visibilité', items: ['Mise en avant des profils et projets membres', 'Valorisation des compétences au sein du réseau'] },
      { title: 'Accéder à des ressources', items: ['Accès aux espaces privés Discord', 'Partage de documents, conseils et retours d’expérience', 'Veille et informations sur l’esport régional'] },
    ],
  },
  {
    price: '5€',
    title: ['Membres', 'sympathisants'],
    groups: [
      { title: 'Soutenir l’association', items: ['Contribution au développement de l’esport toulousain', 'Soutien aux projets et actions du collectif'] },
      { title: 'Rejoindre la communauté', items: ['Accès à une communauté locale active', 'Participation aux événements et soirées TEC'] },
      { title: 'Rester informé', items: ['Veille et informations sur l’esport régional', 'Relais des actualités TEC'] },
      { title: 'Sans engagement bénévole', items: ['Pas de droits bénévoles', 'Pas d’accès au staff'] },
    ],
  },
  {
    price: '50€',
    title: ['Entité morale', '(association)'],
    groups: [
      { title: 'Intégrer un réseau structuré', items: ['Accès direct aux acteurs de l’esport en Occitanie', 'Développement de collaborations locales', 'Participation aux réflexions et projets communs'] },
      { title: 'Gagner en visibilité', items: ['Présence sur le site et les supports TEC', 'Relais des événements et actualités'] },
      { title: 'Développer ses projets', items: ['Mise en relation avec bénévoles, prestataires et talents', 'Partage d’expérience entre structures', 'Accompagnement et échanges sur l’organisation événementielle'] },
      { title: 'Accéder à des opportunités', items: ['Participation aux événements collectifs', 'Mutualisation de certaines ressources et contacts'] },
      { title: 'Participer au développement de l’écosystème', items: ['Droit de vote en assemblée générale (1 voix)', 'Participation aux orientations du collectif', 'Contribution au développement de l’esport toulousain et occitan'] },
    ],
  },
];
</script>

<template>
  <section class="max-w-6xl mx-auto px-4 pt-6" aria-labelledby="pricing-title">
    <div class="pricing tec-panel">
      <img :src="publicUrl('/media/tec-bandeau.svg')" alt="" class="pricing__bandeau" aria-hidden="true" />
      <img :src="publicUrl('/media/tec-logo-only-croix.svg')" alt="" class="pricing__croix" aria-hidden="true" />
      <h2 id="pricing-title" class="relative font-bebas text-5xl text-center text-[#141414]">Adhésion</h2>

      <div class="relative mt-6 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        <article v-for="offer in OFFERS" :key="offer.price" class="offer">
          <header class="text-center">
            <p class="font-bebas text-5xl text-brand-red">{{ offer.price }}</p>
            <h3 class="font-bebas text-2xl leading-tight text-[#141414]">{{ offer.title[0] }}<br />{{ offer.title[1] }}</h3>
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
