# ✏️ Modifier les textes du site

Tous les textes des pages sont regroupés dans **un seul fichier** :
[`src/data/content.json`](../src/data/content.json).

Le fichier est intégré au site **au moment du build** : une modification est en
ligne au prochain déploiement (push sur `main` → workflow *Deploy*). En local,
`npm run dev` recharge la page dès la sauvegarde.

> Les listes d'**associations**, d'**événements** et d'**actualités** ne sont pas
> dans ce fichier : elles vivent dans [`data/`](../data/) (`associations.json`,
> `evenements.json`, `news.json`).

---

## Organisation du fichier

| Clé | Contenu |
|---|---|
| `site` | Nom, description par défaut (SEO), réseaux sociaux |
| `navigation` | Menu de l'en-tête (desktop et mobile), bouton Discord |
| `layout` | Bandeau des chiffres clés, appel à l'adhésion, pied de page, bannière cookies |
| `pages.<page>` | Textes de chaque page : `home`, `about`, `events`, `news`, `associations`, `contact`, `legal`, `volunteer`, `adhesion`, `notFound` |

Chaque page possède un bloc `meta` : `title` (titre de l'onglet, suivi de
`| TEC`) et `description` (résumé affiché par les moteurs de recherche).

## Règles d'écriture

- **Titres en deux couleurs** : le **dernier mot** d'un titre (`hero.title`,
  `events.title`…) s'affiche en rouge. Pour mettre en rouge plusieurs mots,
  ajoutez `"highlight": "fin du titre"`.
- **Retour à la ligne** : `\n` dans le texte.
- **Lien** : syntaxe Markdown `[texte du lien](cible)` :
  - page du site : `[nos mentions légales](/mentions-legales)` ;
  - ancre de la page courante : `[Cookies](#cookies)` ;
  - email : `[contact@tec-asso.fr](mailto:contact@tec-asso.fr)` ;
  - site externe (nouvel onglet) : `[Discord](https://discord.gg/…)`.
- Le HTML n'est **pas** interprété (il s'affiche tel quel).
- **Boutons et liens de menu** : `{ "label": "…", "route": "Events" }`. Valeurs
  de `route` possibles : `Home`, `About`, `Events`, `News`, `Associations`,
  `Contact`, `Legal`, `Volunteer`, `Adhesion`. Ancre facultative :
  `"hash": "rgpd"`.
- Les listes (FAQ, jalons, membres du bureau, partenaires, sections des mentions
  légales, formules d'adhésion…) acceptent l'ajout, la suppression et le
  réordonnancement d'éléments.

## Contrôle automatique

Le fichier est vérifié par le schéma
[`src/utils/contentSchema.ts`](../src/utils/contentSchema.ts). En cas d'erreur
(texte vide, clé mal orthographiée, route inconnue, JSON mal formé), **le build
échoue** et liste les champs à corriger, par exemple :

```
[content] src/data/content.json contient 2 erreur(s) :
  - pages.home.hero.primaryButton.route : Option invalide : une valeur parmi "Home"|… attendue
  - pages.about.mission : Clé non reconnue : "titre"
```

Le site en ligne n'est donc jamais remplacé par une version cassée. Pour vérifier
avant de pousser : `npm run build` (ou `npm run test:unit`).

## Hors du fichier

Restent dans le code : les libellés des champs de formulaire et leurs messages de
validation (liés aux règles Zod de `src/utils/validation.ts`), les messages
techniques (notifications d'erreur) et les libellés d'accessibilité.
