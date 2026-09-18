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
    <meta property="og:image" content="media/og-banner.jpg">
    <meta property="og:site_name" content="Toulouse Esport Connect">
    <meta property="og:locale" content="fr_FR">

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="https://toulouse-esport-connect.fr/">
    <meta name="twitter:title" content="Toulouse Esport Connect (TEC) – Réseau Esport Toulousain">
    <meta name="twitter:description" content="Fédération des acteurs de l'esport à Toulouse : annuaire des clubs, tournois et communauté active.">
    <meta name="twitter:image" content="media/og-banner.jpg">

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

    <!-- PostHog Analytics -->
    <script>
        !function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}p||((p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",p.onerror=function(){p=null},(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r));var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="vu fu pu gu bu init Hu zu qu ju Gu Xl Bu Qu Du eh ih nh sh rh oh capture getExtension Uu cu hh calculateEventProperties uh register register_once register_for_session unregister unregister_for_session gh Nu dh getFeatureFlag getFeatureFlagPayload getFeatureFlagResult getAllFeatureFlags isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync mh identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset yh shutdown setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty fh Xu createPersonProfile setInternalOrTestUser ph wu opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing Ju debug Yl Os getPageViewId captureTraceFeedback captureTraceMetric Ru".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
        posthog.init('phc_vpNtMCN68k4QKuEjygkt7WcqqTP7T8rfLj9JKEmE6KRN', {
            api_host: 'https://eu.i.posthog.com',
            defaults: '2026-05-30',
            person_profiles: 'identified_only',
            capture_pageleave: true
        })
    </script>
</head>

<body class="bg-brand-dark text-gray-100 font-sans min-h-screen flex flex-col antialiased selection:bg-brand-red selection:text-white">

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
    <script src="js/main.js?v=1.3.0"></script>
</body>

</html>
`;

  fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
  console.log(`✅ index.html generated successfully (${Buffer.byteLength(html, 'utf8')} bytes)`);
}

assembleHtml();
