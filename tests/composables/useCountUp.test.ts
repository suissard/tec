import { effectScope, nextTick, ref, type ComputedRef } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCountUp } from '@/composables/useCountUp';

/** Simule la préférence système `prefers-reduced-motion`. */
function mockReducedMotion(reduce: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce, media: query }));
}

describe('useCountUp', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reste à 0 tant que le déclencheur est faux', () => {
    mockReducedMotion(false);
    const scope = effectScope();
    const values = scope.run(() => useCountUp(() => [30, 200], ref(false))) as ComputedRef<number[]>;
    expect(values.value).toEqual([0, 0]);
    scope.stop();
  });

  it('affiche directement les cibles en mouvement réduit, et suit leurs changements', async () => {
    mockReducedMotion(true);
    const scope = effectScope();
    const trigger = ref(false);
    const target = ref(10);
    const values = scope.run(() => useCountUp(() => [target.value], trigger)) as ComputedRef<number[]>;
    trigger.value = true;
    await nextTick();
    expect(values.value).toEqual([10]);
    target.value = 12; // ex. associations chargées après coup
    expect(values.value).toEqual([12]);
    scope.stop();
  });

  it('compte progressivement jusqu’à la cible', async () => {
    mockReducedMotion(false);
    let now = 0;
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    const scope = effectScope();
    const trigger = ref(false);
    const values = scope.run(() => useCountUp(() => [100], trigger, 1000)) as ComputedRef<number[]>;
    trigger.value = true;
    await nextTick();

    now = 500;
    frames.shift()?.(now);
    expect(values.value[0]).toBeGreaterThan(0);
    expect(values.value[0]).toBeLessThan(100);

    now = 1000;
    frames.shift()?.(now);
    expect(values.value).toEqual([100]);
    scope.stop();
    vi.restoreAllMocks();
  });
});
