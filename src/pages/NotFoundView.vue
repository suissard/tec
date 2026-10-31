<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue';
import { pages } from '@/utils/content';
import { toLink } from '@/utils/navigation';

const texts = pages.notFound;
const button = toLink(texts.button);
</script>

<template>
  <section class="min-h-[60vh] flex items-center justify-center px-4">
    <div class="text-center glass-card rounded-2xl p-12 max-w-md">
      <h1 class="font-bebas text-6xl text-white mb-4">{{ texts.title }}</h1>
      <p class="text-gray-400 mb-8">{{ texts.text }}</p>
      <BaseButton variant="primary" :to="button.to">{{ button.label }}</BaseButton>
    </div>
  </section>
</template>
