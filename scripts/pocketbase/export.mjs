#!/usr/bin/env node
/**
 * Exporte le contenu PocketBase vers les JSON de `src/data/` (sens inverse de
 * `pb:seed`). Utile pour :
 * - garder des JSON de repli à jour (site servi même si la base est coupée) ;
 * - versionner dans git l'état du contenu édité en ligne.
 *
 * Lecture publique uniquement : aucun identifiant requis.
 * Les fichiers téléversés deviennent des URL absolues vers PocketBase.
 *
 * Usage : `npm run pb:export`
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import PocketBase from 'pocketbase';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DATA_DIR = join(ROOT, 'src', 'data');
const PB_URL = (process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/+$/, '');

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

/** Garde les champs renseignés, dans l'ordre donné (JSON lisible et stable). */
function shape(record, fields, { file } = {}) {
  const out = { id: record.slug };
  for (const field of fields) {
    let value = record[field];
    if (file && field === file.path && record[file.field]) {
      value = pb.files.getURL(record, record[file.field]);
    }
    if (value === '' || value === null || value === undefined || value === false) continue;
    if (typeof value === 'number' && value === 0) continue;
    out[field] = value;
  }
  return out;
}

function write(file, data) {
  writeFileSync(join(DATA_DIR, file), `${JSON.stringify(data, null, 2)}\n`);
  console.log(`✔ src/data/${file}`);
}

async function main() {
  const associations = await pb.collection('associations').getFullList({ sort: 'sort,name' });
  write(
    'associations.json',
    associations.map((record) =>
      shape(
        record,
        [
          'name',
          'category',
          'description',
          'email',
          'logo',
          'imgClass',
          'games',
          'website',
          'city',
          'discord',
        ],
        { file: { path: 'logo', field: 'logoFile' } }
      )
    )
  );

  const events = await pb.collection('events').getFullList({ sort: 'date' });
  write(
    'evenements.json',
    events.map((record) =>
      shape(
        record,
        [
          'title',
          'date',
          'category',
          'organizer',
          'description',
          'badgeColor',
          'location',
          'url',
          'endDate',
          'registrationUrl',
          'maxParticipants',
          'currentParticipants',
          'status',
          'image',
          'associationId',
        ],
        { file: { path: 'image', field: 'imageFile' } }
      )
    )
  );

  const news = await pb.collection('news').getFullList({ sort: '-date' });
  write(
    'news.json',
    news.map((record) =>
      shape(
        record,
        [
          'title',
          'date',
          'excerpt',
          'content',
          'author',
          'category',
          'image',
          'featured',
          'readTime',
        ],
        {
          file: { path: 'image', field: 'imageFile' },
        }
      )
    )
  );

  const content = await pb.collection('site_content').getFirstListItem('key = "main"');
  write('content.json', content.data);
}

main().catch((error) => {
  console.error(`✖ ${error.message}`);
  process.exit(1);
});
