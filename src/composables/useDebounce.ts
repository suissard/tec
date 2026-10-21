import { onScopeDispose, ref, watch, type Ref } from 'vue';

/**
 * Retourne une copie décalée (`debounce`) d'une `Ref`.
 * La valeur n'est mise à jour qu'après `delay` ms sans nouveau changement.
 *
 * @param source Référence observée (saisie utilisateur, filtre…)
 * @param delay Délai de silence avant publication, en ms (défaut : `300`)
 * @returns Nouvelle `Ref` publiée avec décalage — le timer est nettoyé au démontage
 * @example
 * const query = ref('');
 * const debounced = useDebounce(query, 300); // filtre à 300 ms de silence
 */
export function useDebounce<T>(source: Ref<T>, delay = 300): Ref<T> {
  const debounced = ref(source.value) as Ref<T>;
  let timer: ReturnType<typeof setTimeout> | undefined;

  watch(source, (value) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      debounced.value = value;
      timer = undefined;
    }, delay);
  });

  onScopeDispose(() => {
    if (timer !== undefined) clearTimeout(timer);
  });

  return debounced;
}
