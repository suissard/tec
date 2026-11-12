<script setup lang="ts">
/**
 * Éditeur récursif d'un nœud du contenu éditorial (`content`), identifié par
 * son chemin (`pages.home.hero`). Les modifications sont appliquées en direct
 * au contenu réactif : la page se met à jour pendant la saisie.
 *
 * - objet  → groupe repliable de champs ;
 * - liste  → éléments réordonnables (↑ ↓), duplicables et supprimables ;
 * - texte  → champ simple / zone multiligne / liste déroulante / image ;
 * - nombre, booléen → champ adapté.
 */
import { computed, nextTick, ref, watch } from 'vue';

import { uploadMedia, errorMessage } from '@/editor/pb';
import { editorFocus, isOnFocusedBranch } from '@/editor/focus';
import {
  isImageField,
  isLongField,
  isRichField,
  labelFor,
  optionsFor,
  summarize,
} from '@/editor/labels';
import { getContentValue, setContentValue } from '@/utils/content';
import { publicUrl } from '@/utils/paths';

defineOptions({ name: 'ContentNode' });

interface Props {
  /** Chemin du nœud dans `content` */
  path: string;
  /** Profondeur (0 = racine affichée) */
  depth?: number;
  /** Libellé imposé (défaut : déduit de la clé) */
  label?: string;
}
const props = withDefaults(defineProps<Props>(), { depth: 0, label: undefined });

const value = computed(() => getContentValue(props.path));
const key = computed(() => props.path.split('.').pop() ?? '');
const title = computed(() => props.label ?? labelFor(key.value));

const kind = computed(() => {
  const current = value.value;
  if (Array.isArray(current)) return 'array';
  if (current !== null && typeof current === 'object') return 'object';
  if (typeof current === 'number') return 'number';
  if (typeof current === 'boolean') return 'boolean';
  return 'string';
});

/** Les éléments de liste affichent un résumé à côté de leur numéro. */
const summary = computed(() => (/^\d+$/.test(key.value) ? summarize(value.value) : ''));

const entries = computed(() =>
  kind.value === 'object' ? Object.keys(value.value as Record<string, unknown>) : []
);
const items = computed(() => (kind.value === 'array' ? (value.value as unknown[]) : []));

/* ------------------------------------------------------------- repli */
const open = ref(props.depth === 0 || isOnFocusedBranch(props.path));
watch(
  () => editorFocus.token,
  () => {
    if (isOnFocusedBranch(props.path)) open.value = true;
  }
);

/* ----------------------------------------------------------- feuilles */
const fieldRef = ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const isFocused = computed(() => editorFocus.paths.includes(props.path));

watch(
  () => editorFocus.token,
  async () => {
    if (!isFocused.value) return;
    await nextTick();
    wrapperRef.value?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (editorFocus.paths.length === 1) fieldRef.value?.focus({ preventScroll: true });
  }
);

const stringValue = computed(() => (typeof value.value === 'string' ? value.value : ''));
const options = computed(() => optionsFor(props.path));
const isImage = computed(() => isImageField(props.path));
const isLong = computed(() => isLongField(props.path, stringValue.value));
const isRich = computed(() => isRichField(props.path));

function update(next: unknown): void {
  setContentValue(props.path, next);
}

function onText(event: Event): void {
  update((event.target as HTMLInputElement).value);
}

function onNumber(event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  update(raw === '' ? 0 : Number(raw));
}

/* -------------------------------------------------------------- listes */
function moveItem(index: number, delta: number): void {
  const list = value.value as unknown[];
  const target = index + delta;
  if (target < 0 || target >= list.length) return;
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
}

function removeItem(index: number): void {
  const list = value.value as unknown[];
  if (!window.confirm('Supprimer cet élément ?')) return;
  list.splice(index, 1);
}

function duplicateItem(index: number): void {
  const list = value.value as unknown[];
  list.splice(index + 1, 0, JSON.parse(JSON.stringify(list[index])));
}

/* ------------------------------------------------------------- images */
const uploading = ref(false);
const uploadError = ref('');

