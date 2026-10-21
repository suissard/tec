<script setup lang="ts">
/**
 * Formulaire de contact : validation locale (champs requis + format email),
 * envoi via le store `forms` et retours accessibles (aria-invalid,
 * aria-describedby sur les erreurs, aria-live sur la confirmation).
 */
import { reactive, ref } from 'vue';

import BaseButton from '@/components/ui/BaseButton.vue';
import { useAppStore } from '@/stores/app';
import { useFormStore } from '@/stores/forms';
import type { ContactFormData } from '@/types';

type ContactFieldErrors = Partial<Record<keyof ContactFormData, string>>;

const appStore = useAppStore();
const formStore = useFormStore();

const formData = reactive<ContactFormData>({ name: '', email: '', subject: '', message: '' });
const errors = reactive<ContactFieldErrors>({});
const submitError = ref('');
const successMessage = ref('');

const inputClasses =
  'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand-red';

/** Validation manuelle (complément des attributs `required` / `type="email"`). */
function validate(): boolean {
  errors.name = formData.name.trim() ? '' : 'Merci d’indiquer votre nom.';
  errors.email = !formData.email.trim()
    ? 'Merci d’indiquer votre adresse email.'
    : formData.email.includes('@')
      ? ''
      : 'L’adresse email doit contenir « @ ».';
  errors.subject = formData.subject.trim() ? '' : 'Merci d’indiquer un sujet.';
  errors.message = formData.message.trim() ? '' : 'Merci de rédiger un message.';

  return !Object.values(errors).some(Boolean);
}

function clearErrors(): void {
  (Object.keys(errors) as (keyof ContactFormData)[]).forEach((key) => {
    delete errors[key];
  });
}

function resetForm(): void {
  formData.name = '';
  formData.email = '';
  formData.subject = '';
  formData.message = '';
  clearErrors();
}

async function submit(): Promise<void> {
  successMessage.value = '';
  submitError.value = '';

  if (!validate()) {
    submitError.value = 'Merci de corriger les champs signalés.';
    return;
  }

  const submitted = await formStore.submitContact({ ...formData });

  if (submitted) {
    successMessage.value = 'Message envoyé ! Nous vous répondrons au plus vite.';
    appStore.showToast('Message envoyé !', 'success');
    resetForm();
    return;
  }

  submitError.value =
    formStore.contactState.error ?? 'Envoi impossible pour le moment. Réessayez plus tard.';
  appStore.showToast(submitError.value, 'error');
}
</script>

<template>
  <form
    class="flex flex-col gap-5"
    novalidate
    aria-label="Formulaire de contact"
    @submit.prevent="submit"
  >
    <div>
      <label for="contact-name" class="block text-xs font-medium text-gray-300 mb-1">
        Votre nom <span class="text-brand-red-light">*</span>
      </label>
      <input
        id="contact-name"
        v-model.trim="formData.name"
        type="text"
        name="name"
        autocomplete="name"
        required
        placeholder="Jean Dupont"
        :class="inputClasses"
        :aria-invalid="errors.name ? 'true' : undefined"
        :aria-describedby="errors.name ? 'contact-name-error' : undefined"
      />
      <p v-if="errors.name" id="contact-name-error" class="mt-1 text-xs text-rose-400" role="alert">
        {{ errors.name }}
      </p>
    </div>

    <div>
      <label for="contact-email" class="block text-xs font-medium text-gray-300 mb-1">
        Adresse email <span class="text-brand-red-light">*</span>
      </label>
      <input
        id="contact-email"
        v-model.trim="formData.email"
        type="email"
        name="email"
        autocomplete="email"
        required
        placeholder="jean.dupont@email.fr"
        :class="inputClasses"
        :aria-invalid="errors.email ? 'true' : undefined"
        :aria-describedby="errors.email ? 'contact-email-error' : undefined"
      />
      <p
        v-if="errors.email"
        id="contact-email-error"
        class="mt-1 text-xs text-rose-400"
        role="alert"
      >
        {{ errors.email }}
      </p>
    </div>

    <div>
      <label for="contact-subject" class="block text-xs font-medium text-gray-300 mb-1">
        Sujet <span class="text-brand-red-light">*</span>
      </label>
      <input
        id="contact-subject"
        v-model.trim="formData.subject"
        type="text"
        name="subject"
        required
        placeholder="Partenariat, question, adhésion…"
        :class="inputClasses"
        :aria-invalid="errors.subject ? 'true' : undefined"
        :aria-describedby="errors.subject ? 'contact-subject-error' : undefined"
      />
      <p
        v-if="errors.subject"
        id="contact-subject-error"
        class="mt-1 text-xs text-rose-400"
        role="alert"
      >
        {{ errors.subject }}
      </p>
    </div>

    <div>
      <label for="contact-message" class="block text-xs font-medium text-gray-300 mb-1">
        Message <span class="text-brand-red-light">*</span>
      </label>
      <textarea
        id="contact-message"
        v-model.trim="formData.message"
        name="message"
        rows="5"
        required
        placeholder="Parlez-nous de votre projet…"
        :class="inputClasses"
        :aria-invalid="errors.message ? 'true' : undefined"
        :aria-describedby="errors.message ? 'contact-message-error' : undefined"
      ></textarea>
      <p
        v-if="errors.message"
        id="contact-message-error"
        class="mt-1 text-xs text-rose-400"
        role="alert"
      >
        {{ errors.message }}
      </p>
    </div>

    <p v-if="submitError" class="text-sm text-rose-400" role="alert">{{ submitError }}</p>

    <p
      v-if="successMessage"
      class="text-sm text-emerald-400"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ successMessage }}
    </p>

    <div class="flex justify-end">
      <BaseButton type="submit" variant="primary" :loading="formStore.contactState.submitting">
        Envoyer le message
      </BaseButton>
    </div>
  </form>
</template>
