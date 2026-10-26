<script setup lang="ts">
/**
 * Carte d'événement TEC (maquette 2026) : visuel avec pastille date rouge,
 * titre, date + lieu, bouton « Voir l'événement » qui émet `open`.
 */
import { computed } from 'vue';

import { resolveEventStatus } from '@/utils/helpers';
import type { EventItem, EventStatus } from '@/types';

interface Props {
  /** Événement affiché */
  event: EventItem;
}

const props = defineProps<Props>();
const emit = defineEmits<{ open: [] }>();

const MONTHS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];

const status = computed<EventStatus>(() => resolveEventStatus(props.event));
const STATUS_LABEL: Partial<Record<EventStatus, string>> = {
  full: 'Complet',
  cancelled: 'Annulé',
  past: 'Terminé',
};

const day = computed(() => props.event.date.slice(8, 10));
const month = computed(() => MONTHS[Number(props.event.date.slice(5, 7)) - 1] ?? '');
const longDate = computed(() =>
  new Date(props.event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
);
</script>

<template>
  <article class="event-card" :class="{ 'opacity-70': status === 'cancelled' || status === 'past' }">
    <div class="event-card__media">
      <img v-if="event.image" :src="event.image" alt="" class="h-full w-full object-cover" loading="lazy" />
      <div class="event-card__date" aria-hidden="true">
        <span class="text-2xl leading-none">{{ day }}</span>
        <span class="text-xs">{{ month }}</span>
      </div>
      <span v-if="STATUS_LABEL[status]" class="event-card__status">{{ STATUS_LABEL[status] }}</span>
    </div>
    <div class="p-4">
      <h3 class="font-bebas text-2xl text-[#141414] truncate" :title="event.title">{{ event.title }}</h3>
      <div class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#333]">
        <span class="inline-flex items-center gap-1.5">
          <svg class="h-4 w-4 text-brand-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
          <time :datetime="event.date">{{ longDate }}</time>
        </span>
        <span class="inline-flex items-center gap-1.5">
          <svg class="h-4 w-4 text-brand-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
          {{ event.location ?? 'Toulouse' }}
        </span>
      </div>
      <button type="button" class="btn-red btn-sm mt-4" :aria-label="`Voir l'événement ${event.title}`" @click="emit('open')">
        Voir l’événement
      </button>
    </div>
  </article>
</template>

<style scoped>
.event-card {
  background: rgba(255, 255, 255, 0.55);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.25s,
    box-shadow 0.25s;
}
.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
}
.event-card__media {
  position: relative;
  height: 130px;
  background: linear-gradient(135deg, #1b2236, #0e1322);
}
.event-card__date {
  position: absolute;
  top: 0;
  left: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 10px;
  background: var(--color-brand-red);
  color: #fff;
  font-family: var(--font-bebas);
}
.event-card__status {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}
</style>
