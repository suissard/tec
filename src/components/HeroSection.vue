<script setup lang="ts">
/**
 * Section héros des pages TEC : titre, sous-titre et actions (slot).
 * Dégradé d'ambiance + halo rouge discret, responsive mobile-first.
 */
interface Props {
  /** Titre principal (h1 de la page) */
  title: string;
  /** Sous-titre court */
  subtitle?: string;
  /** Sur-titre au-dessus du titre (ex. « TEC ») */
  eyebrow?: string;
}

withDefaults(defineProps<Props>(), {
  subtitle: undefined,
  eyebrow: undefined,
});
</script>

<template>
  <section
    class="relative overflow-hidden border-b border-brand-card-border bg-linear-to-b from-brand-accent/60 via-brand-dark to-brand-dark"
  >
    <!-- Halo décoratif -->
    <div
      class="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-brand-red/15 blur-3xl"
      aria-hidden="true"
    ></div>

    <div class="relative max-w-6xl mx-auto px-4 py-12 md:py-20">
      <p
        v-if="eyebrow"
        class="mb-3 font-rajdhani text-sm font-bold uppercase tracking-[0.3em] text-brand-red-light"
      >
        {{ eyebrow }}
      </p>
      <h1 class="font-bebas text-4xl md:text-5xl lg:text-6xl text-white glow-text">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="mt-4 max-w-2xl text-lg text-gray-400">
        {{ subtitle }}
      </p>
      <div v-if="$slots.actions" class="mt-8 flex flex-wrap gap-4">
        <slot name="actions" />
      </div>
    </div>
  </section>
</template>
