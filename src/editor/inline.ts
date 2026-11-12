/**
 * Édition directement sur la page (mode `?edit`).
 *
 * Principe : les textes affichés sont rapprochés des valeurs du contenu
 * (`content`) par comparaison de texte, sans annoter les templates.
 * - texte simple, présent à un seul endroit → modifiable en place (clic) ;
 * - texte enrichi (liens, retours à la ligne), titre bicolore ou texte
 *   ambigu → le clic ouvre le(s) champ(s) correspondant(s) dans le panneau ;
 * - cartes `[data-tec-record="collection:slug"]` → badge « Modifier » qui
 *   ouvre la fiche (association, événement, actualité).
 *
 * Les ambiguïtés sont levées par zone : un texte de l'en-tête est cherché dans
 * `navigation`/`site`, du pied de page dans `layout.footer`, du contenu
 * principal dans `pages.<page courante>`.
 */
import { content, getContentValue, parseRichText, setContentValue } from '@/utils/content';

export interface InlineEditorOptions {
  /** Clé de la page courante dans `content.pages` */
  getPageKey: () => string | undefined;
  /** Vrai quand les clics doivent naviguer normalement (mode « Naviguer ») */
  isNavigating: () => boolean;
  /** Ouvre le panneau sur les champs donnés */
  openFields: (paths: string[]) => void;
  /** Ouvre la fiche d'un enregistrement */
  openRecord: (collection: string, slug: string) => void;
  /** Notifie une modification (chemin) */
  onChange: (path: string) => void;
}

/** Clés techniques jamais affichées telles quelles. */
const SKIPPED_KEYS = new Set([
  'icon',
  'route',
  'variant',
  'hash',
  'id',
  'href',
  'url',
  'embedUrl',
  'linkUrl',
  'src',
  'photo',
]);
const SKIPPED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'SVG',
  'PATH',
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'OPTION',
]);

/** Texte comparable : rendu « à plat » (liens → libellé), sans aucun espace. */
function matchKey(text: string): string {
  return text.replace(/\s+/g, '');
}

function renderedText(value: string): string {
  return parseRichText(value)
    .map((segment) =>
      segment.type === 'text' ? segment.value : segment.type === 'link' ? segment.label : ''
    )
    .join('');
}

/** Index « texte affiché » → chemins du contenu. */
function buildIndex(): Map<string, string[]> {
  const index = new Map<string, string[]>();
  const walk = (value: unknown, path: string): void => {
    if (typeof value === 'string') {
      const key = path.split('.').pop() ?? '';
      if (SKIPPED_KEYS.has(key) || path.includes('.meta.')) return;
      const match = matchKey(renderedText(value));
      if (match.length < 2) return;
      const list = index.get(match);
      if (list) list.push(path);
      else index.set(match, [path]);
      return;
    }
    if (Array.isArray(value)) {
      // Liste de textes affichée d'un bloc (ex. libellé sur deux lignes) :
      // le texte complet renvoie au champ liste.
      if (value.length > 1 && value.every((item) => typeof item === 'string')) {
        const joined = matchKey(value.join(''));
        index.set(joined, [...(index.get(joined) ?? []), path]);
      }
      value.forEach((item, i) => walk(item, `${path}.${i}`));
    } else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) walk(child, path ? `${path}.${key}` : key);
    }
  };
  walk(content, '');
  return index;
}

/** Préfixes de recherche selon la zone de la page où se trouve l'élément. */
function zonePrefixes(element: Element, pageKey: string | undefined): string[] {
  if (element.closest('header')) return ['navigation', 'site'];
  if (element.closest('footer')) return ['layout.footer', 'site', 'navigation'];
  if (element.closest('#main-content')) return pageKey ? [`pages.${pageKey}`] : [];
  return ['layout'];
}

/** Garde les chemins de la première zone qui en contient (aucun : texte non lié). */
function narrow(paths: string[], prefixes: string[]): string[] {
  for (const prefix of prefixes) {
    const found = paths.filter((path) => path === prefix || path.startsWith(`${prefix}.`));
    if (found.length > 0) return found;
  }
  return [];
}

/** Valeur éditable en place : texte brut sans lien ni retour à la ligne. */
function isPlainValue(path: string): boolean {
  const value = getContentValue(path);
  return typeof value === 'string' && !value.includes('\n') && !/\[[^\]]+\]\([^)]+\)/.test(value);
}

function hasOnlyText(element: Element): boolean {
  return element.childElementCount === 0;
}

function supportsPlaintextOnly(): boolean {
  const probe = document.createElement('div');
  try {
    probe.contentEditable = 'plaintext-only';
    return probe.contentEditable === 'plaintext-only';
  } catch {
    return false;
  }
}

