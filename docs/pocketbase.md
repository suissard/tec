# 🗄️ PocketBase : contenu éditable en ligne

Le contenu du site (textes des pages, associations, événements, actualités) peut
être géré dans une base [PocketBase](https://pocketbase.io) au lieu des JSON de
`src/data/`. Les éditeurs modifient alors le site **sans redéploiement** :

- **`/admin`** : connexion + gestion complète (textes, associations,
  événements, actualités, médiathèque, historique) ;
- **`?edit`** sur n'importe quelle page (ex. `/?edit`, `/contact?edit`, ou
  `/#/?edit` en hash routing) : **mode édition visuel**, on clique sur un texte
  du site pour le modifier.

PocketBase est **facultatif** : sans `VITE_POCKETBASE_URL`, le site fonctionne
exactement comme avant (100 % JSON). Avec l'URL, les JSON restent le **repli
automatique** si la base est injoignable.

---

## 1. Démarrage local (5 minutes)

```bash
cp .env.example .env.local   # puis choisissez les identifiants
npm run pb:install           # télécharge PocketBase 0.40.6 dans pocketbase/
npm run pb:serve             # http://127.0.0.1:8090 (crée la base + le superuser au 1er lancement)
```

Dans un second terminal :

```bash
npm run pb:seed              # importe src/data/*.json + crée le compte éditeur
npm run dev                  # le site lit maintenant PocketBase
```

Puis ouvrez `http://localhost:3000/admin` et connectez-vous avec
`PB_EDITOR_EMAIL` / `PB_EDITOR_PASSWORD` (ou le superuser).

| Commande | Rôle |
|---|---|
| `npm run pb:install` | Télécharge le binaire (`--force` pour réinstaller) |
| `npm run pb:serve` | Lance PocketBase avec les migrations et hooks du dépôt |
| `npm run pb:seed` | JSON → base. Met à jour par identifiant ; ne touche pas aux textes déjà en base (`-- --force` pour les écraser, `-- --prune` pour supprimer ce qui n'est plus dans les JSON) |
| `npm run pb:export` | Base → JSON (`src/data/`). Pour versionner l'état en ligne ou rafraîchir les JSON de repli |

Console d'administration PocketBase (superuser) : `http://127.0.0.1:8090/_/`.

---

## 2. Modèle de données

Défini par la migration [`pocketbase/pb_migrations/1762900000_init_tec_collections.js`](../pocketbase/pb_migrations/1762900000_init_tec_collections.js)
(appliquée automatiquement au démarrage de PocketBase).

| Collection | Contenu | Lecture | Écriture |
|---|---|---|---|
| `editors` | Comptes éditeurs (e-mail + mot de passe) | soi-même | superuser (création), soi-même |
| `associations` | Miroir de `associations.json` (+ `logoFile`, `sort`) | publique | éditeurs |
| `events` | Miroir de `evenements.json` (+ `imageFile`) | publique | éditeurs |
| `news` | Miroir de `news.json` (+ `imageFile`) | publique | éditeurs |
| `site_content` | **Un** enregistrement `key = "main"` : tout `content.json` dans le champ `data` | publique | éditeurs (modification) |
| `content_revisions` | Version précédente de `site_content` à chaque enregistrement (50 dernières) | éditeurs | hook uniquement |
| `media` | Médiathèque (images, PDF) | publique | éditeurs |

- L'**identifiant** visible dans les URL (`osv-esport`) est le champ `slug` ;
  le site le convertit en `id` comme dans les JSON.
- **Images** : un fichier téléversé (`logoFile`, `imageFile`) est prioritaire
  sur le chemin saisi (`logo`, `image`, ex. `/media/logo.png`).
- **Historique** : le hook [`pb_hooks/site_content.pb.js`](../pocketbase/pb_hooks/site_content.pb.js)
  archive la version précédente et note l'auteur (`updatedBy`).

### Ajouter un éditeur

Console PocketBase (`/_/`) → collection **editors** → *New record* (e-mail,
mot de passe, nom). Seul un superuser peut créer des comptes : pas
d'inscription publique.

---

## 3. Côté site

| Fichier | Rôle |
|---|---|
| [`src/services/pocketbase.ts`](../src/services/pocketbase.ts) | Lecture publique (REST, **sans SDK** : le bundle visiteur reste léger) + conversion enregistrement → types du site |
| [`src/services/api.ts`](../src/services/api.ts) | PocketBase d'abord, repli JSON en cas d'erreur |
| [`src/utils/content.ts`](../src/utils/content.ts) | `content` **réactif** ; `loadRemoteContent()` appelé avant le montage de l'app (1,5 s max), fusion avec les textes embarqués puis validation Zod |
| [`src/editor/`](../src/editor/) | Mode édition + composants partagés (chargés à la demande, SDK PocketBase inclus) |
| [`src/admin/`](../src/admin/) | Pages de `/admin` |

Points de conception :

- **Pas de flash de contenu** : l'app attend les textes PocketBase (1,5 s max)
  avant le premier rendu ; au-delà, les textes du build s'affichent.
- **Tolérance aux évolutions** : un texte ajouté dans le code (nouvelle clé de
  `content.json`) prend sa valeur par défaut tant qu'il n'existe pas en base.
- **Contenu invalide** en base : ignoré (textes du build affichés), avec
  avertissement dans l'éditeur. Toute sauvegarde est validée par le même schéma
  (`contentSchema.ts`) que le build.
- **Conflits** : si quelqu'un a enregistré entre-temps, l'éditeur demande
  confirmation avant d'écraser (la version écrasée reste dans l'historique).
