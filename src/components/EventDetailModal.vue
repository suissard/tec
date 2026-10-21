<script setup lang="ts">
/**
 * Fiche détaillée d'un événement (contenu de la modale globale, size `xl`).
 * Statut, dates, lieu, jauge de places et inscription externe.
 */
import { computed } from 'vue';

import { useModal } from '@/composables/useModal';
import { IMAGE_PLACEHOLDER } from '@/utils/constants';
import { formatDateLong, resolveEventStatus } from '@/utils/helpers';
import type { EventItem, EventStatus } from '@/types';

interface Props {
  /** Événement détaillé */
  event: EventItem;
  /** Titre affiché dans l'en-tête de `ModalHost` (prop absorbée) */
  title?: string;
  /** Taille de la modale (pilotée par `ModalHost`, absorbée ici) */
  size?: 'md' | 'xl';
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  size: 'xl',
});

const { close } = useModal();

const STATUS_META: Record<EventStatus, { label: string; classes: string }> = {
  open: {
    label: 'Inscriptions ouvertes',
    classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  },
  full: { label: 'Complet', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/40' },
  cancelled: { label: 'Annulé', classes: 'bg-rose-500/15 text-rose-400 border-rose-500/40' },
  past: { label: 'Terminé', classes: 'bg-white/10 text-gray-400 border-white/20' },
};

const status = computed<EventStatus>(() => resolveEventStatus(props.event));
const statusMeta = computed(() => STATUS_META[status.value]);

/** Image de couverture avec repli sur le placeholder TEC. */
const imageUrl = computed(() => props.event.image ?? IMAGE_PLACEHOLDER);

/** Date (ou période) complète de l'événement. */
const dateLabel = computed(() =>
  props.event.endDate
    ? `Du ${formatDateLong(props.event.date)} au ${formatDateLong(props.event.endDate)}`
    : formatDateLong(props.event.date)
);

/** Durée en jours (mémorisée entre les dates de début et de fin). */
const durationLabel = computed(() => {
  if (!props.event.endDate) return '';
  const start = new Date(props.event.date).getTime();
  const end = new Date(props.event.endDate).getTime();
  const days = Math.round((end - start) / 86_400_000) + 1;
  return days > 1 ? `${days} jours` : '1 jour';
});

/** Places restantes — `null` si la jauge n'est pas renseignée. */
const remainingSeats = computed<number | null>(() => {
  const { maxParticipants, currentParticipants } = props.event;
  if (typeof maxParticipants !== 'number' || typeof currentParticipants !== 'number') {
    return null;
  }
  return Math.max(0, maxParticipants - currentParticipants);
});

/** URL d'inscription (repli sur `url` de l'événement). */
const registrationUrl = computed(() => props.event.registrationUrl ?? props.event.url ?? '');

/** L'inscription est ouverte : lien renseigné, places disponibles, événement actif. */
const canRegister = computed(
  () =>
    registrationUrl.value.length > 0 &&
    status.value !== 'cancelled' &&
    status.value !== 'past' &&
    (remainingSeats.value === null || remainingSeats.value > 0)
);

/** Repli sur le placeholder si le visuel du JSON est introuvable. */
function onImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (img.src !== IMAGE_PLACEHOLDER) {
    img.src = IMAGE_PLACEHOLDER;
  }
}

/** Ouvre le formulaire d'inscription externe dans un nouvel onglet. */
function register(): void {
  if (!canRegister.value) return;
  window.open(registrationUrl.value, '_blank', 'noopener,noreferrer');
}
</script>

