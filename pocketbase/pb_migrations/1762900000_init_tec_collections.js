/// <reference path="../pb_data/types.d.ts" />
/**
 * Schéma initial du contenu TEC.
 *
 * - `editors`            : comptes des éditeurs du site (créés par un superuser) ;
 * - `associations`, `events`, `news` : données métier (miroir de src/data/*.json) ;
 * - `site_content`       : un seul enregistrement (`key = "main"`) contenant tous
 *                          les textes des pages (miroir de src/data/content.json) ;
 * - `content_revisions`  : historique automatique de `site_content` (cf. pb_hooks) ;
 * - `media`              : médiathèque (images téléversées depuis /admin).
 *
 * Lecture publique, écriture réservée aux éditeurs (les superusers passent outre
 * toutes les règles).
 */

const EDITOR_RULE = '@request.auth.collectionName = "editors"';
const SLUG_PATTERN = '^[a-z0-9][a-z0-9-]*$';
const DATE_PATTERN = '^\\d{4}-\\d{2}-\\d{2}$';
const IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];

/** Champs `created` / `updated` (non ajoutés automatiquement depuis la v0.23). */
const timestamps = () => [
  { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
  { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
];

const imageFile = (name) => ({
  name,
  type: 'file',
  maxSelect: 1,
  maxSize: 5 * 1024 * 1024,
  mimeTypes: IMAGE_MIME,
  thumbs: ['400x0'],
});

/** Règles d'une collection publique éditable par les éditeurs. */
const publicEditable = {
  listRule: '',
  viewRule: '',
  createRule: EDITOR_RULE,
  updateRule: EDITOR_RULE,
  deleteRule: EDITOR_RULE,
};

migrate(
  (app) => {
    /* ------------------------------------------------------------ editors */
    const editors = new Collection({
      type: 'auth',
      name: 'editors',
      listRule: 'id = @request.auth.id',
      viewRule: 'id = @request.auth.id',
      createRule: null,
      updateRule: 'id = @request.auth.id',
      deleteRule: null,
      passwordAuth: { enabled: true, identityFields: ['email'] },
      fields: [{ name: 'name', type: 'text', max: 120 }, ...timestamps()],
    });
    app.save(editors);

    /* ------------------------------------------------------- associations */
    app.save(
      new Collection({
        type: 'base',
        name: 'associations',
        ...publicEditable,
        fields: [
          { name: 'slug', type: 'text', required: true, max: 80, pattern: SLUG_PATTERN, presentable: true },
          { name: 'name', type: 'text', required: true, max: 120, presentable: true },
          { name: 'category', type: 'text', required: true, max: 60 },
          { name: 'description', type: 'text', required: true, max: 3000 },
          { name: 'email', type: 'text', max: 200 },
          { name: 'logo', type: 'text', max: 500 },
          imageFile('logoFile'),
          { name: 'imgClass', type: 'text', max: 300 },
          { name: 'games', type: 'text', max: 500 },
          { name: 'website', type: 'text', max: 500 },
          { name: 'city', type: 'text', max: 120 },
          { name: 'discord', type: 'text', max: 500 },
          { name: 'sort', type: 'number', onlyInt: true },
          ...timestamps(),
        ],
        indexes: ['CREATE UNIQUE INDEX idx_associations_slug ON associations (slug)'],
      })
    );

    /* ------------------------------------------------------------- events */
    app.save(
      new Collection({
        type: 'base',
        name: 'events',
        ...publicEditable,
        fields: [
          { name: 'slug', type: 'text', required: true, max: 80, pattern: SLUG_PATTERN, presentable: true },
          { name: 'title', type: 'text', required: true, max: 200, presentable: true },
          { name: 'date', type: 'text', required: true, pattern: DATE_PATTERN },
          { name: 'endDate', type: 'text', pattern: DATE_PATTERN },
          { name: 'category', type: 'text', required: true, max: 80 },
          { name: 'organizer', type: 'text', required: true, max: 200 },
          { name: 'description', type: 'text', required: true, max: 5000 },
          { name: 'badgeColor', type: 'select', maxSelect: 1, values: ['brand-red', 'white'] },
          { name: 'location', type: 'text', max: 300 },
          { name: 'url', type: 'text', max: 500 },
          { name: 'registrationUrl', type: 'text', max: 500 },
          { name: 'maxParticipants', type: 'number', onlyInt: true, min: 0 },
          { name: 'currentParticipants', type: 'number', onlyInt: true, min: 0 },
          { name: 'status', type: 'select', maxSelect: 1, values: ['open', 'full', 'cancelled'] },
          { name: 'image', type: 'text', max: 500 },
          imageFile('imageFile'),
          { name: 'associationId', type: 'text', max: 80 },
          ...timestamps(),
        ],
        indexes: ['CREATE UNIQUE INDEX idx_events_slug ON events (slug)'],
      })
    );

    /* --------------------------------------------------------------- news */
    app.save(
      new Collection({
        type: 'base',
        name: 'news',
        ...publicEditable,
        fields: [
          { name: 'slug', type: 'text', required: true, max: 80, pattern: SLUG_PATTERN, presentable: true },
          { name: 'title', type: 'text', required: true, max: 200, presentable: true },
          { name: 'date', type: 'text', required: true, pattern: DATE_PATTERN },
          { name: 'category', type: 'text', required: true, max: 80 },
          { name: 'excerpt', type: 'text', required: true, max: 1000 },
          { name: 'content', type: 'text', max: 50000 },
          { name: 'author', type: 'text', required: true, max: 120 },
          { name: 'image', type: 'text', max: 500 },
          imageFile('imageFile'),
          { name: 'featured', type: 'bool' },
          { name: 'readTime', type: 'number', onlyInt: true, min: 0 },
          ...timestamps(),
        ],
        indexes: ['CREATE UNIQUE INDEX idx_news_slug ON news (slug)'],
      })
    );

    /* ------------------------------------------------------- site_content */
    app.save(
      new Collection({
        type: 'base',
        name: 'site_content',
        listRule: '',
        viewRule: '',
        // Un seul enregistrement, créé par le script de seed (superuser).
        createRule: null,
        updateRule: EDITOR_RULE,
        deleteRule: null,
        fields: [
          { name: 'key', type: 'text', required: true, max: 40, presentable: true },
          { name: 'data', type: 'json', required: true, maxSize: 2 * 1024 * 1024 },
          { name: 'updatedBy', type: 'text', max: 200 },
          ...timestamps(),
        ],
        indexes: ['CREATE UNIQUE INDEX idx_site_content_key ON site_content (key)'],
      })
    );

    /* -------------------------------------------------- content_revisions */
    app.save(
      new Collection({
        type: 'base',
        name: 'content_revisions',
        listRule: EDITOR_RULE,
        viewRule: EDITOR_RULE,
        // Alimentée uniquement par le hook `site_content.pb.js`.
        createRule: null,
        updateRule: null,
        deleteRule: EDITOR_RULE,
        fields: [
          { name: 'contentKey', type: 'text', required: true, max: 40 },
          { name: 'data', type: 'json', required: true, maxSize: 2 * 1024 * 1024 },
          { name: 'author', type: 'text', max: 200, presentable: true },
          ...timestamps(),
        ],
        indexes: ['CREATE INDEX idx_content_revisions_created ON content_revisions (created)'],
      })
    );

    /* -------------------------------------------------------------- media */
    app.save(
      new Collection({
        type: 'base',
        name: 'media',
        ...publicEditable,
        fields: [
          {
            name: 'file',
            type: 'file',
            required: true,
            maxSelect: 1,
            maxSize: 10 * 1024 * 1024,
            mimeTypes: [...IMAGE_MIME, 'application/pdf'],
            thumbs: ['400x0'],
          },
          { name: 'title', type: 'text', max: 200, presentable: true },
          ...timestamps(),
        ],
      })
    );
  },
  (app) => {
    for (const name of [
      'media',
      'content_revisions',
      'site_content',
      'news',
      'events',
      'associations',
      'editors',
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch {
        // déjà supprimée
      }
    }
  }
);
