import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BaseInput from '@/components/ui/BaseInput.vue';

describe('BaseInput', () => {
  it('émet update:modelValue à la saisie (v-model)', async () => {
    let received = '';
    const wrapper = mount(BaseInput, {
      props: {
        modelValue: '',
        label: 'Nom',
        'onUpdate:modelValue': (value: string) => {
          received = value;
        },
      },
    });
    await wrapper.find('input').setValue('test');
    expect(received).toBe('test');
  });

  it('reflète la valeur courante dans l’input', () => {
    const wrapper = mount(BaseInput, { props: { modelValue: 'valeur', label: 'Nom' } });
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('valeur');
  });

  it('affiche l’erreur et pose aria-invalid + role="alert"', () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: '', label: 'Nom', error: 'Champ requis' },
    });
    expect(wrapper.text()).toContain('Champ requis');
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    // aria-describedby pointe vers le message d'erreur
    expect(wrapper.find('input').attributes('aria-describedby')).toBe(
      wrapper.find('[role="alert"]').attributes('id')
    );
  });

  it('sans erreur, ni aria-invalid ni message', () => {
    const wrapper = mount(BaseInput, { props: { modelValue: '', label: 'Nom' } });
    expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('hint est rendu et lié via aria-describedby', () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: '', label: 'Nom', hint: 'Message d’aide' },
    });
    const hint = wrapper.findAll('p').find((node) => node.text().includes('Message d’aide'));
    expect(hint).toBeDefined();
    expect(wrapper.find('input').attributes('aria-describedby')).toBe(hint?.attributes('id'));
  });

  it('required affiche l’astérisque et l’attribut natif', () => {
    const wrapper = mount(BaseInput, { props: { modelValue: '', label: 'Nom', required: true } });
    expect(wrapper.find('input').attributes('required')).toBeDefined();
    expect(wrapper.text()).toContain('*');
  });

  it('utilise inputId si fourni', () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: '', label: 'Nom', inputId: 'mon-id' },
    });
    expect(wrapper.find('input').attributes('id')).toBe('mon-id');
    expect(wrapper.find('label').attributes('for')).toBe('mon-id');
  });
});
