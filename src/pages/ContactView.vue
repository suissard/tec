<script setup lang="ts">
/**
 * Page Contact — coordonnées du siège social, carte OpenStreetMap,
 * formulaire de contact et foire aux questions (FAQ).
 */
import { onMounted } from 'vue';

import ContactForm from '@/components/forms/ContactForm.vue';
import HeroSection from '@/components/HeroSection.vue';
import Accordion, { type AccordionItem } from '@/components/ui/Accordion.vue';
import { useAppStore } from '@/stores/app';
import { useDataStore } from '@/stores/data';

const dataStore = useDataStore();
const appStore = useAppStore();

const pageTitle = 'Nous contacter';
const pageDescription =
  'Une question, un partenariat ou une envie de bénévolat ? Le bureau de TEC vous répond sous 48 h.';

/** Coordonnée affichée dans le bloc « Nos coordonnées ». */
interface ContactInfo {
  /** Libellé (terme du dictionnaire <dl>) */
  term: string;
  /** Valeur affichée */
  value: string;
  /** Lien scheme (`mailto:`, `tel:`…) — absent pour les informations simples */
  href?: string;
}

/** Coordonnées du siège social. */
const CONTACT_INFO: ContactInfo[] = [
  { term: 'Adresse', value: '10 route de Bordé Neuve, 31570 Sainte-Foy-d’Aigrefeuille' },
  { term: 'Email', value: 'contact@tec-asso.fr', href: 'mailto:contact@tec-asso.fr' },
  { term: 'Téléphone', value: '06 XX XX XX XX', href: 'tel:06XXXXXXXX' },
  { term: 'Horaires', value: 'Lun-Ven 9h-18h' },
];

/** Intégration OpenStreetMap (bbox autour de Toulouse, marqueur sur le siège). */
const MAP_SRC =
  'https://www.openstreetmap.org/export/embed.html?bbox=1.2,43.5,1.5,43.7&layer=mapnik&marker=43.6,1.35';

/** Lien d'ouverture de la carte dans un nouvel onglet. */
const MAP_LINK = 'https://www.openstreetmap.org/?mlat=43.6&mlon=1.35#map=12/43.6/1.35';

/** Questions fréquentes. */
const faqItems: AccordionItem[] = [
  {
    id: 'faq-benevolat',
    title: 'Comment devenir bénévole ?',
    content:
      'Rendez-vous sur la page « Devenir bénévole » et remplissez le formulaire en 4 étapes. Nous vous recontacterons sous 48h.',
  },
  {
    id: 'faq-adhesion',
    title: 'Combien coûte l’adhésion ?',
    content:
      'L’adhésion est de 1 €/an pour un membre individuel (bénévole), 5 €/an pour un membre sympathisant et 50 €/an pour une entité morale (association).',
  },
  {
    id: 'faq-evenement',
    title: 'Puis-je proposer un événement ?',
    content: 'Oui ! Connectez-vous à votre espace association ou contactez-nous via le formulaire.',
  },
  {
    id: 'faq-association',
    title: 'Comment contacter une association ?',
    content:
      'Chaque fiche association affiche ses coordonnées (email, Discord, site web) dans la modale de détail.',
  },
  {
    id: 'faq-rgpd',
    title: 'Mes données sont-elles protégées ?',
    content: 'Oui, nous respectons le RGPD. Consultez nos mentions légales pour plus de détails.',
  },
  {
    id: 'faq-local',
    title: 'Y a-t-il un local physique ?',
    content:
      'Notre siège social est au 10 route de Bordé Neuve, 31570 Sainte-Foy-d’Aigrefeuille. Nous n’avons pas de local d’accueil public.',
  },
];

onMounted(async () => {
  appStore.setLoading(true);
  try {
    await dataStore.loadAll();
    if (dataStore.error) {
      appStore.showToast('Erreur chargement données', 'error');
    }
  } catch {
    appStore.showToast('Erreur chargement données', 'error');
  } finally {
    appStore.setLoading(false);
  }
});
</script>

<template>
  <div>
    <HeroSection :title="pageTitle" :subtitle="pageDescription" eyebrow="Contact" />

    <!-- Coordonnées + formulaire -->
    <section class="max-w-6xl mx-auto px-4 py-10 md:py-14" aria-labelledby="contact-infos">
      <div class="grid gap-8 lg:grid-cols-2">
        <!-- Coordonnées -->
        <div class="glass-card rounded-2xl p-6 md:p-8">
          <p
            class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light"
          >
            Nos coordonnées
          </p>
          <h2 id="contact-infos" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
            Où nous trouver
          </h2>

          <dl class="mt-6 space-y-4">
            <div v-for="item in CONTACT_INFO" :key="item.term">
              <dt class="text-xs font-medium uppercase tracking-wider text-gray-500">
                {{ item.term }}
              </dt>
              <dd class="mt-0.5 text-sm text-gray-200">
                <a
                  v-if="item.href"
                  :href="item.href"
                  class="underline underline-offset-4 transition-colors hover:text-brand-red-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red rounded"
                >
                  {{ item.value }}
                </a>
                <span v-else>{{ item.value }}</span>
              </dd>
            </div>
          </dl>

          <div class="mt-6 overflow-hidden rounded-xl border border-brand-card-border">
            <iframe
              :src="MAP_SRC"
              title="Carte du siège de Toulouse Esport Connect — Sainte-Foy-d’Aigrefeuille"
              class="h-72 w-full border-0"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <p class="mt-2 text-xs text-gray-500">
            Siège social de l’association —
            <a
              :href="MAP_LINK"
              target="_blank"
              rel="noopener noreferrer"
              class="underline underline-offset-4 transition-colors hover:text-brand-red-light"
            >
              ouvrir dans OpenStreetMap
            </a>
          </p>
        </div>

        <!-- Formulaire -->
        <div class="glass-card rounded-2xl p-6 md:p-8">
          <p
            class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light"
          >
            Écrivez-nous
          </p>
          <h2 id="contact-form" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
            Votre message
          </h2>
          <p class="mt-3 text-sm text-gray-400">
            Réponse du bureau sous 48 h ouvrées. Les champs marqués d’un astérisque sont requis.
          </p>
          <div class="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="max-w-6xl mx-auto px-4 py-10 md:py-14" aria-labelledby="contact-faq">
      <p class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light">
        Foire aux questions
      </p>
      <h2 id="contact-faq" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
        Questions fréquentes
      </h2>
      <div class="mt-6">
        <Accordion :items="faqItems" />
      </div>
    </section>
  </div>
</template>
