/**
 * Session d'édition des textes du site, partagée par le mode édition et
 * /admin : version de référence (dernier état enregistré), détection des
 * modifications, enregistrement (avec gestion des conflits) et annulation.
 */
import { computed, reactive } from 'vue';

import { errorMessage, isPocketBaseEnabled, saveSiteContent } from '@/editor/pb';
import {
  content,
  contentState,
  loadRemoteContent,
  replaceContent,
  snapshotContent,
} from '@/utils/content';
import type { SiteContent } from '@/utils/contentSchema';

export const contentSession = reactive({
  /** Dernier état enregistré (JSON) */
  baseline: '',
  saving: false,
  /** Erreurs de validation ou d'enregistrement */
  errors: [] as string[],
  /** Avertissement sur l'origine du contenu affiché */
  warning: '',
});

/** Vrai si le contenu affiché diffère du dernier état enregistré. */
export const isContentDirty = computed(
  () => contentSession.baseline !== '' && JSON.stringify(content) !== contentSession.baseline
);

/** Mémorise le contenu courant comme référence. */
export function takeBaseline(): void {
  contentSession.baseline = JSON.stringify(snapshotContent());
}

/**
 * S'assure que le contenu affiché est celui de la base avant toute édition
 * (sinon une sauvegarde écraserait la base avec les textes du build).
 */
export async function prepareContentSession(): Promise<void> {
  contentSession.warning = '';
  if (isPocketBaseEnabled && contentState.source !== 'pocketbase') {
    await loadRemoteContent(8000);
    // (relu après l'appel asynchrone : la valeur a pu changer)
    if ((contentState.source as string) !== 'pocketbase') {
      contentSession.warning = contentState.recordId
        ? 'Le contenu en base est invalide : les textes affichés sont ceux du site publié. Enregistrer les remplacera.'
        : 'Aucun contenu en base (lancez « npm run pb:seed ») : les textes affichés sont ceux du site publié.';
    }
  }
  if (!contentSession.baseline || !isContentDirty.value) takeBaseline();
}

/**
 * Enregistre le contenu courant.
 *
 * @returns `true` si l'enregistrement a réussi
 */
export async function saveContentSession(force = false): Promise<boolean> {
  if (contentSession.saving) return false;
  contentSession.saving = true;
  contentSession.errors = [];
  try {
    const data = snapshotContent();
    const problems = await saveSiteContent(data, { force });
    if (problems.length > 0) {
      contentSession.errors = problems;
      return false;
    }
    contentSession.baseline = JSON.stringify(data);
    contentSession.warning = '';
    return true;
  } catch (error) {
    if (error instanceof Error && error.message === 'CONFLICT') {
      const by = (error as Error & { by?: string }).by;
      contentSession.saving = false;
      const overwrite = window.confirm(
        `Les textes ont été modifiés entre-temps${by ? ` par ${by}` : ''}. Écraser cette version avec la vôtre ?\n(La version écrasée reste disponible dans l'historique de /admin.)`
      );
      return overwrite ? saveContentSession(true) : false;
    }
    contentSession.errors = [errorMessage(error)];
    return false;
  } finally {
    contentSession.saving = false;
  }
}

/** Revient au dernier état enregistré. */
export function discardContentSession(): void {
  if (!contentSession.baseline) return;
  replaceContent(JSON.parse(contentSession.baseline) as SiteContent);
  contentSession.errors = [];
}
