<script setup lang="ts">
/**
 * Formulaire de création / modification d'un enregistrement (association,
 * événement, actualité), utilisé par /admin et par la fiche rapide du mode
 * édition. Gère le téléversement d'images (champ fichier PocketBase associé).
 */
import type { RecordModel } from 'pocketbase';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';

import { type CollectionDef, type FieldDef, slugify } from '@/editor/collections';
import { errorMessage, pb } from '@/editor/pb';
import { publicUrl } from '@/utils/paths';

interface Props {
  collection: CollectionDef;
  /** Identifiant PocketBase (modification) */
  recordId?: string;
  /** Ou identifiant d'URL (`slug`) — utilisé depuis le mode édition */
  slug?: string;
}
const props = withDefaults(defineProps<Props>(), { recordId: undefined, slug: undefined });
const emit = defineEmits<{ saved: [RecordModel]; deleted: []; cancel: [] }>();

type FormValue = string | number | boolean;

const record = ref<RecordModel | null>(null);
const form = reactive<Record<string, FormValue>>({});
const files = reactive<Record<string, File | null>>({});
const removeFile = reactive<Record<string, boolean>>({});
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const fieldErrors = reactive<Record<string, string>>({});
const slugTouched = ref(false);

const isNew = computed(() => !record.value);
const titleField = computed(() => props.collection.titleField);

function emptyValue(field: FieldDef): FormValue {
  if (field.type === 'bool') return false;
  if (field.type === 'number') return '';
  return '';
}

function reset(source: RecordModel | null): void {
  for (const field of props.collection.fields) {
    const raw = source?.[field.name];
    if (field.type === 'bool') form[field.name] = raw === true;
    else if (field.type === 'number')
      form[field.name] = typeof raw === 'number' && raw !== 0 ? raw : '';
    else form[field.name] = typeof raw === 'string' ? raw : emptyValue(field);
    if (field.fileField) {
      files[field.fileField] = null;
      removeFile[field.fileField] = false;
    }
  }
  slugTouched.value = Boolean(source);
}

async function load(): Promise<void> {
  error.value = '';
  if (!props.recordId && !props.slug) {
    record.value = null;
    reset(null);
    return;
  }
  loading.value = true;
  try {
    record.value = props.recordId
      ? await pb.collection(props.collection.name).getOne(props.recordId)
      : await pb
          .collection(props.collection.name)
          .getFirstListItem(pb.filter('slug = {:slug}', { slug: props.slug }));
    reset(record.value);
  } catch (caught) {
    error.value = errorMessage(caught);
  } finally {
    loading.value = false;
  }
}

watch(() => [props.collection.name, props.recordId, props.slug], load, { immediate: true });

// Identifiant généré à partir du titre tant qu'il n'a pas été saisi à la main.
watch(
  () => form[titleField.value],
  (title) => {
    if (!slugTouched.value && typeof title === 'string') form.slug = slugify(title);
  }
);

/* ------------------------------------------------------------- images */
const objectUrls = new Map<string, string>();

function previewFor(field: FieldDef): string {
  const fileField = field.fileField;
  if (fileField) {
    const pending = files[fileField];
    if (pending) {
      if (!objectUrls.has(fileField)) objectUrls.set(fileField, URL.createObjectURL(pending));
      return objectUrls.get(fileField) ?? '';
    }
    const stored = record.value?.[fileField];
    if (!removeFile[fileField] && typeof stored === 'string' && stored && record.value) {
      return pb.files.getURL(record.value, stored, { thumb: '400x0' });
    }
  }
  const path = form[field.name];
  return typeof path === 'string' && path ? publicUrl(path) : '';
}

function storedFile(field: FieldDef): string {
  const stored = field.fileField ? record.value?.[field.fileField] : '';
  return typeof stored === 'string' ? stored : '';
}

function onFile(field: FieldDef, event: Event): void {
  if (!field.fileField) return;
  const input = event.target as HTMLInputElement;
  const url = objectUrls.get(field.fileField);
  if (url) URL.revokeObjectURL(url);
  objectUrls.delete(field.fileField);
  files[field.fileField] = input.files?.[0] ?? null;
  removeFile[field.fileField] = false;
}

onBeforeUnmount(() => {
  for (const url of objectUrls.values()) URL.revokeObjectURL(url);
});

/* ---------------------------------------------------------- validation */
function validate(): boolean {
  for (const key of Object.keys(fieldErrors)) delete fieldErrors[key];
  for (const field of props.collection.fields) {
    const value = form[field.name];
    const empty = value === '' || value === undefined;
    if (field.required && empty) fieldErrors[field.name] = 'Champ obligatoire';
    else if (field.type === 'slug' && !empty && !/^[a-z0-9][a-z0-9-]*$/.test(String(value)))
      fieldErrors[field.name] = 'Minuscules, chiffres et tirets uniquement';
    else if (field.type === 'date' && !empty && !/^\d{4}-\d{2}-\d{2}$/.test(String(value)))
      fieldErrors[field.name] = 'Date au format AAAA-MM-JJ';
  }
  return Object.keys(fieldErrors).length === 0;
}

/* ------------------------------------------------------------- actions */
async function save(): Promise<void> {
  if (saving.value || !validate()) return;
  saving.value = true;
  error.value = '';
  try {
    const body = new FormData();
    for (const field of props.collection.fields) {
      const value = form[field.name];
      if (field.type === 'bool') body.append(field.name, value ? 'true' : 'false');
      else body.append(field.name, value === '' ? '' : String(value));
      if (field.fileField) {
        const file = files[field.fileField];
        if (file) body.append(field.fileField, file);
        else if (removeFile[field.fileField]) body.append(field.fileField, '');
      }
    }
    const saved = record.value
      ? await pb.collection(props.collection.name).update(record.value.id, body)
      : await pb.collection(props.collection.name).create(body);
    record.value = saved;
    reset(saved);
    emit('saved', saved);
  } catch (caught) {
    error.value = errorMessage(caught);
  } finally {
    saving.value = false;
  }
}

