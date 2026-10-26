<script setup lang="ts">
/**
 * En-tête de page (maquette 2026) : grand titre centré façon
 * « LES ÉVÉNEMENTS <rouge>TOULOUSAINS</rouge> » + sous-titre et actions.
 * Si `highlight` n'est pas fourni, le dernier mot du titre passe en rouge.
 */
import { computed } from 'vue';

interface Props {
  /** Titre principal (h1 de la page) */
  title: string;
  /** Partie du titre affichée en rouge (défaut : dernier mot) */
  highlight?: string;
  /** Sous-titre court */
  subtitle?: string;
  /** Sur-titre au-dessus du titre (ex. « TEC ») */
  eyebrow?: string;
}
const props = withDefaults(defineProps<Props>(), {
  highlight: undefined,
  subtitle: undefined,
  eyebrow: undefined,
});

const parts = computed(() => {
  const title = props.title.trim();
  const red = props.highlight ?? (title.includes(' ') ? title.slice(title.lastIndexOf(' ') + 1) : '');
  if (!red || !title.endsWith(red)) return { start: title, red: '' };
  return { start: title.slice(0, title.length - red.length), red };
});
</script>

<template>
  <section class="relative">
    <div class="max-w-6xl mx-auto px-4 pt-12 pb-6 md:pt-16 text-center">
      <p v-if="eyebrow" class="mb-2 font-rajdhani text-sm font-bold uppercase tracking-[0.3em] text-brand-red">
        {{ eyebrow }}
      </p>
      <h1 class="section-title text-[clamp(2.4rem,5vw,3.5rem)]!">
        {{ parts.start }}<span v-if="parts.red">{{ parts.red }}</span>
      </h1>
      <p v-if="subtitle" class="mx-auto mt-5 max-w-2xl text-base md:text-lg text-[#333]">
        {{ subtitle }}
      </p>
      <div v-if="$slots.actions" class="mt-8 flex flex-wrap justify-center gap-4">
        <slot name="actions" />
      </div>
    </div>
  </section>
</template>
