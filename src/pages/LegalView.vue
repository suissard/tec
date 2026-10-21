<script setup lang="ts">
/**
 * Page Mentions légales — statut de l'association, RGPD, cookies et CGU.
 * Sommaire latéral collant avec scrollspy (IntersectionObserver) et bouton
 * d'impression ; ancres `#rgpd` / `#cookies` référencées depuis le pied de page.
 */
import { onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';

import HeroSection from '@/components/HeroSection.vue';
import BaseButton from '@/components/ui/BaseButton.vue';
import CookiePreferencesPanel from '@/components/ui/CookiePreferencesPanel.vue';
import { useIntersectionObserver } from '@/composables/useIntersectionObserver';
import { useModal } from '@/composables/useModal';
import { useAppStore } from '@/stores/app';
import { useDataStore } from '@/stores/data';

/** Section de la page (ancre du sommaire). */
interface LegalSection {
  /** Id de la section (cible de l'ancre) */
  id: string;
  /** Libellé du lien de sommaire */
  label: string;
}

const SECTIONS: LegalSection[] = [
  { id: 'mentions', label: 'Mentions légales' },
  { id: 'rgpd', label: 'Protection des données (RGPD)' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'cgu', label: 'Conditions d’utilisation' },
];

/** Ligne du tableau des cookies (nom, finalité, durée, type). */
interface CookieRow {
  name: string;
  purpose: string;
  duration: string;
  type: string;
}

const COOKIE_ROWS: CookieRow[] = [
  {
    name: 'posthog',
    purpose: 'Mesure d’audience anonymisée (statistiques de navigation)',
    duration: '13 mois',
    type: 'Tiers',
  },
  {
    name: 'tec_cookie_consent',
    purpose: 'Mémorisation de votre choix de consentement',
    duration: '1 an',
    type: 'Nécessaire',
  },
  {
    name: 'tec_volunteer_draft',
    purpose: 'Brouillon du formulaire de candidature bénévole',
    duration: 'Session',
    type: 'Fonctionnel',
  },
  {
    name: 'tec_adhesions / tec_volunteers / tec_contacts',
    purpose: 'Enregistrement local des formulaires envoyés',
    duration: '1 an',
    type: 'Fonctionnel',
  },
];

const dataStore = useDataStore();
const appStore = useAppStore();
const { open } = useModal();

const pageTitle = 'Mentions légales';
const pageDescription =
  "Statut de l'association, hébergement, cookies et traitement des données personnelles de Toulouse Esport Connect.";

/* ------------------------------------------------------------------ scrollspy */
/** Éléments DOM des 4 sections (un ref par section, index aligné sur SECTIONS). */
const sectionEls = SECTIONS.map(() => ref<HTMLElement | null>(null));

/** Section actuellement soulignée dans le sommaire. */
const activeSection = ref<string>(SECTIONS[0].id);

/**
 * Observers de scrollspy : une instance par section, sur une bande de lecture
 * dans le tiers supérieur de l'écran (`rootMargin -66%` en bas).
 * `threshold: 0` : une section plus haute que la bande ne pourrait jamais
 * atteindre un seuil élevé — on retient donc la première intersection.
 */
const sectionObservers = SECTIONS.map((_section, index) =>
  useIntersectionObserver(sectionEls[index], {
    threshold: 0,
    rootMargin: '-100px 0px -66% 0px',
  })
);

sectionObservers.forEach((observer, index) => {
  watch(observer.isIntersecting, (isIntersecting) => {
    if (isIntersecting) {
      activeSection.value = SECTIONS[index].id;
    }
  });
});

/** Callbacks de ref stables (identité préservée entre deux rendus). */
const sectionRefCallbacks = SECTIONS.map(
  (_section, index) =>
    (el: Element | ComponentPublicInstance | null): void => {
      sectionEls[index].value = (el as HTMLElement | null) ?? null;
    }
);

/** Ouvre le panneau de préférences cookies dans la modale globale. */
function openCookiePreferences(): void {
  open(CookiePreferencesPanel, { title: 'Préférences cookies' });
}

/** Imprime la page via le dialogue d'impression du navigateur. */
function printPage(): void {
  window.print();
}

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

onBeforeUnmount(() => {
  sectionObservers.forEach((observer) => observer.stop());
});
</script>

<template>
  <div>
    <HeroSection :title="pageTitle" :subtitle="pageDescription" eyebrow="Informations" />

    <div class="max-w-6xl mx-auto px-4 py-10 md:py-14">
      <div class="flex flex-col gap-8 lg:flex-row-reverse">
        <!-- Sommaire -->
        <aside class="lg:w-64 lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Sommaire des mentions légales">
            <p
              class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light"
            >
              Sommaire
            </p>
            <ul class="mt-3 space-y-2">
              <li v-for="section in SECTIONS" :key="section.id">
                <a
                  :href="`#${section.id}`"
                  class="nav-link block border-l-2 pl-3 text-sm transition-colors"
                  :class="
                    activeSection === section.id
                      ? 'active border-brand-red text-brand-red-light font-medium'
                      : 'border-brand-card-border text-gray-400 hover:border-gray-500 hover:text-white'
                  "
                  :aria-current="activeSection === section.id ? 'true' : undefined"
                >
                  {{ section.label }}
                </a>
              </li>
            </ul>
            <div class="mt-6 border-t border-brand-card-border pt-4">
              <BaseButton variant="ghost" size="sm" @click="printPage">
                Imprimer cette page
              </BaseButton>
            </div>
          </nav>
        </aside>

        <!-- Contenu -->
        <div class="min-w-0 flex-1 space-y-8">
          <!-- Mentions légales -->
          <section
            id="mentions"
            :ref="sectionRefCallbacks[0]"
            aria-labelledby="legal-mentions"
            class="glass-card scroll-mt-28 rounded-2xl p-6 md:p-8"
          >
            <h2 id="legal-mentions" class="font-bebas text-2xl md:text-3xl text-white">
              Mentions légales
            </h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="sm:flex sm:gap-4">
                <dt class="sm:w-48 shrink-0 text-gray-500">Éditeur</dt>
                <dd class="text-gray-200">
                  Toulouse Esport Connect (TEC), association régie par la loi du 1er juillet 1901
                </dd>
              </div>
              <div class="sm:flex sm:gap-4">
                <dt class="sm:w-48 shrink-0 text-gray-500">RNA</dt>
                <dd class="text-gray-200">W313041561</dd>
              </div>
              <div class="sm:flex sm:gap-4">
                <dt class="sm:w-48 shrink-0 text-gray-500">SIRET</dt>
                <dd class="text-gray-200">999 816 069 00010</dd>
              </div>
              <div class="sm:flex sm:gap-4">
                <dt class="sm:w-48 shrink-0 text-gray-500">Siège social</dt>
                <dd class="text-gray-200">
                  10 route de Bordé Neuve, 31570 Sainte-Foy-d’Aigrefeuille
                </dd>
              </div>
              <div class="sm:flex sm:gap-4">
                <dt class="sm:w-48 shrink-0 text-gray-500">Directeur de publication</dt>
                <dd class="text-gray-200">Julien Paltou</dd>
              </div>
              <div class="sm:flex sm:gap-4">
                <dt class="sm:w-48 shrink-0 text-gray-500">Hébergeur</dt>
                <dd class="text-gray-200">À compléter</dd>
              </div>
            </dl>

            <h3 class="mt-6 font-bebas text-xl text-white">Propriété intellectuelle</h3>
            <p class="mt-2 text-sm leading-relaxed text-gray-400">
              L’ensemble des contenus du site (textes, visuels, logos, charte graphique) est la
              propriété de Toulouse Esport Connect ou de ses partenaires. Toute reproduction,
              représentation ou diffusion, totale ou partielle, sans autorisation écrite préalable
              est interdite. Les marques et logos cités restent la propriété de leurs détenteurs
              respectifs.
            </p>
          </section>

          <!-- RGPD -->
          <section
            id="rgpd"
            :ref="sectionRefCallbacks[1]"
            aria-labelledby="legal-rgpd"
            class="glass-card scroll-mt-28 rounded-2xl p-6 md:p-8"
          >
            <h2 id="legal-rgpd" class="font-bebas text-2xl md:text-3xl text-white">
              Protection des données (RGPD)
            </h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="sm:flex sm:gap-4">
                <dt class="sm:w-48 shrink-0 text-gray-500">Responsable de traitement</dt>
                <dd class="text-gray-200">Toulouse Esport Connect</dd>
              </div>
              <div class="sm:flex sm:gap-4">
                <dt class="sm:w-48 shrink-0 text-gray-500">Finalités</dt>
                <dd class="text-gray-200">
                  Gestion des adhésions, des candidatures bénévoles, des demandes de contact et de
                  la vie du réseau
                </dd>
              </div>
              <div class="sm:flex sm:gap-4">
                <dt class="sm:w-48 shrink-0 text-gray-500">Base légale</dt>
                <dd class="text-gray-200">
                  Consentement, exécution d’un contrat et intérêt légitime de l’association
                </dd>
              </div>
              <div class="sm:flex sm:gap-4">
                <dt class="sm:w-48 shrink-0 text-gray-500">Destinataires</dt>
                <dd class="text-gray-200">
                  Bureau de l’association uniquement — aucune cession à des tiers
                </dd>
              </div>
              <div class="sm:flex sm:gap-4">
                <dt class="sm:w-48 shrink-0 text-gray-500">Durée de conservation</dt>
                <dd class="text-gray-200">
                  3 ans à compter du dernier contact, sauf obligation légale contraire
                </dd>
              </div>
              <div class="sm:flex sm:gap-4">
                <dt class="sm:w-48 shrink-0 text-gray-500">
                  Délégataire à la protection des données
                </dt>
                <dd class="text-gray-200">
                  Julien Paltou —
                  <a
                    href="mailto:contact@tec-asso.fr"
                    class="underline underline-offset-4 transition-colors hover:text-brand-red-light"
                    >contact@tec-asso.fr</a
                  >
                </dd>
              </div>
            </dl>

            <h3 class="mt-6 font-bebas text-xl text-white">Vos droits</h3>
            <p class="mt-2 text-sm leading-relaxed text-gray-400">
              Vous disposez d’un droit d’accès, de rectification, d’effacement, d’opposition, de
              portabilité et de limitation du traitement des données vous concernant. Pour les
              exercer, écrivez à
              <a
                href="mailto:contact@tec-asso.fr"
                class="underline underline-offset-4 transition-colors hover:text-brand-red-light"
                >contact@tec-asso.fr</a
              >
              en précisant l’objet de votre demande. Vous pouvez également saisir la CNIL si vous
              estimez que vos droits ne sont pas respectés. Le détail des traceurs utilisés figure
              dans la section
              <a
                href="#cookies"
                class="underline underline-offset-4 transition-colors hover:text-brand-red-light"
                >Cookies</a
              >.
            </p>
          </section>

          <!-- Cookies -->
          <section
            id="cookies"
            :ref="sectionRefCallbacks[2]"
            aria-labelledby="legal-cookies"
            class="glass-card scroll-mt-28 rounded-2xl p-6 md:p-8"
          >
            <h2 id="legal-cookies" class="font-bebas text-2xl md:text-3xl text-white">Cookies</h2>
            <p class="mt-3 text-sm leading-relaxed text-gray-400">
              Ce site dépose uniquement les cookies nécessaires à son fonctionnement, sauf si vous
              acceptez la mesure d’audience. Vous pouvez modifier votre choix à tout moment.
            </p>

            <div class="mt-4 overflow-x-auto">
              <table class="w-full min-w-[36rem] text-left text-sm">
                <caption class="sr-only">
                  Cookies déposés par le site TEC
                </caption>
                <thead>
                  <tr class="border-b border-brand-card-border text-xs uppercase tracking-wider">
                    <th scope="col" class="py-2 pr-4 font-medium text-gray-500">Nom</th>
                    <th scope="col" class="py-2 pr-4 font-medium text-gray-500">Finalité</th>
                    <th scope="col" class="py-2 pr-4 font-medium text-gray-500">Durée</th>
                    <th scope="col" class="py-2 font-medium text-gray-500">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="cookie in COOKIE_ROWS"
                    :key="cookie.name"
                    class="border-b border-brand-card-border/60 last:border-b-0"
                  >
                    <td class="py-3 pr-4 font-mono text-xs text-gray-200">{{ cookie.name }}</td>
                    <td class="py-3 pr-4 text-gray-400">{{ cookie.purpose }}</td>
                    <td class="py-3 pr-4 text-gray-400">{{ cookie.duration }}</td>
                    <td class="py-3 text-gray-400">{{ cookie.type }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-5 flex flex-wrap items-center gap-4">
              <BaseButton variant="outline" size="sm" @click="openCookiePreferences">
                Gérer mes préférences
              </BaseButton>
              <p class="text-xs text-gray-500">
                Les cookies nécessaires ne peuvent pas être désactivés.
              </p>
            </div>
          </section>

          <!-- CGU -->
          <section
            id="cgu"
            :ref="sectionRefCallbacks[3]"
            aria-labelledby="legal-cgu"
            class="glass-card scroll-mt-28 rounded-2xl p-6 md:p-8"
          >
            <h2 id="legal-cgu" class="font-bebas text-2xl md:text-3xl text-white">
              Conditions d’utilisation
            </h2>

            <h3 class="mt-5 font-bebas text-xl text-white">Services proposés</h3>
            <p class="mt-2 text-sm leading-relaxed text-gray-400">
              Le site TEC présente le réseau, ses associations membres, ses événements et ses
              actualités, et permet l’adhésion en ligne ainsi que la candidature bénévole. L’accès
              au site est gratuit, hors coûts de connexion.
            </p>

            <h3 class="mt-5 font-bebas text-xl text-white">Responsabilités</h3>
            <p class="mt-2 text-sm leading-relaxed text-gray-400">
              Toulouse Esport Connect s’efforce d’assurer l’exactitude et la mise à jour des
              informations publiées, sans garantir l’absence d’erreur ni la disponibilité permanente
              du site. L’utilisateur reste responsable de l’usage qu’il fait des informations
              consultées et des données transmises via les formulaires.
            </p>

            <h3 class="mt-5 font-bebas text-xl text-white">Liens externes</h3>
            <p class="mt-2 text-sm leading-relaxed text-gray-400">
              Les liens vers des sites tiers sont fournis à titre informatif. TEC n’exerce aucun
              contrôle sur leur contenu et décline toute responsabilité quant à leur contenu ou à
              leurs pratiques.
            </p>

            <h3 class="mt-5 font-bebas text-xl text-white">Droit applicable et juridiction</h3>
            <p class="mt-2 text-sm leading-relaxed text-gray-400">
              Les présentes conditions sont régies par le droit français. À défaut de résolution
              amiable, tout litige relève de la compétence des tribunaux de Toulouse.
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
