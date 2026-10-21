import { defineComponent, h, type Ref } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useIntersectionObserver,
  type IntersectionObserverController,
} from '@/composables/useIntersectionObserver';

/** Observateur factocé capturant callback / appels pour les assertions. */
interface FakeObserver {
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  callback: IntersectionObserverCallback | null;
}

function stubObserver(): FakeObserver {
  const fake: FakeObserver = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    callback: null,
  };
  vi.stubGlobal(
    'IntersectionObserver',
    // NB : une « function » (et non une arrow) est requise pour être constructible avec `new`.
    vi.fn().mockImplementation(function (
      this: unknown,
      callback: IntersectionObserverCallback
    ) {
      fake.callback = callback;
      return {
        observe: fake.observe,
        unobserve: fake.unobserve,
        disconnect: fake.disconnect,
      };
    })
  );
  return fake;
}

/** Monte un hôte minimal exerçant le composable dans un vrai cycle de vie. */
function mountHost(
  target: Ref<Element | null> | null,
  options: Parameters<typeof useIntersectionObserver>[1]
): { controller: IntersectionObserverController; wrapper: ReturnType<typeof mount> } {
  let controller: IntersectionObserverController | undefined;
  const Host = defineComponent({
    setup() {
      controller = useIntersectionObserver(target, options);
      return () => h('div');
    },
  });
  const wrapper = mount(Host);
  if (!controller) throw new Error('Le composable n’a pas été initialisé.');
  return { controller, wrapper };
}

describe('useIntersectionObserver', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('observe / unobserve pilotent l’IntersectionObserver natif', () => {
    const fake = stubObserver();
    const { controller, wrapper } = mountHost(null, { threshold: 0.5 });
    const element = document.createElement('div');

    controller.observe(element);
    expect(fake.observe).toHaveBeenCalledWith(element);

    controller.unobserve(element);
    expect(fake.unobserve).toHaveBeenCalledWith(element);
    expect(controller.isIntersecting.value).toBe(false);

    controller.stop();
    expect(fake.disconnect).toHaveBeenCalled();
    wrapper.unmount();
  });

  it('met à jour isIntersecting selon les entrées reçues', () => {
    const fake = stubObserver();
    const { controller } = mountHost(null, { threshold: 0.5 });
    // L'observer est créé lazily : il faut observer un élément réel d'abord.
    controller.observe(document.createElement('div'));
    expect(fake.callback).not.toBeNull();

    const notify = (isIntersecting: boolean): void => {
      fake.callback?.([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
    };
    notify(true);
    expect(controller.isIntersecting.value).toBe(true);
    notify(false);
    expect(controller.isIntersecting.value).toBe(false);
  });

  it('observe la cible au montage et start() permet un démarrage différé', () => {
    const fake = stubObserver();
    const element = document.createElement('img');
    const target = { value: element } as Ref<Element | null>;

    // immediate: false → rien au montage
    const deferred = mountHost(target, { immediate: false });
    expect(fake.observe).not.toHaveBeenCalled();
    deferred.controller.start();
    expect(fake.observe).toHaveBeenCalledWith(element);

    // immediate (défaut) → observation au montage
    const immediate = mountHost(target, {});
    expect(fake.observe).toHaveBeenCalledTimes(2);
    expect(fake.observe).toHaveBeenLastCalledWith(element);
    immediate.wrapper.unmount();
  });

  it('ignore les éléments nuls et un environnement sans IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { controller } = mountHost(null, {});
    expect(() => controller.observe(document.createElement('div'))).not.toThrow();
    expect(() => controller.unobserve(document.createElement('div'))).not.toThrow();
    expect(() => controller.stop()).not.toThrow();
    expect(controller.isIntersecting.value).toBe(false);
  });

  it('le démontage du composant déconnecte l’observer', () => {
    const fake = stubObserver();
    const element = document.createElement('div');
    const target = { value: element } as Ref<Element | null>;
    const { wrapper } = mountHost(target, {});
    expect(fake.observe).toHaveBeenCalledWith(element); // observé au montage
    wrapper.unmount();
    expect(fake.disconnect).toHaveBeenCalled();
  });
});