export function createInlineEditor(options: InlineEditorOptions) {
  const plaintextOnly = supportsPlaintextOnly();
  let observer: MutationObserver | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let editing: { element: HTMLElement; path: string; original: string } | null = null;

  function isEditorUi(node: Element): boolean {
    return node.closest('[data-tec-editor]') !== null;
  }

  /* ------------------------------------------------------------- repérage */
  function scan(): void {
    const index = buildIndex();
    const pageKey = options.getPageKey();
    const seen = new Set<Element>();

    for (const element of Array.from(document.body.querySelectorAll('*'))) {
      if (SKIPPED_TAGS.has(element.tagName.toUpperCase()) || isEditorUi(element)) continue;
      if (element.classList.contains('tec-record-badge')) continue;
      if (editing?.element === element) {
        seen.add(element);
        continue;
      }
      const text = element.textContent ?? '';
      if (text.length === 0 || text.length > 4000) continue;
      const key = matchKey(text);
      const candidates = index.get(key);
      if (!candidates) continue;
      // Seul l'élément le plus profond portant tout le texte est retenu.
      const childHasSame = Array.from(element.children).some(
        (child) => matchKey(child.textContent ?? '') === key
      );
      if (childHasSame) continue;

      const paths = narrow(candidates, zonePrefixes(element, pageKey));
      if (paths.length === 0) continue;
      const inline = paths.length === 1 && hasOnlyText(element) && isPlainValue(paths[0]);
      const el = element as HTMLElement;
      el.dataset.tecEdit = paths.join('|');
      el.dataset.tecEditMode = inline ? 'inline' : 'panel';
      el.title = inline
        ? 'Cliquer pour modifier ce texte'
        : 'Cliquer pour modifier dans le panneau';
      seen.add(element);
    }

    // Nettoie les éléments qui ne correspondent plus à aucun texte.
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-tec-edit]'))) {
      if (!seen.has(element)) unmark(element);
    }

    // Badges « Modifier » sur les cartes d'enregistrements.
    for (const card of Array.from(document.querySelectorAll<HTMLElement>('[data-tec-record]'))) {
      if (card.querySelector(':scope > .tec-record-badge')) continue;
      const badge = document.createElement('button');
      badge.type = 'button';
      badge.className = 'tec-record-badge';
      badge.textContent = '✎ Modifier';
      badge.setAttribute('aria-label', 'Modifier cette fiche');
      card.prepend(badge);
    }
  }

  function unmark(element: HTMLElement): void {
    delete element.dataset.tecEdit;
    delete element.dataset.tecEditMode;
    element.removeAttribute('title');
  }

  function scheduleScan(): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(scan, 120);
  }

  /* ------------------------------------------------------- édition en place */
  function begin(element: HTMLElement, path: string): void {
    finish(true);
    editing = { element, path, original: element.textContent ?? '' };
    element.contentEditable = plaintextOnly ? 'plaintext-only' : 'true';
    element.dataset.tecEditing = '';
    element.spellcheck = true;
    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    element.addEventListener('keydown', onKeydown);
    element.addEventListener('blur', onBlur);
    element.addEventListener('paste', onPaste);
  }

  function finish(commit: boolean): void {
    if (!editing) return;
    const { element, path, original } = editing;
    editing = null;
    element.removeEventListener('keydown', onKeydown);
    element.removeEventListener('blur', onBlur);
    element.removeEventListener('paste', onPaste);
    element.removeAttribute('contenteditable');
    delete element.dataset.tecEditing;

    const next = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!commit || next === '' || next === original.trim()) {
      element.textContent = original;
      return;
    }
    element.textContent = next;
    if (setContentValue(path, next)) {
      element.dataset.tecEditDirty = '';
      options.onChange(path);
    }
    scheduleScan();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      finish(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      finish(false);
    }
    event.stopPropagation();
  }

  function onBlur(): void {
    finish(true);
  }

  function onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, text.replace(/\s+/g, ' '));
  }

  /* ----------------------------------------------------------------- clics */
  function onClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (!target || isEditorUi(target)) return;

    const badge = target.closest('.tec-record-badge');
    if (badge) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const [collection, slug] = (badge.parentElement?.dataset.tecRecord ?? '').split(':');
      if (collection && slug) options.openRecord(collection, slug);
      return;
    }

    if (editing && editing.element.contains(target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (options.isNavigating() || event.altKey) return;

    const element = target.closest<HTMLElement>('[data-tec-edit]');
    if (!element) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const paths = (element.dataset.tecEdit ?? '').split('|').filter(Boolean);
    if (element.dataset.tecEditMode === 'inline' && paths.length === 1) begin(element, paths[0]);
    else options.openFields(paths);
  }

  /** Empêche les liens/boutons de réagir au clic pendant l'édition (mousedown). */
  function onPointerDown(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (!target || isEditorUi(target) || options.isNavigating() || event.altKey) return;
    if (
      target.closest('[data-tec-edit-mode="inline"]') &&
      !(editing && editing.element.contains(target))
    ) {
      // Évite la sélection de texte parasite avant l'entrée en édition.
      event.preventDefault();
    }
  }

  /* ------------------------------------------------------------- cycle de vie */
  function start(): void {
    document.documentElement.classList.add('tec-editing');
    document.addEventListener('click', onClick, true);
    document.addEventListener('mousedown', onPointerDown, true);
    observer = new MutationObserver((mutations) => {
      if (
        mutations.every(
          (mutation) => mutation.target instanceof Element && isEditorUi(mutation.target)
        )
      )
        return;
      scheduleScan();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    scan();
  }

  function stop(): void {
    finish(false);
    observer?.disconnect();
    observer = null;
    if (timer) clearTimeout(timer);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('mousedown', onPointerDown, true);
    document.documentElement.classList.remove('tec-editing');
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-tec-edit]'))) {
      unmark(element);
      delete element.dataset.tecEditDirty;
    }
    for (const badge of Array.from(document.querySelectorAll('.tec-record-badge'))) badge.remove();
  }

  /** Retire les marqueurs « modifié » (après enregistrement ou annulation). */
  function clearDirty(): void {
    for (const element of Array.from(
      document.querySelectorAll<HTMLElement>('[data-tec-edit-dirty]')
    )) {
      delete element.dataset.tecEditDirty;
    }
  }

  return { start, stop, rescan: scheduleScan, clearDirty };
}