async function onUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  uploading.value = true;
  uploadError.value = '';
  try {
    update(await uploadMedia(file));
  } catch (error) {
    uploadError.value = errorMessage(error);
  } finally {
    uploading.value = false;
    input.value = '';
  }
}

const fieldId = computed(() => `cf-${props.path.replace(/\./g, '-')}`);
</script>

<template>
  <!-- Objet : groupe repliable -->
  <div v-if="kind === 'object'" class="tec-cn-group" :class="{ 'is-root': depth === 0 }">
    <button
      v-if="depth > 0"
      type="button"
      class="tec-cn-toggle"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="tec-cn-caret" :class="{ 'is-open': open }" aria-hidden="true">▸</span>
      <span>{{ title }}</span>
      <span v-if="summary" class="tec-cn-summary">{{ summary }}</span>
    </button>
    <div
      v-show="open"
      class="tec-cn-children"
      :class="{ 'pl-3 border-l border-white/10 ml-1.5': depth > 0 }"
    >
      <ContentNode
        v-for="child in entries"
        :key="`${path}.${child}`"
        :path="`${path}.${child}`"
        :depth="depth + 1"
      />
    </div>
  </div>

  <!-- Liste -->
  <div v-else-if="kind === 'array'" class="tec-cn-group">
    <button type="button" class="tec-cn-toggle" :aria-expanded="open" @click="open = !open">
      <span class="tec-cn-caret" :class="{ 'is-open': open }" aria-hidden="true">▸</span>
      <span>{{ title }}</span>
      <span class="tec-cn-summary">{{ items.length }} élément(s)</span>
    </button>
    <div v-show="open" class="pl-3 border-l border-white/10 ml-1.5 space-y-2">
      <div v-for="(_, index) in items" :key="index" class="tec-cn-item">
        <div class="tec-cn-item-tools">
          <button type="button" title="Monter" :disabled="index === 0" @click="moveItem(index, -1)">
            ↑
          </button>
          <button
            type="button"
            title="Descendre"
            :disabled="index === items.length - 1"
            @click="moveItem(index, 1)"
          >
            ↓
          </button>
          <button type="button" title="Dupliquer" @click="duplicateItem(index)">⧉</button>
          <button type="button" title="Supprimer" class="is-danger" @click="removeItem(index)">
            ✕
          </button>
        </div>
        <ContentNode :path="`${path}.${index}`" :depth="depth + 1" />
      </div>
      <p v-if="items.length === 0" class="text-xs text-white/50">Liste vide.</p>
      <button
        v-if="items.length > 0"
        type="button"
        class="tec-cn-add"
        @click="duplicateItem(items.length - 1)"
      >
        + Ajouter (copie du dernier élément)
      </button>
    </div>
  </div>

  <!-- Booléen -->
  <label
    v-else-if="kind === 'boolean'"
    ref="wrapperRef"
    class="tec-cn-field flex items-center gap-2"
    :class="{ 'is-focused': isFocused }"
    :data-content-path="path"
  >
    <input
      ref="fieldRef"
      type="checkbox"
      class="accent-brand-red h-4 w-4"
      :checked="value === true"
      @change="update(($event.target as HTMLInputElement).checked)"
    />
    <span class="tec-cn-label mb-0!">{{ title }}</span>
  </label>

  <!-- Nombre / texte -->
  <div
    v-else
    ref="wrapperRef"
    class="tec-cn-field"
    :class="{ 'is-focused': isFocused }"
    :data-content-path="path"
  >
    <label :for="fieldId" class="tec-cn-label">
      {{ title }}
      <span v-if="summary && summary !== stringValue" class="tec-cn-summary">{{ summary }}</span>
    </label>

    <input
      v-if="kind === 'number'"
      :id="fieldId"
      ref="fieldRef"
      type="number"
      class="tec-cn-input"
      :value="value as number"
      @input="onNumber"
    />

    <select
      v-else-if="options"
      :id="fieldId"
      ref="fieldRef"
      class="tec-cn-input"
      :value="stringValue"
      @change="onText"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <textarea
      v-else-if="isLong"
      :id="fieldId"
      ref="fieldRef"
      class="tec-cn-input min-h-[5.5rem]"
      rows="3"
      :value="stringValue"
      @input="onText"
    />

    <input
      v-else
      :id="fieldId"
      ref="fieldRef"
      type="text"
      class="tec-cn-input"
      :value="stringValue"
      @input="onText"
    />

    <p v-if="isRich" class="tec-cn-hint">
      Lien : <code>[texte](/page)</code> · retour à la ligne : Entrée
    </p>

    <div v-if="isImage" class="mt-2 flex items-center gap-3">
      <img
        v-if="stringValue"
        :src="publicUrl(stringValue)"
        alt=""
        class="h-12 w-12 rounded object-contain bg-white/10"
      />
      <label class="tec-cn-add cursor-pointer">
        {{ uploading ? 'Envoi…' : 'Téléverser une image' }}
        <input
          type="file"
          accept="image/*"
          class="sr-only"
          :disabled="uploading"
          @change="onUpload"
        />
      </label>
      <span v-if="uploadError" class="text-xs text-brand-red-light">{{ uploadError }}</span>
    </div>
  </div>
