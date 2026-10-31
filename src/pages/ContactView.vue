<script setup lang="ts">
/**
 * Page Contact — coordonnées du siège social, carte OpenStreetMap,
 * formulaire de contact et foire aux questions (FAQ).
 */
import { onMounted } from 'vue';

import ContactForm from '@/components/forms/ContactForm.vue';
import HeroSection from '@/components/HeroSection.vue';
import Accordion, { type AccordionItem } from '@/components/ui/Accordion.vue';
import { useAppStore } from '@/stores/app';
import { useDataStore } from '@/stores/data';
import { pages } from '@/utils/content';

const dataStore = useDataStore();
const appStore = useAppStore();

/** Textes de la page (`pages.contact` de `content.json`) : coordonnées, carte, FAQ. */
const texts = pages.contact;
const CONTACT_INFO = texts.details.items;
const MAP = texts.details.map;
const faqItems: AccordionItem[] = texts.faq.items;

onMounted(async () => {
  appStore.setLoading(true);
  try {
    await dataStore.loadAll();
    if (dataStore.error) {
      appStore.showToast('Erreur chargement données', 'error');
    }
  } catch {
    appStore.showToast('Erreur chargement données', 'error');
  } finally {
    appStore.setLoading(false);
  }
});
</script>

<template>
  <div>
    <HeroSection v-bind="texts.hero" />

    <!-- Coordonnées + formulaire -->
    <section class="max-w-6xl mx-auto px-4 py-10 md:py-14" aria-labelledby="contact-infos">
      <div class="grid gap-8 lg:grid-cols-2">
        <!-- Coordonnées -->
        <div class="glass-card rounded-2xl p-6 md:p-8">
          <p
            class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light"
          >
            {{ texts.details.eyebrow }}
          </p>
          <h2 id="contact-infos" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
            {{ texts.details.title }}
          </h2>

          <dl class="mt-6 space-y-4">
            <div v-for="item in CONTACT_INFO" :key="item.term">
              <dt class="text-xs font-medium uppercase tracking-wider text-gray-500">
                {{ item.term }}
              </dt>
              <dd class="mt-0.5 text-sm text-gray-200">
                <a
                  v-if="item.href"
                  :href="item.href"
                  class="underline underline-offset-4 transition-colors hover:text-brand-red-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red rounded"
                >
                  {{ item.value }}
                </a>
                <span v-else>{{ item.value }}</span>
              </dd>
            </div>
          </dl>

          <div class="mt-6 overflow-hidden rounded-xl border border-brand-card-border">
            <iframe
              :src="MAP.embedUrl"
              :title="MAP.title"
              class="h-72 w-full border-0"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <p class="mt-2 text-xs text-gray-500">
            {{ MAP.caption }}
            <a
              :href="MAP.linkUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="underline underline-offset-4 transition-colors hover:text-brand-red-light"
            >
              {{ MAP.linkLabel }}
            </a>
          </p>
        </div>

        <!-- Formulaire -->
        <div class="glass-card rounded-2xl p-6 md:p-8">
          <p
            class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light"
          >
            {{ texts.form.eyebrow }}
          </p>
          <h2 id="contact-form" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
            {{ texts.form.title }}
          </h2>
          <p class="mt-3 text-sm text-gray-400">
            {{ texts.form.text }}
          </p>
          <div class="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="max-w-6xl mx-auto px-4 py-10 md:py-14" aria-labelledby="contact-faq">
      <p class="font-rajdhani text-xs font-bold uppercase tracking-[0.25em] text-brand-red-light">
        {{ texts.faq.eyebrow }}
      </p>
      <h2 id="contact-faq" class="mt-1 font-bebas text-3xl md:text-4xl text-white">
        {{ texts.faq.title }}
      </h2>
      <div class="mt-6">
        <Accordion :items="faqItems" />
      </div>
    </section>
  </div>
</template>
