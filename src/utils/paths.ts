/**
 * Résolution des URL de fichiers publics (dossier `public/`).
 */

/**
 * Préfixe un chemin public avec le `base` Vite (`import.meta.env.BASE_URL`).
 *
 * Indispensable pour un déploiement GitHub Pages « project site » servi
 * depuis un sous-chemin (`/tec/`) : une URL absolue codée en dur
 * (`/media/logo.svg`) pointerait vers la racine de `github.io` au lieu du
 * dépôt, d'où des assets en 404 et une page blanche.
 *
 * Les URL absolues (`http://`, `https://`, `data:`, `//`) sont renvoyées
 * telles quelles.
 *
 * @param path Chemin public, avec ou sans slash initial (ex. `/media/logo.svg`)
 * @returns Chemin préfixé par le `base` (ex. `/tec/media/logo.svg`)
 *
 * @example
 * publicUrl('/media/logo.svg'); // base '/tec/' → '/tec/media/logo.svg'
 * publicUrl('data/news.json'); //  base '/'     → '/data/news.json'
 */
export function publicUrl(path: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) return path;

  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}
