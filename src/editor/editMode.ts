/**
 * Activation du mode édition (léger : importé par `App.vue`, sans SDK).
 *
 * - `?edit` dans l'URL (ex. `/?edit`, `/contact?edit`, ou `/#/?edit` en hash
 *   routing) active le mode ;
 * - il reste actif pendant la navigation (sessionStorage) jusqu'au clic sur
 *   « Quitter » dans la barre d'édition, ou `?edit=0`.
 */
import { reactive } from 'vue';
import type { LocationQuery } from 'vue-router';

const STORAGE_KEY = 'tec:edit-mode';

export const editMode = reactive({
  /** Mode édition demandé (la barre d'outils est affichée) */
  active: false,
});

function readStorage(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeStorage(value: boolean): void {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, '1');
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // stockage indisponible (navigation privée) : le mode reste actif jusqu'au rechargement
  }
}

/** Valeur du paramètre `edit` (query du routeur, ou partie « search » avant le `#`). */
function readEditParam(query: LocationQuery): string | null | undefined {
  if ('edit' in query) {
    const value = query.edit;
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
  const search = new URLSearchParams(window.location.search);
  return search.has('edit') ? search.get('edit') : undefined;
}

/**
 * Met à jour l'état du mode édition selon l'URL courante.
 *
 * @param query Query de la route courante
 */
export function syncEditModeFromUrl(query: LocationQuery): void {
  const param = readEditParam(query);
  if (param === undefined) {
    editMode.active = editMode.active || readStorage();
    return;
  }
  const enabled = !['0', 'false', 'off', 'non'].includes(String(param).toLowerCase());
  editMode.active = enabled;
  writeStorage(enabled);
}

/** Quitte le mode édition (et retire `?edit` de l'URL sans recharger). */
export function exitEditMode(): void {
  editMode.active = false;
  writeStorage(false);
  const url = new URL(window.location.href);
  if (url.searchParams.has('edit')) {
    url.searchParams.delete('edit');
    window.history.replaceState(window.history.state, '', url.toString());
  }
}
