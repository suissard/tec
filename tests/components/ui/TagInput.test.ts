import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import TagInput from '@/components/ui/TagInput.vue';

describe('TagInput', () => {
  it('ne casse pas au rendu quand le modèle n’est pas encore un tableau', () => {
    expect(() =>
      mount(TagInput, {
        props: { modelValue: undefined as unknown as string[] },
      })
    ).not.toThrow();
  });

  it('ajoute la saisie courante avec Entrée', async () => {
    const wrapper = mount(TagInput, { props: { modelValue: [] } });
    const input = wrapper.find('input');
    await input.setValue('Valorant');
    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['Valorant']]);
  });

  it('retire un tag au clic sur sa croix', async () => {
    const wrapper = mount(TagInput, { props: { modelValue: ['Valorant', 'Rocket League'] } });
    await wrapper.findAll('button')[0].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['Rocket League']]);
  });

  it('affiche les tags en lecture seule sans bouton de suppression', () => {
    const wrapper = mount(TagInput, {
      props: { modelValue: ['Valorant'], readonly: true },
    });
    expect(wrapper.text()).toContain('Valorant');
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.find('button').exists()).toBe(false);
  });
});
