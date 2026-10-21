import { afterEach, describe, expect, it } from 'vitest';

import { useModal } from '@/composables/useModal';

/** Composant factice servi de contenu de modale. */
const TestContent = { name: 'TestContent', render: () => null };

describe('useModal', () => {
  afterEach(() => {
    useModal().close();
  });

  it('singleton : open/close partagent le même état entre instances', () => {
    const modal1 = useModal();
    const modal2 = useModal();
    expect(modal1.isOpen.value).toBe(false);

    modal1.open(TestContent, { title: 'Test' });
    expect(modal1.isOpen.value).toBe(true);
    expect(modal2.isOpen.value).toBe(true);
    // `content` est un ref : Vue expose un proxy réactif → égalité profonde.
    expect(modal1.content.value).toStrictEqual(TestContent);
    expect(modal1.props.value).toEqual({ title: 'Test' });

    modal1.close();
    expect(modal1.isOpen.value).toBe(false);
    expect(modal2.isOpen.value).toBe(false);
  });

  it('toggle bascule ouverture / fermeture', () => {
    const modal = useModal();
    modal.toggle();
    expect(modal.isOpen.value).toBe(true);
    modal.toggle();
    expect(modal.isOpen.value).toBe(false);
  });

  it('open() sans composant ferme tout en restant ouvert', () => {
    const modal = useModal();
    modal.open(TestContent);
    modal.open();
    expect(modal.isOpen.value).toBe(true);
    expect(modal.content.value).toBeNull();
    expect(modal.props.value).toEqual({});
  });
});
