#!/usr/bin/env node
/**
 * Lance PocketBase en local avec les dossiers du dépôt :
 * - données   : pocketbase/pb_data (ignoré par git)
 * - migrations: pocketbase/pb_migrations (appliquées automatiquement au démarrage)
 * - hooks     : pocketbase/pb_hooks
 *
 * Au tout premier lancement (pas encore de base), le superuser est créé à
 * partir de PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD (`.env.local`).
 *
 * Usage : `npm run pb:serve [-- --http 0.0.0.0:8090]`
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PB_DIR = join(ROOT, 'pocketbase');
const BINARY = join(PB_DIR, platform() === 'win32' ? 'pocketbase.exe' : 'pocketbase');
const DATA_DIR = join(PB_DIR, 'pb_data');

try {
  process.loadEnvFile(join(ROOT, '.env.local'));
} catch {
  // pas de .env.local : valeurs par défaut
}

if (!existsSync(BINARY)) {
  console.error('✖ Binaire PocketBase absent : lancez `npm run pb:install`.');
  process.exit(1);
}

const common = [
  `--dir=${DATA_DIR}`,
  `--migrationsDir=${join(PB_DIR, 'pb_migrations')}`,
  `--hooksDir=${join(PB_DIR, 'pb_hooks')}`,
];

const firstRun = !existsSync(join(DATA_DIR, 'data.db'));
const { PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD } = process.env;
if (firstRun && PB_ADMIN_EMAIL && PB_ADMIN_PASSWORD) {
  execFileSync(BINARY, ['migrate', 'up', ...common], { stdio: 'inherit' });
  execFileSync(
    BINARY,
    ['superuser', 'upsert', PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD, `--dir=${DATA_DIR}`],
    {
      stdio: 'inherit',
    }
  );
  console.log('→ Base créée. Importez le contenu avec `npm run pb:seed`.');
}

const extra = process.argv.slice(2);
const hasHttp = extra.some((arg) => arg.startsWith('--http'));
const child = spawn(
  BINARY,
  ['serve', ...common, ...(hasHttp ? [] : ['--http=127.0.0.1:8090']), ...extra],
  {
    stdio: 'inherit',
  }
);
child.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
