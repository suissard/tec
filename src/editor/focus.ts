/**
 * Champs à mettre en avant dans les formulaires de contenu (clic sur un texte
 * de la page en mode édition → le champ correspondant s'ouvre et prend le focus).
 */
import { reactive } from 'vue';

export const editorFocus = reactive({
  /** Chemins des champs ciblés (`pages.home.hero.title`) */
  paths: [] as string[],
  /** Incrémenté à chaque demande (rejoue le défilement / focus) */
  token: 0,
});

/** Cible un ou plusieurs champs. */
export function focusFields(paths: string[]): void {
  editorFocus.paths = paths;
  editorFocus.token += 1;
}

/** Vrai si `path` est un champ ciblé ou l'un de ses parents. */
export function isOnFocusedBranch(path: string): boolean {
  return editorFocus.paths.some((target) => target === path || target.startsWith(`${path}.`));
}
