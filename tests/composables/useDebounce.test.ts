import { effectScope, ref, type Ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import { useDebounce } from '@/composables/useDebounce';

// NB : les `watch` de Vue se déclenchent sur microtask (flush « pre »).
// On utilise donc `advanceTimersByTimeAsync` qui rince les microtasks entre
// chaque tick, sans quoi le `setTimeout` du debounce n'est jamais armé.

describe('useDebounce', () => {
  it('retourne la valeur débouncée après le délai', async () => {
    vi.useFakeTimers();
    const scope = effectScope();
    const source = ref('initial');
    const debounced = scope.run(() => useDebounce(source, 300)) as Ref<string>;
    expect(debounced.value).toBe('initial');
    source.value = 'changed';
    await vi.advanceTimersByTimeAsync(0);
    expect(debounced.value).toBe('initial'); // pas encore
    await vi.advanceTimersByTimeAsync(300);
    expect(debounced.value).toBe('changed');
    scope.stop();
    vi.useRealTimers();
  });

  it('réinitialise le timer à chaque changement (seul le dernier vaut)', async () => {
    vi.useFakeTimers();
    const scope = effectScope();
    const source = ref('a');
    const debounced = scope.run(() => useDebounce(source, 300)) as Ref<string>;
    source.value = 'b';
    await vi.advanceTimersByTimeAsync(200);
    source.value = 'c';
    await vi.advanceTimersByTimeAsync(200);
    expect(debounced.value).toBe('a'); // « b » annulé, « c » pas encore
    await vi.advanceTimersByTimeAsync(100);
    expect(debounced.value).toBe('c');
    scope.stop();
    vi.useRealTimers();
  });

  it('l’arrêt du scope annule le timer en attente', async () => {
    vi.useFakeTimers();
    const scope = effectScope();
    const source = ref('a');
    const debounced = scope.run(() => useDebounce(source, 300)) as Ref<string>;
    source.value = 'b';
    await vi.advanceTimersByTimeAsync(0); // arme le timer
    scope.stop(); // onScopeDispose → clearTimeout
    await vi.advanceTimersByTimeAsync(300);
    expect(debounced.value).toBe('a');
    vi.useRealTimers();
  });
});
