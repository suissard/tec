<script setup lang="ts">
/**
 * Fiche détaillée d'une actualité (contenu de la modale globale, size `xl`).
 * Contenu complet (HTML assaini ou texte), métadonnées et partage social.
 */
import { computed } from 'vue';

import { useModal } from '@/composables/useModal';
import { useAppStore } from '@/stores/app';
import { IMAGE_PLACEHOLDER } from '@/utils/constants';
import { formatDateLong } from '@/utils/helpers';
import type { NewsItem } from '@/types';

interface Props {
  /** Actualité détaillée */
  news: NewsItem;
  /** Titre affiché dans l'en-tête de `ModalHost` (prop absorbée) */
  title?: string;
  /** Taille de la modale (pilotée par `ModalHost`, absorbée ici) */
  size?: 'md' | 'xl';
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  size: 'xl',
});

const appStore = useAppStore();
const { close } = useModal();

/** Temps de lecture par défaut (minuterie éditoriale). */
const readTime = computed(() => props.news.readTime ?? 3);

/** Date longue formatée en français. */
const longDate = computed(() => formatDateLong(props.news.date));

/** Image de l'article avec repli sur le placeholder TEC. */
const imageUrl = computed(() => props.news.image ?? IMAGE_PLACEHOLDER);

/** Le contenu est-il du HTML structuré (sinon : texte simple à mettre en prose) ? */
const isHtmlContent = computed(() => /<[a-z][^>]*>/i.test(props.news.content ?? ''));

/**
 * Assainit un contenu HTML avant injection (`v-html`) :
 * balises dangereuses retirées + attributs `on*` / `javascript:` supprimés.
 */
function sanitizeHtml(html: string): string {
  if (typeof document === 'undefined') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc
    .querySelectorAll('script, iframe, object, embed, style, link')
    .forEach((node) => node.remove());
  doc.body.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const isEvent = /^on/i.test(attribute.name);
      const isJsUrl =
        (attribute.name === 'href' || attribute.name === 'src') &&
        /^\s*javascript:/i.test(attribute.value);
      if (isEvent || isJsUrl) element.removeAttribute(attribute.name);
    });
  });
  return doc.body.innerHTML;
}

/** Contenu assaini, prêt pour `v-html` (HTML) — non utilisé pour le texte simple. */
const sanitizedContent = computed(() => sanitizeHtml(props.news.content ?? ''));

/** URL de partage : la page des actualités (aucune route par article). */
function shareUrl(): string {
  // `href` inclut le hash routing (`/tec/#/actualites`) contrairement à
  // `pathname`, qui vaudrait `/tec/` sur GitHub Pages.
  return window.location.href;
}

/** Paramètres d'URL de partage (réseaux sociaux). */
const twitterUrl = computed(
  () =>
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(props.news.title)}&url=${encodeURIComponent(
      shareUrl()
    )}`
);
const facebookUrl = computed(
  () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl())}`
);
const linkedinUrl = computed(
  () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl())}`
);

/** Repli sur le placeholder si le visuel du JSON est introuvable. */
function onImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (img.src !== IMAGE_PLACEHOLDER) {
    img.src = IMAGE_PLACEHOLDER;
  }
}

/** Copie le lien de partage dans le presse-papier (avec repli HTTP). */
async function copyLink(): Promise<void> {
  const url = shareUrl();
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      throw new Error('API Clipboard indisponible');
    }
    appStore.showToast('Lien copié dans le presse-papier !', 'success');
  } catch {
    appStore.showToast('Impossible de copier le lien (presse-papier indisponible).', 'error');
  }
}
</script>

<template>
  <article class="space-y-5">
    <!-- Visuel + catégorie -->
    <div class="relative aspect-video overflow-hidden rounded-2xl">
      <img
        :src="imageUrl"
        :alt="`Illustration : ${news.title}`"
        class="h-full w-full object-cover"
        @error="onImageError"
      />
      <span
        class="absolute left-4 top-4 rounded-full bg-brand-red px-3 py-1 text-[11px] font-rajdhani font-bold uppercase tracking-wider text-white glow-red-sm"
      >
        {{ news.category }}
      </span>
    </div>

    <header>
      <h3 class="font-bebas text-2xl sm:text-3xl text-white leading-tight">{{ news.title }}</h3>
      <p class="mt-2 text-xs text-gray-500">
        <span class="sr-only">Auteur : </span>{{ news.author }}
        <span aria-hidden="true">·</span>
        <time :datetime="news.date">{{ longDate }}</time>
        <span aria-hidden="true">·</span>
        <span class="whitespace-nowrap">⏱ {{ readTime }} min de lecture</span>
      </p>
    </header>

    <!-- Contenu complet -->
    <section aria-label="Contenu de l’article">
      <div
        v-if="isHtmlContent"
        class="tec-article-content text-sm text-gray-300 leading-relaxed [&_a]:text-brand-red-light [&_a]:underline [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_h2]:font-bebas [&_h2]:text-xl [&_h2]:text-white [&_h3]:font-rajdhani [&_h3]:text-base"
        v-html="sanitizedContent"
      ></div>
      <p v-else class="whitespace-pre-line text-sm text-gray-300 leading-relaxed">
        {{ news.content ?? news.excerpt }}
      </p>
    </section>

    <!-- Partage -->
    <section aria-label="Partager cet article" class="border-t border-brand-card-border pt-5">
      <h4 class="font-rajdhani text-sm font-bold uppercase tracking-wider text-gray-300 mb-3">
        Partager
      </h4>
      <div class="flex flex-wrap gap-2">
        <a
          :href="twitterUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-xl border border-brand-card-border bg-white/[0.03] px-4 py-2 text-xs font-rajdhani font-bold uppercase tracking-wider text-gray-200 hover:border-brand-red/60 hover:text-white transition-colors"
          :aria-label="`Partager « ${news.title} » sur X (nouvel onglet)`"
        >
          𝕏 Twitter
        </a>
        <a
          :href="facebookUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-xl border border-brand-card-border bg-white/[0.03] px-4 py-2 text-xs font-rajdhani font-bold uppercase tracking-wider text-gray-200 hover:border-brand-red/60 hover:text-white transition-colors"
          :aria-label="`Partager « ${news.title} » sur Facebook (nouvel onglet)`"
        >
          Facebook
        </a>
        <a
          :href="linkedinUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-xl border border-brand-card-border bg-white/[0.03] px-4 py-2 text-xs font-rajdhani font-bold uppercase tracking-wider text-gray-200 hover:border-brand-red/60 hover:text-white transition-colors"
          :aria-label="`Partager « ${news.title} » sur LinkedIn (nouvel onglet)`"
        >
          LinkedIn
        </a>
        <button
          type="button"
          class="rounded-xl border border-brand-red/50 px-4 py-2 text-xs font-rajdhani font-bold uppercase tracking-wider text-brand-red-light hover:bg-brand-red/10 transition-colors focus-visible:outline-none"
          :aria-label="`Copier le lien de l’article « ${news.title} »`"
          @click="copyLink()"
        >
          Copier le lien
        </button>
      </div>
    </section>

    <div class="flex justify-end border-t border-brand-card-border pt-5">
      <button
        type="button"
        class="rounded-xl border border-brand-card-border px-6 py-2.5 text-sm font-rajdhani font-bold uppercase tracking-wider text-gray-300 hover:text-white hover:border-brand-red/60 transition-colors focus-visible:outline-none"
        @click="close()"
      >
        Fermer
      </button>
    </div>
  </article>
</template>
