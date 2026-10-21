<script setup lang="ts">
/**
 * Pied de page : logo, liens utiles, coordonnées, newsletter (stub) et mentions légales.
 */
import { ref } from 'vue';

import BaseButton from '@/components/ui/BaseButton.vue';
import { useAppStore } from '@/stores/app';
import { EXTERNAL_LINKS } from '@/utils/constants';

const appStore = useAppStore();
const currentYear = new Date().getFullYear();

const socialLinks = [
  {
    label: 'Discord',
    url: EXTERNAL_LINKS.discord,
    ariaLabel: 'Rejoindre le serveur Discord de TEC',
  },
  {
    label: 'X (Twitter)',
    url: 'https://x.com/toulouseec__',
    ariaLabel: 'Suivre TEC sur X (Twitter)',
  },
  {
    label: 'Instagram',
    url: EXTERNAL_LINKS.instagram,
    ariaLabel: 'Suivre TEC sur Instagram',
  },
];

const footerLinks: { label: string; to: string }[] = [
  { label: 'Accueil', to: '/' },
  { label: 'Associations', to: '/associations' },
  { label: 'Événements', to: '/evenements' },
  { label: 'Actualités', to: '/actualites' },
  { label: 'Qui sommes-nous ?', to: '/qui-sommes-nous' },
  { label: 'Contact', to: '/contact' },
  { label: 'Mentions légales', to: '/mentions-legales' },
];

const newsletterEmail = ref('');

/** Stub newsletter (aucun backend) : valide l'email puis confirme visuellement. */
function subscribeNewsletter(event: Event): void {
  event.preventDefault();
  if (!newsletterEmail.value.includes('@')) {
    appStore.showToast('Merci de saisir une adresse email valide.', 'error');
    return;
  }
  appStore.showToast('Module newsletter à venir — merci de votre intérêt !', 'info');
  newsletterEmail.value = '';
}
</script>

<template>
  <footer class="bg-brand-card-bg text-gray-400 text-sm border-t border-brand-card-border">
    <div class="max-w-6xl mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Colonne 1 : identité + réseaux -->
        <div class="space-y-4">
          <RouterLink
            to="/"
            class="inline-flex items-baseline gap-2"
            aria-label="Toulouse Esport Connect — Accueil"
          >
            <span class="font-bebas text-2xl text-white">TEC</span>
            <span class="font-rajdhani font-bold text-xs tracking-widest text-brand-red-light"
              >Toulouse Esport Connect</span
            >
          </RouterLink>
          <p class="text-xs text-gray-400 leading-relaxed">
            Le collectif associatif de l'esport et du jeu vidéo à Toulouse et en Occitanie.
          </p>
          <ul class="flex flex-wrap gap-3 text-xs">
            <li v-for="social in socialLinks" :key="social.label">
              <a
                :href="social.url"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="social.ariaLabel"
                class="inline-block px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-brand-discord/20 hover:border-brand-discord/40 hover:text-white transition-colors"
              >
                {{ social.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Colonne 2 : liens utiles -->
        <nav aria-label="Liens utiles">
          <h2 class="font-rajdhani font-bold text-white uppercase text-xs tracking-widest mb-4">
            Liens utiles
          </h2>
          <ul class="space-y-2">
            <li v-for="link in footerLinks" :key="link.to">
              <RouterLink :to="link.to" class="hover:text-brand-red-light transition-colors">{{
                link.label
              }}</RouterLink>
            </li>
          </ul>
        </nav>

        <!-- Colonne 3 : contact -->
        <div>
          <h2 class="font-rajdhani font-bold text-white uppercase text-xs tracking-widest mb-4">
            Contact
          </h2>
          <ul class="space-y-2">
            <li>Toulouse (31000), France</li>
            <li>
              <a
                href="mailto:contact@toulouse-esport-connect.fr"
                class="hover:text-brand-red-light transition-colors break-all"
                >contact@toulouse-esport-connect.fr</a
              >
            </li>
            <li>
              <a
                :href="EXTERNAL_LINKS.discord"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-brand-red-light transition-colors"
                >Discord — rejoindre la communauté</a
              >
            </li>
            <li>
              <RouterLink to="/contact" class="hover:text-brand-red-light transition-colors"
                >Écrire via le formulaire de contact</RouterLink
              >
            </li>
          </ul>
        </div>

        <!-- Colonne 4 : newsletter (stub) -->
        <div>
          <h2 class="font-rajdhani font-bold text-white uppercase text-xs tracking-widest mb-4">
            Newsletter
          </h2>
          <p class="text-xs text-gray-400 mb-3">
            Recevez les actualités du réseau (module d'envoi à venir).
          </p>
          <form class="flex flex-col sm:flex-row gap-2" novalidate @submit="subscribeNewsletter">
            <label for="footer-newsletter-email" class="sr-only">Adresse email</label>
            <input
              id="footer-newsletter-email"
              v-model.trim="newsletterEmail"
              type="email"
              name="email"
              autocomplete="email"
              required
              placeholder="votre@email.fr"
              class="min-w-0 flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
            />
            <BaseButton type="submit" variant="primary" size="sm">S'abonner</BaseButton>
          </form>
        </div>
      </div>

      <hr class="border-brand-card-border my-8" />

      <div
        class="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500"
      >
        <p>© {{ currentYear }} TEC — Tous droits réservés</p>
        <div class="flex flex-wrap gap-4">
          <RouterLink to="/mentions-legales" class="hover:text-brand-red-light transition-colors"
            >Mentions légales</RouterLink
          >
          <RouterLink
            to="/mentions-legales#rgpd"
            class="hover:text-brand-red-light transition-colors"
            >Données personnelles</RouterLink
          >
        </div>
      </div>
    </div>
  </footer>
</template>
