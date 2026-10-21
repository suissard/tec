/**
 * Injection / retrait de données structurées JSON-LD dans le <head>
 * (SEO : NewsArticle, ItemList, Organization, ...).
 */

/** Scripts JSON-LD injectés, indexés par identifiant technique */
const registry = new Map<string, HTMLScriptElement>();

/**
 * Injecte (ou remplace) un bloc JSON-LD identifié par `id`.
 *
 * @param id Identifiant technique (`data-tec-jsonld`)
 * @param data Objet sérialisable en JSON-LD
 * @returns `{void}` — no-op hors navigateur
 * @example
 * injectJsonLd('news-list', { '@type': 'ItemList', itemListElement: [...] });
 */
export function injectJsonLd(id: string, data: unknown): void {
  if (typeof document === 'undefined') return;

  removeJsonLd(id);

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-tec-jsonld', id);
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
  registry.set(id, script);
}

/**
 * Retire le bloc JSON-LD injecté sous l'identifiant `id`.
 *
 * @param id Identifiant technique utilisé à l'injection
 * @returns `{void}` — no-op si le bloc est absent
 * @example
 * removeJsonLd('news-list');
 */
export function removeJsonLd(id: string): void {
  if (typeof document === 'undefined') return;

  const tracked = registry.get(id);
  if (tracked?.isConnected) {
    tracked.remove();
  }
  document.querySelectorAll(`script[data-tec-jsonld="${id}"]`).forEach((node) => node.remove());
  registry.delete(id);
}
