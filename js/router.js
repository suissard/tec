/* ==========================================================================
   Toulouse Esport Connect - Router Module
   SPA navigation with Hash + History API
   ========================================================================== */

import { trackEvent } from './tracking.js';

export const VALID_PAGES = ['accueil', 'qui-sommes-nous', 'associations', 'evenements'];

export const PAGE_TITLES = {
    'accueil': 'Toulouse Esport Connect – Le réseau des associations esport toulousaines',
    'qui-sommes-nous': 'Qui sommes-nous ? – Toulouse Esport Connect',
    'associations': 'Associations Membres & Adhésion – Toulouse Esport Connect',
    'evenements': 'Événements & Tournois – Toulouse Esport Connect'
};

/**
 * Switch active page view (SPA navigation with History & Hash support)
 * @param {string} pageId - Target page identifier (e.g. 'accueil', 'projet')
 * @param {boolean} [pushState=true] - Whether to update window history
 * @param {boolean} [scrollToTop=true] - Whether to scroll to top of window
 */
export function switchTab(pageId, pushState = true, scrollToTop = true) {
    let resolvedPageId = pageId;
    if (pageId === 'projet') {
        resolvedPageId = 'qui-sommes-nous';
    }
    const targetId = VALID_PAGES.includes(resolvedPageId) ? resolvedPageId : 'accueil';

    // Hide all pages
    const pages = document.querySelectorAll('.page-view');
    pages.forEach(p => p.classList.remove('active'));

    // Show target page
    const targetPage = document.getElementById('page-' + targetId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update Desktop Nav styles
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('text-brand-redLight', 'font-bold');
        link.classList.add('text-gray-400');
    });

    const activeNav = document.getElementById('nav-' + targetId);
    if (activeNav) {
        activeNav.classList.add('text-brand-redLight', 'font-bold');
        activeNav.classList.remove('text-gray-400');
    }

    // Update Browser History & URL Hash
    if (pushState) {
        if (window.location.hash.replace('#', '') !== targetId) {
            history.pushState({ page: targetId }, '', '#' + targetId);
        }
    }

    // Update Document Title for SEO & Tabs
    if (PAGE_TITLES[targetId]) {
        document.title = PAGE_TITLES[targetId];
    }

    // PostHog SPA Pageview & Navigation Tracking
    trackEvent('$pageview', {
        $current_url: window.location.href,
        page_id: targetId,
        page_title: PAGE_TITLES[targetId] || targetId
    });
    trackEvent('page_view_spa', {
        page_id: targetId,
        page_title: PAGE_TITLES[targetId] || targetId
    });

    // If opening associations tab, adjust slider height after DOM layout
    if (targetId === 'associations') {
        setTimeout(() => {
            if (typeof window.updateRejoindreSliderHeight === 'function') {
                window.updateRejoindreSliderHeight();
            }
        }, 60);
    }

    // Smooth scroll to top if requested
    if (scrollToTop) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Toggle mobile navigation dropdown
 */
export function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenu) {
        const isHidden = mobileMenu.classList.toggle('hidden');
        if (mobileBtn) {
            mobileBtn.setAttribute('aria-expanded', !isHidden);
        }
    }
}

/**
 * Smoothly scroll to the adhesion section on the Associations page with header offset
 */
export function scrollToAdhesion() {
    const assocPage = document.getElementById('page-associations');
    if (!assocPage || !assocPage.classList.contains('active')) {
        switchTab('associations', true, false);
    }
    setTimeout(() => {
        const el = document.getElementById('section-adhesion');
        if (el) {
            const headerOffset = 90;
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    }, 120);
}

/**
 * Smoothly scroll to the benevolat section on the Associations page with header offset
 */
export function scrollToBenevolat() {
    trackEvent('cta_clicked', { cta_name: 'postuler_benevole', destination: 'slider_benevolat' });
    const assocPage = document.getElementById('page-associations');
    if (!assocPage || !assocPage.classList.contains('active')) {
        switchTab('associations', true, false);
    }
    if (typeof window.switchRejoindreSlide === 'function') {
        window.switchRejoindreSlide('benevole', false);
    }
    setTimeout(() => {
        if (typeof window.scrollToRejoindreSlider === 'function') {
            window.scrollToRejoindreSlider();
        }
    }, 120);
}

/**
 * Smoothly scroll to the structure affiliation form on the Associations page
 */
export function scrollToAffiliation() {
    trackEvent('cta_clicked', { cta_name: 'affilier_structure', destination: 'slider_affiliation' });
    const assocPage = document.getElementById('page-associations');
    if (!assocPage || !assocPage.classList.contains('active')) {
        switchTab('associations', true, false);
    }
    if (typeof window.switchRejoindreSlide === 'function') {
        window.switchRejoindreSlide('asso', false);
    }
    setTimeout(() => {
        if (typeof window.scrollToRejoindreSlider === 'function') {
            window.scrollToRejoindreSlider();
        }
    }, 120);
}

/**
 * Smoothly scroll to the unified rejoindre forms slider container
 */
export function scrollToRejoindreSlider() {
    const el = document.getElementById('container-rejoindre-slider') || document.getElementById('section-rejoindre-forms') || document.getElementById('section-benevolat');
    if (el) {
        const headerOffset = 90;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
}

/**
 * Filter logos on the Associations page
 * @param {string} category - Category filter ('all', 'esport', 'versus', 'retro', 'etudiant')
 * @param {HTMLElement} [btnElement] - Optional button element clicked
 */
export function filterAssocLogos(category, btnElement) {
    trackEvent('association_filter_selected', { category: category });

    const btns = document.querySelectorAll('.assoc-btn');
    btns.forEach(b => {
        b.classList.remove('bg-brand-red', 'text-white', 'active');
        b.classList.add('bg-brand-cardBg', 'text-gray-400');
    });

    const targetBtn = btnElement || (window.event && window.event.target ? window.event.target.closest('.assoc-btn') : null);
    if (targetBtn) {
        targetBtn.classList.add('bg-brand-red', 'text-white', 'active');
        targetBtn.classList.remove('bg-brand-cardBg', 'text-gray-400');
    }

    const logos = document.querySelectorAll('.logo-item');
    logos.forEach(logo => {
        const cat = logo.getAttribute('data-cat');
        if (category === 'all' || cat === category) {
            logo.style.display = 'flex';
        } else {
            logo.style.display = 'none';
        }
    });
}

/**
 * Handle initial URL routing and hash change
 */
export function handleRouting() {
    const hash = window.location.hash.replace('#', '').trim();
    if (!hash) {
        switchTab('accueil', false);
        return;
    }

    if (hash === 'adhesion' || hash === 'section-adhesion') {
        switchTab('associations', false, false);
        scrollToAdhesion();
        return;
    }

    if (hash === 'benevolat' || hash === 'section-benevolat') {
        switchTab('associations', false, false);
        scrollToBenevolat();
        return;
    }

    if (hash === 'affiliation' || hash === 'container-affiliation-asso') {
        switchTab('associations', false, false);
        scrollToAffiliation();
        return;
    }

    if (hash === 'projet') {
        switchTab('qui-sommes-nous', false);
        return;
    }

    if (VALID_PAGES.includes(hash)) {
        switchTab(hash, false);
    } else {
        switchTab('accueil', false);
    }
}
