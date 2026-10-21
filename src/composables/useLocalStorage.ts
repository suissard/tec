import { ref, watch, type Ref } from 'vue';

/** Référence réactive persistée, retournée par {@link useLocalStorage}. */
export interface LocalStorageRef<T> {
  /** Valeur réactive persistée dans localStorage */
  value: Ref<T>;
  /** Supprime la clé et réinitialise la valeur par défaut */
  remove: () => void;
}

/** Clone léger de la valeur par défaut (évite de partager une référence mutable). */
function cloneDefault<T>(defaultValue: T): T {
  if (Array.isArray(defaultValue)) return [...defaultValue] as unknown as T;
  if (defaultValue !== null && typeof defaultValue === 'object') {
    return { ...defaultValue };
  }
  return defaultValue;
}

/**
 * Wrapper léger de `localStorage` réactif (persistance d'une valeur sérialisable).
 *
 * - Lit la valeur au montage (repli sur `defaultValue` si absente/corrompue).
 * - Écrit automatiquement à chaque changement (sync, profond).
 * - `remove()` efface la clé sans la réécrire.
 * - Tolère les environnements où `localStorage` est indisponible (mode privé strict).
 *
 * @param key Clé localStorage utilisée
 * @param defaultValue Valeur de repli (absente, corrompue ou stockage indisponible)
 * @returns `{ value, remove }` — `value` est réactive et persistée à chaque changement
 * @example
 * const { value: theme, remove } = useLocalStorage('tec_theme', 'dark');
 * theme.value = 'light'; // écrit dans localStorage
 * remove();               // supprime la clé et restaure 'dark'
 */
export function useLocalStorage<T>(key: string, defaultValue: T): LocalStorageRef<T> {
  let skipWrite = false;

  function read(): T {
    if (typeof window === 'undefined') return cloneDefault(defaultValue);
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return cloneDefault(defaultValue);
      return JSON.parse(raw) as T;
    } catch {
      return cloneDefault(defaultValue);
    }
  }

  const value = ref<T>(read()) as Ref<T>;

  watch(
    value,
    (newValue) => {
      if (skipWrite || typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch {
        // Quota dépassé ou stockage désactivé : on ignore silencieusement
      }
    },
    { deep: true, flush: 'sync' }
  );

  function remove(): void {
    skipWrite = true;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Stockage indisponible : on ignore
      }
    }
    value.value = cloneDefault(defaultValue);
    skipWrite = false;
  }

  return { value, remove };
}
