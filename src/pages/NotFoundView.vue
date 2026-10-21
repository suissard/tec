<script setup lang="ts">
import { useRouter } from 'vue-router';

import BaseButton from '@/components/ui/BaseButton.vue';

const router = useRouter();
</script>

<template>
  <section class="min-h-[60vh] flex items-center justify-center px-4">
    <div class="text-center glass-card rounded-2xl p-12 max-w-md">
      <h1 class="font-bebas text-6xl text-white mb-4">404</h1>
      <p class="text-gray-400 mb-8">Page introuvable</p>
      <BaseButton variant="primary" @click="router.push('/')">Retour à l'accueil</BaseButton>
    </div>
  </section>
</template>