async function remove(): Promise<void> {
  if (!record.value) return;
  const name = String(record.value[titleField.value] ?? '');
  if (!window.confirm(`Supprimer définitivement « ${name} » ? Cette action est irréversible.`))
    return;
  saving.value = true;
  try {
    await pb.collection(props.collection.name).delete(record.value.id);
    emit('deleted');
  } catch (caught) {
    error.value = errorMessage(caught);
  } finally {
    saving.value = false;
  }
}

function fieldId(field: FieldDef): string {
  return `rf-${props.collection.name}-${field.name}`;
}
</script>

<template>
  <form class="space-y-5" novalidate @submit.prevent="save">
    <p v-if="loading" class="text-sm text-white/60">Chargement…</p>

    <div v-else class="grid gap-4 sm:grid-cols-2">
      <div
        v-for="field in collection.fields"
        :key="field.name"
        :class="{
          'sm:col-span-2': field.wide || field.type === 'textarea' || field.type === 'image',
        }"
      >
        <!-- Case à cocher -->
        <label v-if="field.type === 'bool'" class="flex items-center gap-2 pt-6 text-sm text-white">
          <input
            :id="fieldId(field)"
            v-model="form[field.name]"
            type="checkbox"
            class="h-4 w-4 accent-brand-red"
          />
          {{ field.label }}
        </label>

        <template v-else>
          <label :for="fieldId(field)" class="tec-admin-label">
            {{ field.label }}<span v-if="field.required" class="text-brand-red-light"> *</span>
          </label>

          <textarea
            v-if="field.type === 'textarea'"
            :id="fieldId(field)"
            :value="String(form[field.name] ?? '')"
            class="tec-admin-input"
            @input="form[field.name] = ($event.target as HTMLTextAreaElement).value"
            :rows="field.name === 'content' ? 10 : 4"
          />

          <select
            v-else-if="field.type === 'select'"
            :id="fieldId(field)"
            v-model="form[field.name]"
            class="tec-admin-input"
          >
            <option v-for="option in field.options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>

          <input
            v-else-if="field.type === 'number'"
            :id="fieldId(field)"
            v-model.number="form[field.name]"
            type="number"
            min="0"
            class="tec-admin-input"
          />

          <input
            v-else-if="field.type === 'slug'"
            :id="fieldId(field)"
            v-model="form[field.name]"
            type="text"
            class="tec-admin-input font-mono"
            @input="slugTouched = true"
          />

          <div
            v-else-if="field.type === 'image'"
            class="flex flex-col gap-3 sm:flex-row sm:items-start"
          >
            <div
              class="h-24 w-24 shrink-0 rounded-md bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden"
            >
              <img
                v-if="previewFor(field)"
                :src="previewFor(field)"
                alt=""
                class="max-h-full max-w-full object-contain"
              />
              <span v-else class="text-xs text-white/40">Aucune</span>
            </div>
            <div class="flex-1 space-y-2">
              <label class="tec-admin-btn is-small cursor-pointer">
                Téléverser un fichier
                <input
                  type="file"
                  accept="image/*"
                  class="sr-only"
                  @change="onFile(field, $event)"
                />
              </label>
              <p v-if="field.fileField && files[field.fileField]" class="text-xs text-white/70">
                Nouveau fichier : {{ files[field.fileField]?.name }} (envoyé à l’enregistrement)
              </p>
              <p
                v-else-if="field.fileField && storedFile(field) && !removeFile[field.fileField]"
                class="text-xs text-white/70"
              >
                Fichier en ligne : {{ storedFile(field) }}
                <button
                  type="button"
                  class="ml-2 underline hover:text-brand-red-light"
                  @click="removeFile[field.fileField] = true"
                >
                  retirer
                </button>
              </p>
              <input
                :id="fieldId(field)"
                v-model="form[field.name]"
                type="text"
                class="tec-admin-input"
                placeholder="… ou chemin / URL : /media/logo.png"
              />
            </div>
          </div>

          <input
            v-else
            :id="fieldId(field)"
            v-model="form[field.name]"
            :type="
              field.type === 'date'
                ? 'date'
                : field.type === 'email'
                  ? 'email'
                  : field.type === 'url'
                    ? 'url'
                    : 'text'
            "
            class="tec-admin-input"
          />
        </template>

        <p v-if="fieldErrors[field.name]" class="mt-1 text-xs text-brand-red-light">
          {{ fieldErrors[field.name] }}
        </p>
        <p v-else-if="field.hint" class="mt-1 text-xs text-white/45">{{ field.hint }}</p>
      </div>
    </div>

    <p v-if="error" role="alert" class="tec-admin-errors">{{ error }}</p>

    <div class="flex flex-wrap items-center gap-3 pt-2">
      <button type="submit" class="tec-admin-btn is-primary" :disabled="saving || loading">
        {{ saving ? 'Enregistrement…' : isNew ? `Créer ${collection.singular}` : 'Enregistrer' }}
      </button>
      <button type="button" class="tec-admin-btn" @click="emit('cancel')">Fermer</button>
      <button
        v-if="!isNew"
        type="button"
        class="tec-admin-btn is-danger ml-auto"
        :disabled="saving"
        @click="remove"
      >
        Supprimer
      </button>
    </div>
  </form>
</template>
