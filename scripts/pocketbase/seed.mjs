#!/usr/bin/env node
/**
 * Importe les JSON de `src/data/` dans PocketBase.
 *
 * - associations / événements / actualités : créés ou mis à jour par `slug`
 *   (= `id` des JSON) ; avec `--prune`, les enregistrements absents du JSON
 *   sont supprimés ;
 * - textes du site : l'enregistrement `site_content` (`key = "main"`) est créé
 *   s'il n'existe pas ; il n'est écrasé qu'avec `--force` (pour ne pas perdre
 *   les modifications faites depuis /admin) ;
 * - compte éditeur : créé si PB_EDITOR_EMAIL / PB_EDITOR_PASSWORD sont fournis.
 *
 * Variables (`.env.local`) : VITE_POCKETBASE_URL, PB_ADMIN_EMAIL,
 * PB_ADMIN_PASSWORD, PB_EDITOR_EMAIL, PB_EDITOR_PASSWORD.
 *
 * Usage : `npm run pb:seed [-- --force] [-- --prune]`
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import PocketBase from 'pocketbase';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DATA_DIR = join(ROOT, 'src', 'data');

const PB_URL = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
const { PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD, PB_EDITOR_EMAIL, PB_EDITOR_PASSWORD } = process.env;
const FORCE = process.argv.includes('--force');
const PRUNE = process.argv.includes('--prune');

const readJson = (file) => JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));

/** Champs connus de chaque collection (les autres clés du JSON sont ignorées). */
const COLLECTIONS = [
  {
    name: 'associations',
    file: 'associations.json',
    fields: [
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
    withSort: true,
  },
  {
    name: 'events',
    file: 'evenements.json',
    fields: [
      'title',
      'date',
      'endDate',
      'category',
      'organizer',
      'description',
      'badgeColor',
      'location',
      'url',
      'registrationUrl',
      'maxParticipants',
      'currentParticipants',
      'status',
      'image',
      'associationId',
    ],
  },
  {
    name: 'news',
    file: 'news.json',
    fields: [
      'title',
      'date',
      'category',
      'excerpt',
      'content',
      'author',
      'image',
      'featured',
      'readTime',
    ],
  },
];

function pick(item, fields) {
  const out = {};
  for (const field of fields) {
    if (item[field] !== undefined && item[field] !== null) out[field] = item[field];
  }
  return out;
}

async function seedCollection(pb, { name, file, fields, withSort }) {
  const items = readJson(file);
  const existing = await pb.collection(name).getFullList({ fields: 'id,slug' });
  const bySlug = new Map(existing.map((record) => [record.slug, record.id]));
  let created = 0;
  let updated = 0;

  for (const [index, item] of items.entries()) {
    const payload = { slug: item.id, ...pick(item, fields) };
    if (withSort) payload.sort = (index + 1) * 10;
    const id = bySlug.get(item.id);
    if (id) {
      await pb.collection(name).update(id, payload);
      updated += 1;
    } else {
      await pb.collection(name).create(payload);
      created += 1;
    }
    bySlug.delete(item.id);
  }

  let removed = 0;
  if (PRUNE) {
    for (const id of bySlug.values()) {
      await pb.collection(name).delete(id);
      removed += 1;
    }
  }
  console.log(
    `✔ ${name.padEnd(13)} ${created} créé(s), ${updated} mis à jour${PRUNE ? `, ${removed} supprimé(s)` : ''}`
  );
}

async function seedContent(pb) {
  const data = readJson('content.json');
  const existing = await pb.collection('site_content').getFullList({ filter: 'key = "main"' });
  if (existing.length === 0) {
    await pb.collection('site_content').create({ key: 'main', data, updatedBy: 'import initial' });
    console.log('✔ site_content  créé depuis content.json');
  } else if (FORCE) {
    await pb.collection('site_content').update(existing[0].id, { data });
    console.log(
      "✔ site_content  écrasé par content.json (--force, version précédente dans l'historique)"
    );
  } else {
    console.log('• site_content  déjà présent — conservé (--force pour écraser)');
  }
}

async function seedEditor(pb) {
  if (!PB_EDITOR_EMAIL || !PB_EDITOR_PASSWORD) return;
  const found = await pb.collection('editors').getFullList({
    filter: pb.filter('email = {:email}', { email: PB_EDITOR_EMAIL }),
  });
  if (found.length > 0) {
    console.log(`• éditeur       ${PB_EDITOR_EMAIL} existe déjà`);
    return;
  }
  await pb.collection('editors').create({
    email: PB_EDITOR_EMAIL,
    password: PB_EDITOR_PASSWORD,
    passwordConfirm: PB_EDITOR_PASSWORD,
    name: 'Éditeur TEC',
    verified: true,
  });
  console.log(`✔ éditeur       ${PB_EDITOR_EMAIL} créé`);
}

async function main() {
  if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
    throw new Error('PB_ADMIN_EMAIL et PB_ADMIN_PASSWORD sont requis (cf. .env.example)');
  }
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
  console.log(`→ Connecté à ${PB_URL}`);

  for (const collection of COLLECTIONS) {
    await seedCollection(pb, collection);
  }
  await seedContent(pb);
  await seedEditor(pb);
}

main().catch((error) => {
  console.error(`✖ ${error.message}`);
  if (error.response?.data) console.error(JSON.stringify(error.response.data, null, 2));
  process.exit(1);
});
