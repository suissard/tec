# 🎮 Toulouse Esport Connect (TEC)

> **Le réseau fédérateur des associations esportives et vidéoludiques toulousaines.**

Bienvenue sur le dépôt du site officiel de **Toulouse Esport Connect (TEC)**, association Loi 1901 dédiée à la valorisation, l'accompagnement et la mise en réseau des acteurs du jeu vidéo et de l'esport dans la métropole toulousaine et en région Occitanie.

---

## 📌 Présentation du Projet

**Toulouse Esport Connect** rassemble les associations, joueurs compétitifs, passionnés, créateurs de contenus et organisateurs d'événements afin de structurer et dynamiser l'écosystème local.

Le site web a été conçu comme une **Single Page Application (SPA)** fluide, moderne et responsive, offrant une expérience immersive inspirée des codes graphiques de l'esport contemporain (dark mode, glassmorphism, néons et accents carmin).

---

## ✨ Fonctionnalités Principales

L'application intègre une navigation fluide sans rechargement de page, découpée en 5 univers principaux :

### 1. 🏠 Accueil
- **Hero Banner** dynamique avec typographie percutante et badges lumineux.
- **Compteurs clés** mettant en avant l'impact du collectif (associations membres, événements annuels, communauté de joueurs).
- **Points d'entrée rapides** vers l'annuaire associatif et le calendrier événementiel.