<template>
  <div class="space-y-5">
    <!-- Visuel + badge statut -->
    <div class="relative aspect-video overflow-hidden rounded-2xl">
      <img
        :src="imageUrl"
        :alt="`Visuel : ${event.title}`"
        class="h-full w-full object-cover"
        @error="onImageError"
      />
      <span
        class="absolute left-4 top-4 rounded-full border px-3 py-1 text-[11px] font-rajdhani font-bold uppercase tracking-wider backdrop-blur-sm"
        :class="statusMeta.classes"
      >
        {{ statusMeta.label }}
      </span>
    </div>

    <div>
      <h3 class="font-bebas text-2xl sm:text-3xl text-white leading-tight">{{ event.title }}</h3>
      <p class="mt-1 text-xs uppercase tracking-wider text-brand-red-light">
        {{ event.category }}
      </p>
    </div>

    <!-- Informations pratiques -->
    <dl class="grid gap-3 sm:grid-cols-2">
      <div class="rounded-xl border border-brand-card-border bg-white/[0.03] p-4">
        <dt class="text-[11px] uppercase tracking-wider text-gray-500">Date</dt>
        <dd class="mt-1 text-sm text-gray-100">
          🗓 {{ dateLabel }}
          <span v-if="durationLabel" class="block text-xs text-gray-400">
            Durée : {{ durationLabel }}
          </span>
        </dd>
      </div>
      <div class="rounded-xl border border-brand-card-border bg-white/[0.03] p-4">
        <dt class="text-[11px] uppercase tracking-wider text-gray-500">Lieu</dt>
        <dd class="mt-1 text-sm text-gray-100">
          📍 {{ event.location ?? 'Toulouse et alentours' }}
        </dd>
      </div>
      <div class="rounded-xl border border-brand-card-border bg-white/[0.03] p-4">
        <dt class="text-[11px] uppercase tracking-wider text-gray-500">Organisateur</dt>
        <dd class="mt-1 text-sm text-gray-100">🎯 {{ event.organizer }}</dd>
      </div>
      <div class="rounded-xl border border-brand-card-border bg-white/[0.03] p-4">
        <dt class="text-[11px] uppercase tracking-wider text-gray-500">Places</dt>
        <dd class="mt-1 text-sm text-gray-100">
          <template v-if="remainingSeats !== null">
            {{ event.currentParticipants }} / {{ event.maxParticipants }} inscrits
            <span class="block text-xs text-gray-400">
              {{ remainingSeats > 0 ? `${remainingSeats} place(s) restante(s)` : 'Plus de places' }}
            </span>
          </template>
          <template v-else>Jauge non limitée</template>
        </dd>
      </div>
    </dl>

    <!-- Description -->
    <section aria-label="Description de l’événement">
      <h4 class="font-rajdhani text-sm font-bold uppercase tracking-wider text-gray-300">
        Au programme
      </h4>
      <p class="mt-2 text-sm text-gray-400 leading-relaxed">{{ event.description }}</p>
    </section>

    <!-- Actions -->
    <div class="flex flex-wrap gap-3 border-t border-brand-card-border pt-5">
      <button
        v-if="canRegister"
        type="button"
        class="inline-flex items-center justify-center rounded-xl bg-brand-red px-6 py-2.5 text-sm font-rajdhani font-bold uppercase tracking-wider text-white glow-red-sm hover:bg-brand-red-hover transition-colors focus-visible:outline-none"
        :aria-label="`S’inscrire à ${event.title} (nouvel onglet)`"
        @click="register()"
      >
        S’inscrire
      </button>
      <RouterLink
        v-else
        to="/contact"
        class="inline-flex items-center justify-center rounded-xl border border-brand-red/60 px-6 py-2.5 text-sm font-rajdhani font-bold uppercase tracking-wider text-brand-red-light hover:bg-brand-red/10 transition-colors focus-visible:outline-none"
        @click="close()"
      >
        Demander des infos
      </RouterLink>
      <button
        type="button"
        class="rounded-xl border border-brand-card-border px-6 py-2.5 text-sm font-rajdhani font-bold uppercase tracking-wider text-gray-300 hover:text-white hover:border-brand-red/60 transition-colors focus-visible:outline-none"
        @click="close()"
      >
        Fermer
      </button>
    </div>
  </div>
</template>
