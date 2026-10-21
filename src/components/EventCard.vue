<script setup lang="ts">
/**
 * Carte d'événement TEC : badge de statut, date, lieu, catégorie et jauge
 * de places. Un clic ouvre la fiche détaillée (modale) via `open`.
 */
import { computed } from 'vue';

import { resolveEventStatus, formatDateShort, formatDateLong } from '@/utils/helpers';
import type { EventItem, EventStatus } from '@/types';

interface Props {
  /** Événement affiché */
  event: EventItem;
}

const props = defineProps<Props>();
const emit = defineEmits<{ open: [] }>();

const status = computed<EventStatus>(() => resolveEventStatus(props.event));

const STATUS_META: Record<EventStatus, { label: string; classes: string }> = {
  open: {
    label: 'Inscriptions ouvertes',
    classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  },
  full: { label: 'Complet', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/40' },
  cancelled: { label: 'Annulé', classes: 'bg-rose-500/15 text-rose-400 border-rose-500/40' },
  past: { label: 'Terminé', classes: 'bg-white/10 text-gray-400 border-white/20' },
};

const statusMeta = computed(() => STATUS_META[status.value]);

/** Badge date : fond rouge ou blanc selon le JSON (défaut rouge). */
const badgeClasses = computed(() =>
  props.event.badgeColor === 'white'
    ? 'bg-white text-brand-dark'
    : 'bg-brand-red text-white glow-red-sm'
);

/** Jauge de places renseignée uniquement si les compteurs existent. */
const hasGauge = computed(
  () =>
    typeof props.event.maxParticipants === 'number' &&
    props.event.maxParticipants > 0 &&
    typeof props.event.currentParticipants === 'number'
);

const gaugePercent = computed(() => {
  if (!hasGauge.value) return 0;
  const max = props.event.maxParticipants ?? 1;
  const current = props.event.currentParticipants ?? 0;
  return Math.min(100, Math.round((current / max) * 100));
});

/** Date affichée sur le badge latéral. */
const badgeDate = computed(() => formatDateShort(props.event.date));
/** Date complète (accessible). */
const fullDate = computed(() =>
  props.event.endDate
    ? `Du ${formatDateLong(props.event.date)} au ${formatDateLong(props.event.endDate)}`
    : formatDateLong(props.event.date)
);
</script>

<template>
  <article class="glass-card rounded-2xl p-5 flex gap-4 h-full text-left">
    <!-- Badge date -->
    <div
      class="shrink-0 self-start rounded-xl px-3 py-2 text-center font-rajdhani font-bold leading-none"
      :class="badgeClasses"
    >
      <span class="block text-lg">{{ badgeDate }}</span>
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <span
          class="rounded-full border px-2 py-0.5 text-[11px] font-medium"
          :class="statusMeta.classes"
        >
          {{ statusMeta.label }}
        </span>
        <span class="text-[11px] uppercase tracking-wider text-gray-500">
          {{ event.category }}
        </span>
      </div>

      <h3 class="mt-2 font-bebas text-xl text-white leading-tight">{{ event.title }}</h3>

      <p class="mt-1 text-xs text-gray-400"><span class="sr-only">Date : </span>🗓 {{ fullDate }}</p>
      <p v-if="event.location" class="mt-0.5 text-xs text-gray-400">
        <span class="sr-only">Lieu : </span>📍 {{ event.location }}
      </p>
      <p class="mt-0.5 text-xs text-gray-400">
        <span class="sr-only">Organisé par : </span>🎯 {{ event.organizer }}
      </p>

      <!-- Jauge de places -->
      <div v-if="hasGauge" class="mt-3">
        <div class="h-1.5 rounded-full bg-white/10 overflow-hidden" role="presentation">
          <div
            class="h-full rounded-full bg-brand-red transition-all duration-500"
            :class="gaugePercent >= 100 ? 'bg-amber-500' : ''"
            :style="{ width: `${gaugePercent}%` }"
          ></div>
        </div>
        <p class="mt-1 text-[11px] text-gray-500">
          {{ event.currentParticipants }} / {{ event.maxParticipants }} participants
        </p>
      </div>

      <p class="mt-3 text-sm text-gray-400 line-clamp-2">{{ event.description }}</p>

      <button
        type="button"
        class="mt-4 rounded-xl border border-brand-red/50 px-4 py-1.5 text-xs font-rajdhani font-bold uppercase tracking-wider text-brand-red-light transition-colors hover:bg-brand-red/10 focus-visible:outline-none"
        :aria-label="`Voir le détail de ${event.title}`"
        @click="emit('open')"
      >
        Voir le détail
      </button>
    </div>
  </article>
</template>
