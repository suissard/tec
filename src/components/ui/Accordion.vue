<script setup lang="ts">
/**
 * Accordéon accessible : ouverture unique ou multiple, hauteur animée
 * (grid-template-rows 0fr → 1fr, sans mesure JS).
 */
import { computed, ref } from 'vue';

/** Entrée d'un accordéon (bouton + contenu). */
export interface AccordionItem {
  /** Identifiant technique (repli sur l'index si absent) */
  id?: string;
  /** Titre de la section (bouton) */
  title: string;
  /** Contenu textuel (slot `content` en fallback visuel) */
  content?: string;
}

interface Props {
  items: AccordionItem[];
  /** Un seul panneau ouvert à la fois. Défaut : false */
  single?: boolean;
  /** Index des panneaux ouverts au montage */
  defaultOpen?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  single: false,
  defaultOpen: () => [],
});

const openIndexes = ref<number[]>([...props.defaultOpen]);

const groupId = computed(() => `accordion-${Math.random().toString(36).slice(2, 8)}`);

function isOpen(index: number): boolean {
  return openIndexes.value.includes(index);
}

function toggle(index: number): void {
  if (props.single) {
    openIndexes.value = isOpen(index) ? [] : [index];
    return;
  }
  openIndexes.value = isOpen(index)
    ? openIndexes.value.filter((open) => open !== index)
    : [...openIndexes.value, index];
}

function itemId(index: number): string {
  return props.items[index]?.id ?? `${groupId.value}-${index}`;
}
</script>

<template>
  <div
    class="divide-y divide-brand-card-border rounded-2xl border border-brand-card-border overflow-hidden"
  >
    <section v-for="(item, index) in items" :key="itemId(index)" class="bg-white/[0.02]">
      <h3>
        <button
          type="button"
          class="w-full flex items-center justify-between gap-4 text-left px-4 sm:px-5 py-4 text-sm sm:text-base text-gray-100 hover:bg-white/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-red"
          :aria-expanded="isOpen(index)"
          :aria-controls="`${itemId(index)}-panel`"
          :id="`${itemId(index)}-button`"
          @click="toggle(index)"
        >
          <span class="font-medium">{{ item.title }}</span>
          <span
            class="shrink-0 text-brand-red-light transition-transform duration-300"
            :class="isOpen(index) ? 'rotate-45' : ''"
            aria-hidden="true"
          >
            +
          </span>
        </button>
      </h3>
      <div
        :id="`${itemId(index)}-panel`"
        role="region"
        :aria-labelledby="`${itemId(index)}-button`"
        class="grid transition-[grid-template-rows] duration-300 ease-out"
        :class="isOpen(index) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
      >
        <div class="overflow-hidden">
          <div class="px-4 sm:px-5 pb-5 text-sm text-gray-400 leading-relaxed whitespace-pre-line">
            <slot name="content" :item="item" :index="index">
              {{ item.content }}
            </slot>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
