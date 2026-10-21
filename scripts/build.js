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
const OUTPUT_HTML = path.join(ROOT_DIR, 'index.legacy.html');
const ASSOC_JSON_PATH = path.join(DATA_DIR, 'associations.json');
const EVENTS_JSON_PATH = path.join(DATA_DIR, 'evenements.json');
const NEWS_JSON_PATH = path.join(DATA_DIR, 'news.json');

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
                    <img src="${assoc.logo}" alt="Logo ${assoc.name}" width="96" height="96" loading="lazy" decoding="async" class="w-full h-full object-contain rounded-xl group-hover:scale-110 transition-transform duration-300 ${imgClass}">
                </div>
                <span class="font-bebas text-lg text-white group-hover:text-brand-redLight text-center leading-tight transition-colors">${assoc.name}</span>
            </button>`;
  }).join('\n\n');
}

function getEvents() {
  if (fs.existsSync(EVENTS_JSON_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(EVENTS_JSON_PATH, 'utf8'));
    } catch (e) {
      console.error('⚠️ Erreur lecture data/evenements.json:', e);
    }
  }
  return [];
}

function formatEventDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date).toUpperCase();
}

function renderEvents(events) {
  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  return sorted.map((event, idx) => {
    const day = formatEventDate(event.date).split(' ')[0];
    const month = formatEventDate(event.date).split(' ')[1];
    const badgeClass = event.badgeColor === 'brand-red'
      ? 'bg-brand-red/20 text-brand-redLight border border-brand-red/30'
      : 'bg-white/10 text-gray-300 border border-white/10';
    return `            <!-- Event ${idx + 1}: ${event.title} -->
            <div class="glass-card rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-brand-red/50 transition-all">
                <div class="flex items-center gap-6">
                    <div class="w-20 h-20 rounded-2xl bg-brand-dark border border-${event.badgeColor === 'brand-red' ? 'brand-red' : 'white'}/20 flex flex-col items-center justify-center text-center p-2 flex-shrink-0">
                        <span class="font-bebas text-2xl text-${event.badgeColor === 'brand-red' ? 'brand-redLight' : 'white'} leading-none">${day}</span>
                        <span class="text-[10px] font-rajdhani uppercase text-gray-400 font-bold">${month}</span>
                    </div>
                    <div>
                        <span class="px-2.5 py-0.5 rounded-md ${badgeClass} text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">${event.category}</span>
                        <h4 class="font-bebas text-2xl text-white">${event.title}</h4>
                        <p class="text-xs text-gray-300">Organisé par ${event.organizer} • ${event.description}</p>
                    </div>
                </div>
                <button type="button" onclick="trackEventInterest('${event.title}', '${event.organizer}'); showNotification('Rendez-vous ${event.title} enregistré dans vos rappels !');"
                    class="px-6 py-2.5 bg-brand-dark hover:bg-brand-red text-white text-xs font-rajdhani font-bold uppercase tracking-wider rounded-xl transition-colors border border-brand-cardBorder flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-red">
                    Rejoindre
                </button>
            </div>`;
  }).join('\n\n');
}

function getNews() {
  if (fs.existsSync(NEWS_JSON_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(NEWS_JSON_PATH, 'utf8'));
    } catch (e) {
      console.error('⚠️ Erreur lecture data/news.json:', e);
    }
  }
  return [];
}

function formatNewsDate(dateStr) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr + 'T00:00:00'));
}

function renderNews(newsList) {
  const sorted = [...newsList].sort((a, b) => new Date(b.date) - new Date(a.date));
  return sorted.map((news, idx) => {
    return `            <!-- Article ${idx + 1}: ${news.title} -->
            <article id="article-${news.id}" class="glass-card rounded-2xl p-6 border border-white/10 hover:border-brand-red/50 transition-all flex flex-col">
                <div class="flex-shrink-0 mb-4">
                    <span class="px-3 py-1 rounded-full bg-brand-red/20 text-brand-redLight text-[10px] font-rajdhani font-bold uppercase tracking-wider border border-brand-red/30 inline-flex mb-3">${news.category}</span>
                    <span class="text-[10px] text-gray-500 font-rajdhani">${formatNewsDate(news.date)}</span>
                </div>
                <h3 class="font-bebas text-2xl sm:text-3xl text-white mb-3 leading-tight">${news.title}</h3>
                <p class="text-gray-300 text-sm leading-relaxed mb-6 flex-grow">${news.excerpt}</p>
                <div class="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <a href="#article-${news.id}" onclick="switchTab('news', true, false); scrollToArticle('${news.id}'); return false;"
                        class="text-brand-redLight font-rajdhani font-bold text-xs uppercase tracking-wider hover:underline transition-colors">
                        Lire la suite →
                    </a>
                    <span class="text-[10px] text-gray-500 font-rajdhani">${news.author}</span>
                </div>
            </article>`;
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
      /\{\{ASSOC_LOGO_GRID\}\}/,
      gridHtml
    );
  }

  const eventsList = getEvents();
  console.log(`📅 Loaded ${eventsList.length} events from data/evenements.json`);

  let evenements = readSection('evenements.html');
  if (eventsList.length > 0) {
    const eventsHtml = renderEvents(eventsList);
    evenements = evenements.replace(
      /\{\{EVENTS_LIST\}\}/,
      eventsHtml
    );
  }

  const footer = readSection('footer.html');
  const modalToast = readSection('modal-toast.html');
  const cookieBanner = readSection('cookie-banner.html');

  const newsList = getNews();
  console.log(`📰 Loaded ${newsList.length} news from data/news.json`);

  let news = readSection('news.html');
  if (newsList.length > 0) {
    const newsHtml = renderNews(newsList);
    news = news.replace(
      /\{\{NEWS_LIST\}\}/,
      newsHtml
    );
  }

  const html = `<!DOCTYPE html>
