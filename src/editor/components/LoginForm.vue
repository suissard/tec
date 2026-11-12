<script setup lang="ts">
/**
 * Formulaire de connexion éditeur (PocketBase), partagé par /admin et le mode
 * édition. Émet `success` une fois connecté.
 */
import { ref } from 'vue';

import { login } from '@/editor/pb';

const emit = defineEmits<{ success: [] }>();

const email = ref('');
const password = ref('');
const pending = ref(false);
const error = ref('');

async function submit(): Promise<void> {
  if (pending.value) return;
  pending.value = true;
  error.value = '';
  try {
    await login(email.value.trim(), password.value);
    password.value = '';
    emit('success');
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Connexion impossible.';
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="submit">
    <div>
      <label for="tec-login-email" class="block mb-1 text-sm font-semibold text-white/80"
        >E-mail</label
      >
      <input
        id="tec-login-email"
        v-model="email"
        type="email"
        autocomplete="username"
        required
        class="tec-admin-input"
      />
    </div>
    <div>
      <label for="tec-login-password" class="block mb-1 text-sm font-semibold text-white/80"
        >Mot de passe</label
      >
      <input
        id="tec-login-password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        required
        class="tec-admin-input"
      />
    </div>
    <p v-if="error" role="alert" class="text-sm text-brand-red-light">{{ error }}</p>
    <button
      type="submit"
      class="tec-admin-btn is-primary w-full"
      :disabled="pending || !email || !password"
    >
      {{ pending ? 'Connexion…' : 'Se connecter' }}
    </button>
  </form>
</template>
