<script setup lang="ts">
/**
 * Pied de page (maquette 2026) : logo + mission, liens rapides, réseaux sociaux,
 * contact, puis barre rouge copyright / mentions légales.
 */
import { content, layout } from '@/utils/content';
import { toLink } from '@/utils/navigation';
import { publicUrl } from '@/utils/paths';

const currentYear = new Date().getFullYear();

/** Textes et liens du pied de page (`layout.footer` de `content.json`). */
const footer = layout.footer;

/** Réseaux sociaux (`site.socials`) — icônes : x, discord, twitch, instagram. */
const socialLinks = content.site.socials;

const quickLinks = footer.quickLinks.map(toLink);
const legalLinks = footer.legalLinks.map(toLink);
</script>

<template>
  <footer class="bg-[#232323] text-white text-sm">
    <div class="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-[1.4fr_auto_1fr_auto] md:divide-x md:divide-white/70">
      <!-- Identité -->
      <div class="flex items-center gap-5 md:pr-8">
        <RouterLink to="/" aria-label="Toulouse Esport Connect — Accueil" class="shrink-0 transition-transform hover:scale-105">
          <img :src="publicUrl('/media/logo-clair.svg')" alt="Toulouse Esport Connect" class="h-16 w-auto" width="120" height="64" loading="lazy" />
        </RouterLink>
        <p class="text-xs leading-relaxed text-white/85 max-w-[220px]">
          {{ footer.mission }}
        </p>
      </div>

      <!-- Liens rapides -->
      <nav aria-label="Liens rapides" class="md:px-8">
        <h2 class="footer-title">{{ footer.quickLinksTitle }}</h2>
        <ul class="space-y-1 text-xs">
          <li v-for="link in quickLinks" :key="link.label">
            <RouterLink :to="link.to" class="text-white/85 hover:text-brand-red-light transition-colors">{{ link.label }}</RouterLink>
          </li>
        </ul>
      </nav>

      <!-- Réseaux -->
      <div class="md:px-8">
        <h2 class="footer-title">{{ footer.socialsTitle }}</h2>
        <ul class="flex gap-3">
          <li v-for="social in socialLinks" :key="social.url">
            <a :href="social.url" target="_blank" rel="noopener noreferrer" :aria-label="social.label" class="social">
              <svg v-if="social.icon === 'x'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" /></svg>
              <svg v-else-if="social.icon === 'discord'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.6 5.3A16.6 16.6 0 0 0 15.5 4l-.5 1a15.4 15.4 0 0 0-6 0l-.5-1a16.6 16.6 0 0 0-4.1 1.3C1.8 9.2 1.1 13 1.4 16.8a16.7 16.7 0 0 0 5 2.5l1.1-1.7a10.8 10.8 0 0 1-1.7-.8l.4-.3a11.9 11.9 0 0 0 11.6 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.7a16.6 16.6 0 0 0 5-2.5c.4-4.4-.7-8.2-3-11.5zM8.5 14.5c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z" /></svg>
              <svg v-else-if="social.icon === 'twitch'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 2 3 6v14h5v3h3l3-3h4l4-4V2H4zm16 13-3 3h-4l-3 3v-3H6V4h14v11zM15 7h2v5h-2zm-5 0h2v5h-2z" /></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
            </a>
          </li>
        </ul>
      </div>

      <!-- Contact -->
      <div class="md:pl-8">
        <h2 class="footer-title">{{ footer.contactTitle }}</h2>
        <a :href="`mailto:${footer.email}`" class="block text-xs text-white/85 hover:text-brand-red-light break-all">
          {{ footer.email }}
        </a>
        <p class="mt-3 font-semibold">{{ footer.location }}</p>
      </div>
    </div>

    <div class="bg-[#9e1c1f]">
      <div class="max-w-6xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <p class="sm:flex-1 sm:text-center">© {{ currentYear }} {{ footer.copyright }}</p>
        <div class="flex gap-3">
          <template v-for="(link, index) in legalLinks" :key="link.label">
            <span v-if="index > 0" aria-hidden="true">|</span>
            <RouterLink :to="link.to" class="hover:underline">{{ link.label }}</RouterLink>
          </template>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-title {
  margin-bottom: 0.9rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.social {
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 9999px;
  background: #fff;
  color: #141414;
  transition:
    transform 0.2s,
    background-color 0.2s,
    color 0.2s;
}
.social svg {
  width: 1.2rem;
  height: 1.2rem;
}
.social:hover {
  background: var(--color-brand-red);
  color: #fff;
  transform: translateY(-3px);
}
</style>
