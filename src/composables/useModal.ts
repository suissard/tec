import { ref, type Component, type Ref } from 'vue';

/** Contrôleur de la modale globale, retourné par {@link useModal}. */
export interface ModalController {
  /** État ouvert/fermé de la modale globale */
  isOpen: Ref<boolean>;
  /** Composant rendu dans la modale */
  content: Ref<Component | null>;
  /** Props passées au composant de la modale */
  props: Ref<Record<string, unknown>>;
  /** Ouvre la modale (avec un composant et ses props optionnels) */
  open: (component?: Component | null, props?: Record<string, unknown>) => void;
  /** Ferme la modale */
  close: () => void;
  /** Bascule l'état de la modale */
  toggle: () => void;
}

/**
 * État partagé (singleton) de la modale globale.
 * Rendu par `<ModalHost />` (Teleport `body`) dans `App.vue`, qui assure
 * le piège de focus, la touche Escape et les attributs ARIA.
 *
 * Usage : `useModal().open(SomeComponent, { title: 'Fiche' })`
 */
const isOpen = ref(false);
const content = ref<Component | null>(null);
const props = ref<Record<string, unknown>>({});

/**
 * Accède à la modale globale (état partagé entre tous les appelants).
 *
 * @returns Contrôleur `{ isOpen, content, props, open, close, toggle }`
 * @example
 * const modal = useModal();
 * modal.open(AssociationDetailModal, { association, title: 'Fiche' });
 */
export function useModal(): ModalController {
  function open(component?: Component | null, nextProps: Record<string, unknown> = {}): void {
    content.value = component ?? null;
    props.value = nextProps;
    isOpen.value = true;
  }

  function close(): void {
    isOpen.value = false;
  }

  function toggle(): void {
    if (isOpen.value) {
      close();
    } else {
      isOpen.value = true;
    }
  }

  return { isOpen, content, props, open, close, toggle };
}