- `/admin` n'est pas indexé (`noindex`) et n'utilise ni en-tête ni pied de page.

### Mode édition (`?edit`)

- Les textes reconnus sont **encadrés en pointillés rouges** : clic → saisie
  directe (Entrée valide, Échap annule) ;
- textes avec liens / retours à la ligne, titres bicolores ou textes présents à
  plusieurs endroits : le clic ouvre le **panneau latéral** sur le bon champ ;
- le panneau donne accès à **tous** les textes de la page (onglet *Cette page*)
  et aux parties communes (menu, pied de page, cookies… onglet *Commun*) ;
- les cartes d'associations, événements, actualités ont un badge **✎ Modifier** ;
- **Naviguer** (ou Alt + clic) suit les liens sans éditer ; **Ctrl + S** enregistre ;
- le mode reste actif de page en page jusqu'à **Quitter**.

Le rapprochement texte affiché ↔ champ se fait par comparaison de texte (sans
annoter les templates), limité à la zone de la page (en-tête → `navigation`,
pied de page → `layout.footer`, contenu → `pages.<page courante>`). Un texte
calculé (ex. pluriel, majuscules forcées par JS) reste modifiable via le panneau.

---

## 4. Production

1. **Héberger PocketBase** (un seul binaire + un dossier de données) :
   - image Docker fournie : [`pocketbase/Dockerfile`](../pocketbase/Dockerfile)
     (volume `/pb/pb_data` à sauvegarder) — Fly.io, Railway, un VPS… ;
   - ou [PocketHost](https://pockethost.io) / tout hébergeur PocketBase : copiez
     `pb_migrations/` et `pb_hooks/` à côté du binaire.
   - HTTPS obligatoire (le site GitHub Pages est en HTTPS).
2. Créer le superuser (`pocketbase superuser upsert email motdepasse`), puis
   importer le contenu depuis votre poste :
   ```bash
   VITE_POCKETBASE_URL=https://pb.exemple.fr PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… \
   PB_EDITOR_EMAIL=… PB_EDITOR_PASSWORD=… npm run pb:seed
   ```
3. Dans GitHub → *Settings → Secrets and variables → Actions → Variables*,
   créer **`POCKETBASE_URL`** = `https://pb.exemple.fr` puis relancer le
   déploiement. (Variable vide ou absente = site 100 % JSON.)
4. Console PocketBase → *Settings* : renseigner l'URL de l'application et,
   idéalement, restreindre les origines CORS au domaine du site.

> Les modifications faites dans `/admin` sont **immédiatement en ligne**. Les
> JSON de `src/data/` ne servent plus que de repli : pensez à lancer
> `npm run pb:export` de temps en temps (et à committer) pour les garder à jour.
