<script setup lang="ts">
/**
 * Indicateur d'étapes (stepper) accessible.
 * Ligne progressive + numéros/labels ; l'étape courante porte `aria-current="step"`.
 * Les étapes déjà franchies sont cliquables (navigation arrière).
 */
import { computed } from 'vue';

interface Props {
  /** Libellés des étapes */
  steps: string[];
  /** Index de l'étape courante (0-based) */
  currentStep: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{ 'step-click': [index: number] }>();

const progress = computed(() => {
  const last = props.steps.length - 1;
  if (last <= 0) return 100;
  return (props.currentStep / last) * 100;
});

function stateOf(index: number): 'done' | 'current' | 'upcoming' {
  if (index < props.currentStep) return 'done';
  if (index === props.currentStep) return 'current';
  return 'upcoming';
}

function classesOf(index: number): string {
  const state = stateOf(index);
  if (state === 'done') {
    return 'bg-brand-red text-white border-brand-red';
  }
  if (state === 'current') {
    return 'bg-white text-brand-dark border-white glow-red-sm';
  }
  return 'bg-brand-card-bg text-gray-400 border-brand-card-border';
}

/** Les étapes déjà franchies sont navigables (retour arrière). */
function onStepClick(index: number): void {
  if (index < props.currentStep) {
    emit('step-click', index);
  }
}
</script>

<template>
  <nav aria-label="Progression du formulaire">
    <ol class="flex items-start gap-2 sm:gap-4">
      <li
        v-for="(step, index) in steps"
        :key="step"
        class="flex-1 flex flex-col items-center gap-2 min-w-0"
      >
        <div class="w-full flex items-center">
          <div class="h-0.5 flex-1" :class="index === 0 ? 'invisible' : 'bg-brand-card-border'">
            <div
              class="h-full bg-brand-red transition-all duration-500"
              :style="{ width: index <= currentStep ? '100%' : '0%' }"
            ></div>
          </div>
          <button
            type="button"
            class="h-9 w-9 shrink-0 rounded-full border-2 flex items-center justify-center text-sm font-rajdhani font-bold transition-all duration-300"
            :class="classesOf(index)"
            :aria-current="stateOf(index) === 'current' ? 'step' : undefined"
            :aria-label="`Étape ${index + 1} : ${step}`"
            :disabled="stateOf(index) !== 'done'"
            @click="onStepClick(index)"
          >
            <span v-if="stateOf(index) === 'done'" aria-hidden="true">✓</span>
            <span v-else>{{ index + 1 }}</span>
          </button>
          <div
            class="h-0.5 flex-1"
            :class="index === steps.length - 1 ? 'invisible' : 'bg-brand-card-border'"
          >
            <div
              class="h-full bg-brand-red transition-all duration-500"
              :style="{ width: index < currentStep ? '100%' : '0%' }"
            ></div>
          </div>
        </div>
        <p
          class="text-xs text-center leading-tight px-1"
          :class="index <= currentStep ? 'text-white' : 'text-gray-500'"
        >
          {{ step }}
        </p>
      </li>
    </ol>
    <!-- Jauge de progression globale (lecture d'écran) -->
    <p class="sr-only" role="status" aria-live="polite">
      Étape {{ currentStep + 1 }} sur {{ steps.length }} : {{ steps[currentStep] }}
    </p>
    <div class="mt-4 h-1 rounded-full bg-brand-card-border overflow-hidden" aria-hidden="true">
      <div
        class="h-full bg-brand-red transition-all duration-500"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>
  </nav>
</template>