<html lang="fr-FR" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Toulouse Esport Connect – Le réseau des associations esport toulousaines</title>
    <meta name="description" content="Toulouse Esport Connect fédère et accompagne les associations, joueurs, créateurs et acteurs locaux pour développer l'écosystème de l'esport dans la Ville Rose.">
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
    <meta property="og:description" content="Fédération des acteurs de l'esport à Toulouse : annuaire des clubs, agenda des tournois, projets collectifs et communauté Discord.">
    <meta property="og:image" content="media/og-banner.webp">
    <meta property="og:site_name" content="Toulouse Esport Connect">
    <meta property="og:locale" content="fr_FR">

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="https://toulouse-esport-connect.fr/">
    <meta name="twitter:title" content="Toulouse Esport Connect (TEC) – Réseau Esport Toulousain">
    <meta name="twitter:description" content="Fédération des acteurs de l'esport à Toulouse : annuaire des clubs, tournois et communauté active.">
    <meta name="twitter:image" content="media/og-banner.webp">

    <!-- Schema.org JSON-LD (SportsOrganization) -->
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
        }
      ]
    }
    </script>

    <!-- Self-hosted fonts -->
    <link rel="stylesheet" href="media/fonts/fonts.css">

    <!-- FontAwesome Icons (self-hosted) -->
    <link rel="stylesheet" href="media/fontawesome/all.min.css">

    <!-- Compiled Static Tailwind CSS (High Performance, No Runtime CDN) -->
    <link rel="stylesheet" href="css/tailwind.min.css">

    <!-- Custom Theme Stylesheet -->
    <link rel="stylesheet" href="css/style.css">

    <!-- PostHog Analytics (loaded dynamically after cookie consent) -->
    <script id="posthog-script" src="" defer></script>
</head>

<body class="bg-brand-dark text-gray-100 font-sans min-h-screen flex flex-col antialiased selection:bg-brand-red selection:text-white">

    ${header}

    <!-- ==========================================================================
       MAIN CONTENT CONTAINER
       ========================================================================== -->
    <main id="main-content" class="flex-grow">
        ${accueil}
        ${quiSommesNous}
        ${associations}
        ${evenements}
        ${news}
    </main>

    ${footer}

    ${modalToast}

    ${cookieBanner}

    <!-- Associations Data (JSON) -->
    <script type="application/json" id="associations-data">
${JSON.stringify(associationsList, null, 2)}
    </script>

    <!-- Application Script (Cache Busted, ES Module) -->
    <script type="module" src="js/main.js?v=1.3.0"></script>
</body>

</html>
`;

  fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
  console.log(`✅ index.html generated successfully (${Buffer.byteLength(html, 'utf8')} bytes)`);
}

assembleHtml();