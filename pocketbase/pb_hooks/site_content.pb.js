/// <reference path="../pb_data/types.d.ts" />
/**
 * Historique des textes du site : avant chaque mise à jour de `site_content`,
 * la version précédente est copiée dans `content_revisions` (restaurable depuis
 * /admin → Historique). Seules les 50 dernières révisions sont conservées.
 *
 * L'auteur de la modification est aussi noté dans `site_content.updatedBy`.
 */

onRecordUpdateRequest((e) => {
  const author = e.auth ? e.auth.getString('email') : 'inconnu';
  const previous = $app.findRecordById('site_content', e.record.id);

  e.record.set('updatedBy', author);
  e.next();

  const revisions = $app.findCollectionByNameOrId('content_revisions');
  const revision = new Record(revisions);
  revision.set('contentKey', previous.getString('key'));
  revision.set('data', JSON.parse(previous.getString('data') || 'null'));
  revision.set('author', previous.getString('updatedBy') || 'import initial');
  $app.save(revision);

  // Rotation : on ne garde que les 50 révisions les plus récentes.
  const old = $app.findRecordsByFilter('content_revisions', "id != ''", '-created', 200, 50);
  for (const record of old) {
    $app.delete(record);
  }
}, 'site_content');
