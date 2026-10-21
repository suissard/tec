import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Stepper from '@/components/ui/Stepper.vue';

const steps = ['Profil', 'Motivations', 'Compétences', 'Validation'];

describe('Stepper', () => {
  it('pose aria-current="step" sur le bouton de l’étape active uniquement', () => {
    const wrapper = mount(Stepper, { props: { steps, currentStep: 2 } });
    const items = wrapper.findAll('li');
    expect(items).toHaveLength(4);
    expect(items[2].find('button').attributes('aria-current')).toBe('step');
    expect(items[0].find('button').attributes('aria-current')).toBeUndefined();
    expect(items[3].find('button').attributes('aria-current')).toBeUndefined();
  });

  it('seules les étapes franchies sont cliquables (active et à venir désactivées)', () => {
    const wrapper = mount(Stepper, { props: { steps, currentStep: 2 } });
    const items = wrapper.findAll('li');
    expect(items[2].find('button').attributes('disabled')).toBeDefined(); // active
    expect(items[3].find('button').attributes('disabled')).toBeDefined(); // à venir
    expect(items[0].find('button').attributes('disabled')).toBeUndefined(); // franchie
  });

  it('affiche une coche sur les étapes franchies, le numéro sur les autres', () => {
    const wrapper = mount(Stepper, { props: { steps, currentStep: 2 } });
    const items = wrapper.findAll('li');
    expect(items[0].text()).toContain('✓');
    expect(items[2].text()).toContain('3');
  });

  it('émet step-click lors du clic sur une étape franchie', async () => {
    const wrapper = mount(Stepper, { props: { steps, currentStep: 2 } });
    await wrapper.findAll('li')[0].find('button').trigger('click');
    expect(wrapper.emitted('step-click')).toEqual([[0]]);
  });

  it('n’émet pas pour l’étape courante ou à venir (bouton désactivé)', async () => {
    const wrapper = mount(Stepper, { props: { steps, currentStep: 2 } });
    await wrapper.findAll('li')[3].find('button').trigger('click');
    expect(wrapper.emitted('step-click')).toBeUndefined();
  });

  it('annonce la progression pour les lecteurs d’écran', () => {
    const wrapper = mount(Stepper, { props: { steps, currentStep: 2 } });
    const status = wrapper.find('[role="status"]');
    expect(status.exists()).toBe(true);
    expect(status.text()).toContain('Étape 3 sur 4');
    expect(status.text()).toContain('Compétences');
  });

  it('gère un stepper à une seule étape (progression complète)', () => {
    const wrapper = mount(Stepper, { props: { steps: ['Unique'], currentStep: 0 } });
    expect(wrapper.findAll('li')).toHaveLength(1);
    expect(wrapper.find('li button').attributes('aria-current')).toBe('step');
  });
});
