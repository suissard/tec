<script setup lang="ts">
/**
 * Bouton générique TEC : variantes, tailles, état de chargement.
 * Peut se rendre comme `<button>`, `<RouterLink>` (`to`) ou lien externe (`href`).
 * Les classes `$attrs.class` sont fusionnées automatiquement (root unique).
 */
import { computed } from 'vue';
import { RouterLink, type RouteLocationRaw } from 'vue-router';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'discord';
type ButtonSize = 'sm' | 'md' | 'lg';

interface Props {
  /** Variante visuelle du bouton */
  variant?: ButtonVariant;
  /** Taille du bouton */
  size?: ButtonSize;
  /** Affiche un spinner et désactive le bouton */
  loading?: boolean;
  /** Désactive le bouton */
  disabled?: boolean;
  /** Type natif du bouton */
  type?: 'button' | 'submit' | 'reset';
  /** Route interne : rend un `<RouterLink>` au lieu d'un `<button>` */
  to?: RouteLocationRaw;
  /** URL externe : rend un `<a target="_blank" rel="noopener noreferrer">` */
  href?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
  to: undefined,
  href: undefined,
});

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-red text-white hover:bg-brand-red-hover glow-red-sm',
  secondary:
    'bg-brand-card-bg text-white border border-brand-card-border hover:bg-brand-accent hover:border-brand-red/60',
  outline: 'bg-transparent border border-brand-red/60 text-brand-red-light hover:bg-brand-red/10',
  ghost: 'bg-transparent text-gray-300 hover:bg-white/5 hover:text-white',
  danger: 'bg-transparent border border-rose-500/60 text-rose-400 hover:bg-rose-500/10',
  discord: 'bg-brand-discord text-white hover:bg-brand-discord-hover glow-discord',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2 text-xs gap-1.5',
  md: 'px-6 py-2.5 text-sm gap-2',
  lg: 'px-8 py-3.5 text-base gap-2.5',
};

const isDisabled = computed(() => props.disabled || props.loading);
const isLink = computed(() => Boolean(props.to));
const isExternalLink = computed(() => Boolean(props.href));

/** Chemin interne garanti non `undefined` (le rendu est protégé par `v-if`). */
const toPath = computed(() => props.to ?? '');
/** URL externe garantie non `undefined` (le rendu est protégé par `v-if`). */
const hrefUrl = computed(() => props.href ?? '');

const classes = computed(() => [
  'inline-flex items-center justify-center font-rajdhani font-bold uppercase tracking-wider rounded-xl',
  'transition-all duration-200 select-none',
  'focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-brand-dark',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  variantClasses[props.variant],
  sizeClasses[props.size],
]);

/** Empêche la navigation d'un lien désactivé / en chargement. */
function onLinkClick(event: MouseEvent): void {
  if (isDisabled.value) {
    event.preventDefault();
  }
}
</script>

<template>
  <RouterLink
    v-if="isLink"
    :to="toPath"
    :class="classes"
    :aria-disabled="isDisabled || undefined"
    :tabindex="isDisabled ? -1 : undefined"
    @click="onLinkClick"
  >
    <svg
      v-if="loading"
      class="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
    <slot />
  </RouterLink>

  <a
    v-else-if="isExternalLink"
    :href="hrefUrl"
    target="_blank"
    rel="noopener noreferrer"
    :class="classes"
    :aria-disabled="isDisabled || undefined"
    :tabindex="isDisabled ? -1 : undefined"
    @click="onLinkClick"
  >
    <svg
      v-if="loading"
      class="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
    <slot />
  </a>

  <button
    v-else
    :type="type"
    :disabled="isDisabled"
    :aria-disabled="isDisabled || undefined"
    :aria-busy="loading || undefined"
    class="cursor-pointer"
    :class="classes"
  >
    <svg
      v-if="loading"
      class="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
    <slot />
  </button>
</template>