### 2. 🎯 Notre Projet
- **3 piliers fondamentaux** détaillant la feuille de route du réseau :
  1. *Réseau d'Associations* : mutualisation des ressources, matériels et synergies locales.
  2. *Organisation d'Événements* : portage de projets d'envergure (notamment l'*Occitanie Gaming Festival*).
  3. *Développement Local* : accompagnement des clubs amateurs et formation citoyenne / étudiante.
- **Gouvernance & Bureau associatif** : présentation de l'équipe dirigeante.
- **Formulaire d'adhésion interactif** avec ancre de défilement fluide (`scrollToAdhesion()`) pour les structures candidates.

### 3. 👥 Annuaire des Associations Membres
- **Filtrage par catégorie en temps réel** :
  - `Toutes les Associations`
  - `Esport` (Oserv Esport, Dragon Esport, Lightning Project...)
  - `Versus Fighting` (Toulouse Versus Fighting)
  - `Rétrogaming & LAN` (Voxel)
  - `Étudiant & Communauté` (fLUKY BOYS)
- **Modale dynamique interactive** au clic sur chaque logo avec :
  - Présentation détaillée de l'association.
  - Titres et jeux compétitifs couverts (LoL, Valorant, Street Fighter 6, Tekken 8, Rocket League, etc.).
  - Coordonnées directes et lien de contact.
  - Accessibilité au clavier (fermeture avec la touche `Échap` ou clic en dehors).

### 4. 📅 Agenda & Événements
- **Mise en avant de l'événement phare** : focus complet sur l'*Occitanie Gaming Festival* (lieu, dates, disciplines, billetterie).
- **Planning des rendez-vous à venir** : rankings mensuels, qualifications régionales et LANs communautaires.
- **Système de notification toast** informant l'utilisateur de la prise en compte de ses interactions.

### 5. 🤝 Qui sommes-nous ? & Contact
- Présentation de la mission et des valeurs de TEC (*Inclusivité*, *Proximité*, *Éco-responsabilité*).
- **Formulaire de contact direct** avec feedback instantané.
- **Pied de page complet** avec liens rapides, coordonnées de contact et réseaux sociaux (Discord, Instagram, X/Twitter).

---

## 🎨 Charte Graphique & Design System

Le design repose sur une palette sombre et intense contrastée par le rouge emblématique :

| Élément | Valeur / Règle | Rôle |
|---|---|---|
| **Brand Red** | `#E30613` / `#BF000B` (hover) | Couleur d'accent principale, boutons CTA, halos lumineux |
| **Brand Dark** | `#0B0B0E` | Fond sombre profond |
| **Card Background** | `#141419` & `rgba(20, 20, 25, 0.85)` | Cartes avec flou d'arrière-plan (*glassmorphism*) |
| **Borders** | `#262630` / `rgba(255, 255, 255, 0.08)` | Délimitations subtiles |
| **Typographie Titres** | `'Bebas Neue', sans-serif` | Titraille esport imposante et lisible |
| **Typographie Accents** | `'Rajdhani', sans-serif` | Badges, libellés, dates et CTA |
| **Typographie Corps** | `'Inter', sans-serif` | Lecture fluide et ergonomique des textes |

---

## 🛠️ Technologies Utilisées

- **HTML5 Sémantique & A11y** : balisage accessible, hiérarchie de titres respectée (1 seul `<h1>`), cartes accessibles au clavier (`<button>`) et référencement optimisé (SEO & JSON-LD).
- **Tailwind CSS (Compilé & Minifié)** : feuilles de style statiques compilées (`css/tailwind.min.css`) sans CDN au runtime pour des performances optimales (Core Web Vitals).
- **CSS3 personnalisé** : scrollbar personnalisée, effets de lueur (*glow*), motifs de grille en fond et transitions d'onglets définis dans [`css/style.css`](file:///home/suissard/PROGRAMMATIONS/tec/css/style.css).
- **Vanilla JavaScript (ES6+)** : routage SPA par Hash (`#associations`, `#evenements`) et `History API`, gestion du bouton retour navigateur, modale accessible avec capture de focus, et persistance des leads (OGF) dans [`js/main.js`](file:///home/suissard/PROGRAMMATIONS/tec/js/main.js).
- **Google Fonts** : *Bebas Neue*, *Rajdhani*, *Inter*.
- **FontAwesome 6** : icônes vectorielles.

---

## 📁 Arborescence du Projet

```text
tec/
├── index.html                  # Application SPA assemblée prête au déploiement
├── package.json                # Scripts npm de build et dépendances
├── tailwind.config.js          # Configuration Tailwind (couleurs brand, polices, content)
├── README.md                   # Documentation du projet
├── TODO.md                     # Suivi des points d'amélioration
├── scripts/
│   └── build.js                # Script d'assemblage modulaire (sections -> index.html)
├── css/
│   ├── input.css               # Point d'entrée Tailwind CLI
│   ├── tailwind.min.css        # CSS statique compilé et minifié (24KB)
│   └── style.css               # Effets visuels, animations, glassmorphism & scrollbar
├── js/
│   └── main.js                 # Routage SPA, historique, modale accessible et leads
├── sections/                   # Composants modulaires synchronisés
│   ├── header.html             # En-tête avec bouton Discord (+500) et navigation
│   ├── accueil.html            # Hero banner, statistiques et hub Discord
│   ├── projet.html             # Piliers, bureau associatif (photos réelles) et adhésion
│   ├── associations.html       # Galerie accessible des associations affiliées
│   ├── evenements.html         # Agenda & module d'alerte billetterie OGF
│   ├── qui-sommes-nous.html    # Valeurs et formulaire de contact
│   ├── footer.html             # Pied de page et liens sociaux
│   └── modal-toast.html        # Boîte de dialogue accessible & notifications
└── media/                      # Médias, logos et photos du site (dossier normalisé Linux)
    ├── favicon.svg             # Favicon officiel vectoriel TEC
    ├── og-banner.jpg           # Bannière Open Graph / Twitter Card
    ├── team/                   # Photos des membres du bureau associatif
    │   ├── julien-paltou.jpg
    │   ├── esperita.jpg
    │   └── roro.jpg
    ├── oserv-transparent.png
    ├── voxel-transparent.png
    ├── dragon-transparent.png
    ├── fluky-boys-transparent.png
    ├── lightning-transparent.png
    └── tvsf-transparent.png
```

---

## 🚀 Démarrage Rapide & Build

### Commandes de Build

```bash
# Assembler le HTML et compiler Tailwind CSS :
npm run build

# Compiler uniquement Tailwind CSS (minifié) :
npm run build:css

# Recompiler automatiquement Tailwind en mode surveillance (watch) :
npm run watch:css

# Lancer un serveur de développement local :
npm run dev
```

### Option : Serveur local léger
Accédez simplement à : `http://localhost:8080`

---

## 🌐 Liens & Contact

- **Email Officiel** : [contact@toulouse-esport-connect.fr](mailto:contact@toulouse-esport-connect.fr)
- **Discord** : [Rejoindre le serveur communautaire](https://discord.gg/VH98qQWEhh)
- **Instagram** : [@toulouseec__](https://www.instagram.com/toulouseec__/)
- **Siège Social** : Toulouse, Haute-Garonne (31), France

---

## 📄 Licence & Droits

© 2026 **Toulouse Esport Connect**. Tous droits réservés.  
Les logos des structures partenaires et associations affiliées restent la propriété intellectuelle exclusive de leurs détenteurs respectifs.