</template>

<style scoped>
.tec-cn-group + .tec-cn-group,
.tec-cn-group + .tec-cn-field,
.tec-cn-field + .tec-cn-group,
.tec-cn-field + .tec-cn-field {
  margin-top: 0.6rem;
}
.tec-cn-toggle {
  display: flex;
  width: 100%;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0.25rem 0;
  font-weight: 600;
  font-size: 0.85rem;
  color: #fff;
  text-align: left;
  cursor: pointer;
}
.tec-cn-toggle:hover {
  color: var(--color-brand-red-light);
}
.tec-cn-caret {
  display: inline-block;
  width: 0.8rem;
  transition: transform 150ms;
  color: var(--color-brand-red-light);
}
.tec-cn-caret.is-open {
  transform: rotate(90deg);
}
.tec-cn-summary {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
  font-size: 0.75rem;
  color: rgb(255 255 255 / 0.5);
}
.tec-cn-children {
  padding-top: 0.25rem;
}
.tec-cn-item {
  display: flow-root;
  padding: 0.5rem 0.6rem 0.6rem;
  border-radius: 6px;
  background: rgb(255 255 255 / 0.04);
}
.tec-cn-item-tools {
  float: right;
  display: flex;
  gap: 0.2rem;
  margin-left: 0.5rem;
}
.tec-cn-item-tools button {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: rgb(255 255 255 / 0.7);
  background: rgb(255 255 255 / 0.06);
  cursor: pointer;
}
.tec-cn-item-tools button:hover:not(:disabled) {
  background: rgb(255 255 255 / 0.16);
  color: #fff;
}
.tec-cn-item-tools button:disabled {
  opacity: 0.3;
  cursor: default;
}
.tec-cn-item-tools button.is-danger:hover {
  background: var(--color-brand-red);
}
.tec-cn-field {
  border-radius: 6px;
  transition:
    box-shadow 300ms,
    background 300ms;
}
.tec-cn-field.is-focused {
  box-shadow: 0 0 0 2px var(--color-brand-red);
  background: rgb(227 6 19 / 0.08);
  padding: 0.35rem;
}
.tec-cn-label {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(255 255 255 / 0.75);
}
.tec-cn-input {
  width: 100%;
  border-radius: 6px;
  border: 1px solid var(--color-brand-card-border);
  background: var(--color-brand-dark);
  padding: 0.45rem 0.6rem;
  font-size: 0.85rem;
  color: #fff;
}
.tec-cn-input:focus {
  outline: none;
  border-color: var(--color-brand-red);
  box-shadow: 0 0 0 2px rgb(227 6 19 / 0.25);
}
.tec-cn-hint {
  margin-top: 0.2rem;
  font-size: 0.7rem;
  color: rgb(255 255 255 / 0.45);
}
.tec-cn-hint code {
  color: rgb(255 255 255 / 0.7);
}
.tec-cn-add {
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  border: 1px dashed rgb(255 255 255 / 0.25);
  padding: 0.3rem 0.7rem;
  font-size: 0.75rem;
  color: rgb(255 255 255 / 0.8);
  cursor: pointer;
}
.tec-cn-add:hover {
  border-color: var(--color-brand-red-light);
  color: #fff;
}
</style>
