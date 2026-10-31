<script setup lang="ts">
/**
 * Rend un texte du contenu éditorial (`content.json`) : retours à la ligne
 * (`\n`) et liens Markdown `[libellé](cible)`.
 * - `/chemin` → `RouterLink` (navigation interne) ;
 * - `#ancre`, `mailto:`, `tel:` → lien simple ;
 * - `http(s)://` → nouvel onglet.
 * Aucun HTML n'est interprété : le texte est toujours échappé.
 */
import { computed } from 'vue';

import { parseRichText } from '@/utils/content';

interface Props {
  text: string;
}
const props = defineProps<Props>();

const segments = computed(() => parseRichText(props.text));

const LINK_CLASS = 'underline underline-offset-4 transition-colors hover:text-brand-red-light';

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}
</script>

<template>
  <template v-for="(segment, index) in segments" :key="index">
    <br v-if="segment.type === 'break'" />
    <RouterLink
      v-else-if="segment.type === 'link' && segment.href.startsWith('/')"
      :to="segment.href"
      :class="LINK_CLASS"
      >{{ segment.label }}</RouterLink
    >
    <a
      v-else-if="segment.type === 'link'"
      :href="segment.href"
      :class="LINK_CLASS"
      :target="isExternal(segment.href) ? '_blank' : undefined"
      :rel="isExternal(segment.href) ? 'noopener noreferrer' : undefined"
      >{{ segment.label }}</a
    >
    <template v-else>{{ segment.value }}</template>
  </template>
</template>
