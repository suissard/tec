#!/usr/bin/env node
/**
 * Télécharge le binaire PocketBase (version figée) dans `pocketbase/`.
 *
 * Usage : `npm run pb:install` (puis `npm run pb:serve`).
 * Le binaire et `pb_data/` sont ignorés par git : seuls les migrations
 * (`pb_migrations/`) et les hooks (`pb_hooks/`) sont versionnés.
 */
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { arch, platform } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Version de PocketBase compatible avec les migrations du dépôt. */
export const PB_VERSION = '0.40.6';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PB_DIR = join(ROOT, 'pocketbase');
const BINARY = join(PB_DIR, platform() === 'win32' ? 'pocketbase.exe' : 'pocketbase');

const OS_MAP = { linux: 'linux', darwin: 'darwin', win32: 'windows' };
const ARCH_MAP = { x64: 'amd64', arm64: 'arm64', arm: 'armv7' };

async function main() {
  const os = OS_MAP[platform()];
  const cpu = ARCH_MAP[arch()];
  if (!os || !cpu) {
    throw new Error(`Plateforme non supportée : ${platform()}/${arch()}`);
  }

  const force = process.argv.includes('--force');
  if (existsSync(BINARY) && !force) {
    const current = execFileSync(BINARY, ['--version']).toString().trim();
    console.log(`✔ PocketBase déjà installé (${current}). --force pour réinstaller.`);
    return;
  }

  const file = `pocketbase_${PB_VERSION}_${os}_${cpu}.zip`;
  const url = `https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/${file}`;
  console.log(`↓ ${url}`);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Téléchargement impossible (${response.status})`);

  mkdirSync(PB_DIR, { recursive: true });
  const zipPath = join(PB_DIR, file);
  writeFileSync(zipPath, Buffer.from(await response.arrayBuffer()));

  try {
    try {
      execFileSync('unzip', ['-o', zipPath, 'pocketbase', 'pocketbase.exe', '-d', PB_DIR], {
        stdio: 'ignore',
      });
    } catch {
      // `unzip` renvoie 11 si l'un des deux noms est absent : on vérifie le binaire.
      if (!existsSync(BINARY)) {
        // Windows 10+ / macOS : bsdtar sait lire les zip.
        execFileSync('tar', ['-xf', zipPath, '-C', PB_DIR], { stdio: 'inherit' });
      }
    }
  } finally {
    rmSync(zipPath, { force: true });
  }

  if (!existsSync(BINARY)) throw new Error('Binaire PocketBase introuvable après extraction');
  if (platform() !== 'win32') chmodSync(BINARY, 0o755);
  console.log(`✔ PocketBase ${PB_VERSION} installé dans pocketbase/`);
}

main().catch((error) => {
  console.error(`✖ ${error.message}`);
  process.exit(1);
});
