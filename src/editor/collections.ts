/**
 * Description des collections éditables (formulaires /admin et fiche rapide du
 * mode édition). L'ordre des champs est l'ordre d'affichage.
 */

export type FieldType =
  'text' | 'textarea' | 'slug' | 'date' | 'number' | 'bool' | 'select' | 'url' | 'email' | 'image';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  /** Valeurs d'une liste déroulante */
  options?: { value: string; label: string }[];
  /** Pour `image` : champ fichier PocketBase associé au champ texte (chemin/URL) */
  fileField?: string;
  /** Occupe toute la largeur du formulaire */
  wide?: boolean;
}

export interface CollectionDef {
  name: 'associations' | 'events' | 'news';
  /** Libellé du menu (pluriel) */
  label: string;
  /** Libellé d'un élément (« une association ») */
  singular: string;
  /** Tri PocketBase de la liste */
  sort: string;
  /** Champ utilisé comme titre dans la liste */
  titleField: string;
  /** Colonnes secondaires de la liste */
  columns: string[];
  /** Champs inclus dans la recherche */
  searchFields: string[];
  fields: FieldDef[];
}

const slugHint = 'Identifiant dans les URL : minuscules, chiffres et tirets (ex. osv-esport).';

export const COLLECTIONS: CollectionDef[] = [
  {
    name: 'associations',
    label: 'Associations',
    singular: 'une association',
    sort: 'sort,name',
    titleField: 'name',
    columns: ['category', 'city'],
    searchFields: ['name', 'description', 'games', 'city', 'category'],
    fields: [
      { name: 'name', label: 'Nom', type: 'text', required: true },
      { name: 'slug', label: 'Identifiant', type: 'slug', required: true, hint: slugHint },
      {
        name: 'category',
        label: 'Catégorie',
        type: 'text',
        required: true,
        hint: 'Sert au filtrage (esport, retro, versus, etudiant…).',
      },
      { name: 'city', label: 'Ville', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea', required: true, wide: true },
      {
        name: 'games',
        label: 'Jeux',
        type: 'text',
        wide: true,
        hint: 'Séparés par des virgules : League of Legends, Rocket League',
      },
      { name: 'logo', label: 'Logo', type: 'image', fileField: 'logoFile', wide: true },
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'website', label: 'Site web', type: 'url' },
      { name: 'discord', label: 'Lien Discord', type: 'url' },
      {
        name: 'sort',
        label: 'Ordre d’affichage',
        type: 'number',
        hint: 'Plus petit = affiché en premier.',
      },
      {
        name: 'imgClass',
        label: 'Classes CSS du logo (avancé)',
        type: 'text',
        wide: true,
        hint: 'Classes Tailwind appliquées au logo (ombre portée…).',
      },
    ],
  },
  {
    name: 'events',
    label: 'Événements',
    singular: 'un événement',
    sort: '-date',
    titleField: 'title',
    columns: ['date', 'category'],
    searchFields: ['title', 'organizer', 'description', 'category', 'location'],
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true, wide: true },
      { name: 'slug', label: 'Identifiant', type: 'slug', required: true, hint: slugHint },
      { name: 'category', label: 'Catégorie', type: 'text', required: true },
      { name: 'date', label: 'Date de début', type: 'date', required: true },
      {
        name: 'endDate',
        label: 'Date de fin',
        type: 'date',
        hint: 'Événement sur plusieurs jours.',
      },
      { name: 'organizer', label: 'Organisateur', type: 'text', required: true },
      { name: 'location', label: 'Lieu', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea', required: true, wide: true },
      { name: 'image', label: 'Visuel', type: 'image', fileField: 'imageFile', wide: true },
      { name: 'url', label: 'Lien de l’événement', type: 'url' },
      { name: 'registrationUrl', label: 'Lien d’inscription', type: 'url' },
      { name: 'maxParticipants', label: 'Places maximum', type: 'number' },
      { name: 'currentParticipants', label: 'Inscrits', type: 'number' },
      {
        name: 'status',
        label: 'Statut',
        type: 'select',
        hint: 'Laisser vide : calculé automatiquement.',
        options: [
          { value: '', label: 'Automatique' },
          { value: 'open', label: 'Inscriptions ouvertes' },
          { value: 'full', label: 'Complet' },
          { value: 'cancelled', label: 'Annulé' },
        ],
      },
      {
        name: 'badgeColor',
        label: 'Couleur du badge date',
        type: 'select',
        options: [
          { value: '', label: 'Par défaut' },
          { value: 'brand-red', label: 'Rouge' },
          { value: 'white', label: 'Blanc' },
        ],
      },
      {
        name: 'associationId',
        label: 'Association organisatrice (identifiant)',
        type: 'text',
        hint: 'Identifiant de l’association (ex. osv-esport).',
      },
    ],
  },
  {
    name: 'news',
    label: 'Actualités',
    singular: 'une actualité',
    sort: '-date',
    titleField: 'title',
    columns: ['date', 'author'],
    searchFields: ['title', 'excerpt', 'content', 'author', 'category'],
    fields: [
      { name: 'title', label: 'Titre', type: 'text', required: true, wide: true },
      { name: 'slug', label: 'Identifiant', type: 'slug', required: true, hint: slugHint },
      { name: 'date', label: 'Date de publication', type: 'date', required: true },
      { name: 'category', label: 'Catégorie', type: 'text', required: true },
      { name: 'author', label: 'Auteur', type: 'text', required: true },
      { name: 'excerpt', label: 'Chapô (résumé)', type: 'textarea', required: true, wide: true },
      { name: 'content', label: 'Article complet', type: 'textarea', wide: true },
      { name: 'image', label: 'Image', type: 'image', fileField: 'imageFile', wide: true },
      { name: 'readTime', label: 'Temps de lecture (min)', type: 'number' },
      { name: 'featured', label: 'Mettre à la une', type: 'bool' },
    ],
  },
];

export function getCollection(name: string): CollectionDef | undefined {
  return COLLECTIONS.find((collection) => collection.name === name);
}

/**
 * Transforme un texte en identifiant d'URL (`OSV Esport` → `osv-esport`).
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
