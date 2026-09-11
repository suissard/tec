#!/usr/bin/env node
/**
 * Toulouse Esport Connect - Build Script
 * Assembles modular components from sections/ into a production-ready index.html
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SECTIONS_DIR = path.join(ROOT_DIR, 'sections');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const OUTPUT_HTML = path.join(ROOT_DIR, 'index.html');
const ASSOC_JSON_PATH = path.join(DATA_DIR, 'associations.json');

function readSection(fileName) {
  const filePath = path.join(SECTIONS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Section file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8').trim();
}

function getAssociations() {
  if (fs.existsSync(ASSOC_JSON_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(ASSOC_JSON_PATH, 'utf8'));
    } catch (e) {
      console.error('⚠️ Erreur lecture data/associations.json:', e);
    }
  }
  return [];
}

function renderAssocGrid(associations) {
  return associations.map((assoc, idx) => {
    const imgClass = assoc.imgClass || '';
    return `            <!-- ${idx + 1}. ${assoc.name} -->
            <button type="button" class="logo-item text-center glass-card rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer group hover:scale-105 hover:border-brand-red focus:border-brand-red focus:ring-2 focus:ring-brand-red focus:outline-none transition-all duration-300 w-full"
                data-cat="${assoc.category}"
                data-id="${assoc.id}"
                aria-haspopup="dialog"
                aria-label="Voir la fiche détaillée de ${assoc.name}"
                onclick="openModalById('${assoc.id}', this)">
                <div class="w-24 h-24 rounded-2xl assoc-logo-badge border-2 border-transparent group-hover:border-brand-red flex items-center justify-center shadow-xl transition-all overflow-hidden p-2.5">
                    <img src="${assoc.logo}" alt="Logo ${assoc.name}" width="96" height="96" loading="lazy" class="w-full h-full object-contain rounded-xl group-hover:scale-110 transition-transform duration-300 ${imgClass}">
                </div>
                <span class="font-bebas text-lg text-white group-hover:text-brand-redLight text-center leading-tight transition-colors">${assoc.name}</span>
            </button>`;
  }).join('\n\n');
}

function assembleHtml() {
  console.log('🔨 Assembling sections into index.html...');

  const associationsList = getAssociations();
  console.log(`📦 Loaded ${associationsList.length} associations from data/associations.json`);

  const header = readSection('header.html');
  const accueil = readSection('accueil.html');
  const quiSommesNous = readSection('qui-sommes-nous.html');
  let associations = readSection('associations.html');

  if (associationsList.length > 0) {
    const gridHtml = renderAssocGrid(associationsList);
    associations = associations.replace(
      /(<div class="grid [^"]*" id="logo-grid">)[\s\S]*?(<\/div>\s*<!-- \/LOGO-GRID -->)/,
      `$1\n\n${gridHtml}\n\n        $2`
    );
    // Sync clean grid back to sections/associations.html
    const assocSectionPath = path.join(SECTIONS_DIR, 'associations.html');
    fs.writeFileSync(assocSectionPath, associations + '\n', 'utf8');
  }

  const evenements = readSection('evenements.html');
  const footer = readSection('footer.html');
  const modalToast = readSection('modal-toast.html');

  const html = `<!DOCTYPE html>
<html lang="fr-FR" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Toulouse Esport Connect – Le réseau des associations esport toulousaines</title>
    <meta name="description" content="Toulouse Esport Connect fédère et accompagne les associations, joueurs, créateurs et acteurs locaux pour développer l'écosystème du jeu vidéo dans la Ville Rose.">
    <meta name="theme-color" content="#E30613">

    <!-- Canonical URL -->
    <link rel="canonical" href="https://toulouse-esport-connect.fr/">

    <!-- Favicons -->
    <link rel="icon" type="image/svg+xml" href="media/favicon.svg">
    <link rel="apple-touch-icon" href="media/favicon.svg">

    <!-- Open Graph / Facebook / Discord -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://toulouse-esport-connect.fr/">
    <meta property="og:title" content="Toulouse Esport Connect (TEC) – Réseau des associations esport toulousaines">
    <meta property="og:description" content="Fédération des acteurs du jeu vidéo et de l'esport à Toulouse : annuaire des clubs, agenda des tournois, projets collectifs et communauté Discord.">
    <meta property="og:image" content="media/og-banner.jpg">
    <meta property="og:site_name" content="Toulouse Esport Connect">
    <meta property="og:locale" content="fr_FR">

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="https://toulouse-esport-connect.fr/">
    <meta name="twitter:title" content="Toulouse Esport Connect (TEC) – Réseau Esport Toulousain">
    <meta name="twitter:description" content="Fédération des acteurs du jeu vidéo et de l'esport à Toulouse : annuaire des clubs, tournois et communauté active.">
    <meta name="twitter:image" content="media/og-banner.jpg">

    <!-- Schema.org JSON-LD (SportsOrganization & Event) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SportsOrganization",
          "@id": "https://toulouse-esport-connect.fr/#organization",
          "name": "Toulouse Esport Connect",
          "alternateName": "TEC",
          "url": "https://toulouse-esport-connect.fr/",
          "logo": "https://toulouse-esport-connect.fr/media/logo-clair.svg",
          "description": "Fédération associative pour le développement et la promotion de l'esport à Toulouse et en Occitanie.",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Toulouse",
            "addressRegion": "Occitanie",
            "postalCode": "31000",
            "addressCountry": "FR"
          },
          "sameAs": [
            "https://discord.gg/VH98qQWEhh",
            "https://www.instagram.com/toulouseec__/"
          ]
        },
        {
          "@type": "Event",
          "@id": "https://toulouse-esport-connect.fr/#ogf2026",
          "name": "Occitanie Gaming Festival 2026",
          "description": "Le grand festival et rendez-vous esport annuel réunissant plus de 500 joueurs en compétition, scènes tournois et espaces découvertes.",
          "startDate": "2026-08-11T09:00:00+02:00",
          "endDate": "2026-08-12T20:00:00+02:00",
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
          "eventStatus": "https://schema.org/EventScheduled",
          "location": {
            "@type": "Place",
            "name": "Hall 8 - Parc des Expositions",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Toulouse",
              "postalCode": "31400",
              "addressCountry": "FR"
            }
          },
          "organizer": {
            "@id": "https://toulouse-esport-connect.fr/#organization"
          }
        }
      ]
    }
    </script>

    <!-- Google Fonts Preconnect & Stylesheet -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700;800&family=Rajdhani:wght@600;700&display=swap" rel="stylesheet">

    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- Compiled Static Tailwind CSS (High Performance, No Runtime CDN) -->
    <link rel="stylesheet" href="css/tailwind.min.css">

    <!-- Custom Theme Stylesheet -->
    <link rel="stylesheet" href="css/style.css">
</head>

<body class="bg-brand-dark text-gray-100 font-sans min-h-screen flex flex-col antialiased selection:bg-brand-red selection:text-white bg-grid-pattern">

    ${header}

    <!-- ==========================================================================
       MAIN CONTENT CONTAINER (4 PAGES)
       ========================================================================== -->
    <main class="flex-grow">
        ${accueil}
        ${quiSommesNous}
        ${associations}
        ${evenements}
    </main>

    ${footer}

    ${modalToast}

    <!-- Associations Data (JSON) -->
    <script type="application/json" id="associations-data">
${JSON.stringify(associationsList, null, 2)}
    </script>

    <!-- Application Script (Cache Busted) -->
    <script src="js/main.js?v=1.2.0"></script>
</body>

</html>
`;

  fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
  console.log(`✅ index.html generated successfully (${Buffer.byteLength(html, 'utf8')} bytes)`);
}

assembleHtml();
