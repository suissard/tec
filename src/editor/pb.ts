/**
 * Client PocketBase authentifié (SDK officiel) pour l'administration et le
 * mode édition. Ce module n'est chargé que sur /admin ou avec `?edit`.
 *
 * Connexion : compte de la collection `editors` ; un superuser PocketBase est
 * aussi accepté (repli), ce qui permet d'utiliser /admin dès l'installation.
 */
import PocketBase, { ClientResponseError, type RecordModel } from 'pocketbase';
import { reactive } from 'vue';

import { isPocketBaseEnabled, POCKETBASE_URL } from '@/services/pocketbase';
import { contentState, snapshotContent } from '@/utils/content';
import type { SiteContent } from '@/utils/contentSchema';

export { isPocketBaseEnabled, POCKETBASE_URL };

/** Client unique (session partagée entre /admin et le mode édition). */
export const pb = new PocketBase(POCKETBASE_URL || 'http://127.0.0.1:8090');
pb.autoCancellation(false);

/** Utilisateur connecté (réactif). */
export const session = reactive({
  user: null as RecordModel | null,
  /** `editors` ou `_superusers` */
  collection: '' as string,
});

function syncSession(): void {
  const record = pb.authStore.isValid ? pb.authStore.record : null;
  session.user = record;
  session.collection = record?.collectionName ?? '';
}
syncSession();
pb.authStore.onChange(syncSession);

/** Vrai si l'utilisateur connecté peut modifier le contenu. */
export function canEdit(): boolean {
  return session.collection === 'editors' || session.collection === '_superusers';
}

/** Libellé de l'utilisateur connecté. */
export function sessionLabel(): string {
  const user = session.user;
  if (!user) return '';
  return (typeof user.name === 'string' && user.name) || String(user.email ?? '');
}

/**
 * Message d'erreur lisible en français à partir d'une erreur PocketBase.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof ClientResponseError) {
    if (error.status === 0) return 'Serveur PocketBase injoignable.';
    if (error.status === 401 || error.status === 403) return 'Accès refusé : reconnectez-vous.';
    const fields = error.response?.data as Record<string, { message?: string }> | undefined;
    const details = fields
      ? Object.entries(fields)
          .map(([field, value]) => `${field} : ${value?.message ?? 'invalide'}`)
          .join(' · ')
      : '';
    return details || error.response?.message || error.message;
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Connexion par e-mail / mot de passe (éditeur, puis superuser en repli).
 *
 * @throws Error avec un message lisible si les identifiants sont refusés
 */
export async function login(email: string, password: string): Promise<void> {
  try {
    await pb.collection('editors').authWithPassword(email, password);
    return;
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 0) {
      throw new Error('Serveur PocketBase injoignable.');
    }
  }
  try {
    await pb.collection('_superusers').authWithPassword(email, password);
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 0) {
      throw new Error('Serveur PocketBase injoignable.');
    }
    throw new Error('Identifiants incorrects.');
  }
}

/** Déconnexion. */
export function logout(): void {
  pb.authStore.clear();
}

/** Revalide la session au chargement (jeton expiré, compte supprimé…). */
export async function refreshSession(): Promise<void> {
  if (!pb.authStore.isValid || !session.collection) return;
  try {
    await pb.collection(session.collection).authRefresh();
  } catch {
    pb.authStore.clear();
  }
}

/* ==========================================================================
   Textes du site
   ========================================================================== */

/**
 * Valide puis enregistre le contenu courant dans `site_content`.
 *
 * @param data Contenu à enregistrer (défaut : contenu affiché)
 * @param options `force` : ignore la détection de modification concurrente
 * @returns Liste d'erreurs de validation (vide = enregistré)
 * @throws Error `CONFLICT` si la base a changé depuis le chargement (sans `force`)
 */
export async function saveSiteContent(
  data: SiteContent = snapshotContent(),
  options: { force?: boolean } = {}
): Promise<string[]> {
  const { validateContent } = await import('@/utils/contentSchema');
  const errors = validateContent(data);
  if (errors.length > 0) return errors;

  let recordId = contentState.recordId;
  if (!recordId) {
    const existing = await pb.collection('site_content').getList(1, 1, { filter: 'key = "main"' });
    recordId = existing.items[0]?.id ?? null;
  }

  if (!recordId) {
    // Première sauvegarde (base vide) : nécessite un superuser (createRule null).
    const created = await pb.collection('site_content').create({ key: 'main', data });
    contentState.recordId = created.id;
    contentState.updated = created.updated;
    contentState.source = 'pocketbase';
    return [];
  }

  if (!options.force && contentState.updated) {
    const current = await pb
      .collection('site_content')
      .getOne(recordId, { fields: 'updated,updatedBy' });
    if (current.updated !== contentState.updated) {
      const conflict = new Error('CONFLICT');
      (conflict as Error & { by?: string }).by = String(current.updatedBy ?? '');
      throw conflict;
    }
  }

  const saved = await pb.collection('site_content').update(recordId, { data });
  contentState.recordId = saved.id;
  contentState.updated = saved.updated;
  contentState.source = 'pocketbase';
  contentState.errors = [];
  return [];
}

/* ==========================================================================
   Médiathèque
   ========================================================================== */

/**
 * Téléverse un fichier dans la médiathèque et renvoie son URL publique.
 */
export async function uploadMedia(file: File, title = file.name): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('title', title);
  const record = await pb.collection('media').create(form);
  return pb.files.getURL(record, record.file as string);
}
