import { mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it } from 'vitest';

import BaseButton from '@/components/ui/BaseButton.vue';

/** Router de test minimal pour le rendu `<RouterLink>` (prop `to`). */
async function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
  });
  await router.push('/destination');
  await router.isReady();
  return router;
}

describe('BaseButton', () => {
  it('rend un <button> avec la variante primary par défaut', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Cliquer' } });
    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.classes()).toContain('bg-brand-red');
    expect(wrapper.attributes('type')).toBe('button');
    expect(wrapper.text()).toBe('Cliquer');
  });

  it('applique les classes de la variante demandée', () => {
    const wrapper = mount(BaseButton, { props: { variant: 'discord' } });
    expect(wrapper.classes()).toContain('bg-brand-discord');
  });

  it('loading affiche le spinner, désactive et expose aria-busy', () => {
    const wrapper = mount(BaseButton, { props: { loading: true } });
    expect(wrapper.find('svg.animate-spin').exists()).toBe(true);
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(wrapper.attributes('aria-disabled')).toBe('true');
  });

  it('disabled désactive le bouton et expose aria-disabled', () => {
    const wrapper = mount(BaseButton, { props: { disabled: true } });
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.attributes('aria-disabled')).toBe('true');
    expect(wrapper.find('svg.animate-spin').exists()).toBe(false);
  });

  it('sans disabled ni loading, aria-disabled est absent', () => {
    const wrapper = mount(BaseButton);
    expect(wrapper.attributes('aria-disabled')).toBeUndefined();
  });

  it('la prop `to` rend un RouterLink interne', async () => {
    const router = await createTestRouter();
    const wrapper = mount(BaseButton, {
      props: { to: '/destination' },
      slots: { default: 'Aller' },
      global: { plugins: [router] },
    });
    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes('href')).toBe('/destination');
  });

  it('la prop `href` rend un lien externe sécurisé', () => {
    const wrapper = mount(BaseButton, {
      props: { href: 'https://example.com' },
      slots: { default: 'Externe' },
    });
    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes('href')).toBe('https://example.com');
    expect(wrapper.attributes('target')).toBe('_blank');
    expect(wrapper.attributes('rel')).toBe('noopener noreferrer');
  });

  it('un lien désactivé empêche la navigation au clic', async () => {
    const wrapper = mount(BaseButton, {
      props: { href: 'https://example.com', disabled: true },
    });
    const prevented = !wrapper.element.dispatchEvent(
      new MouseEvent('click', { cancelable: true })
    );
    expect(prevented).toBe(true);
  });
});
