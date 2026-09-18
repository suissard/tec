/* ==========================================================================
   Toulouse Esport Connect - Main Application Script (main.js)
   ========================================================================== */

const VALID_PAGES = ['accueil', 'qui-sommes-nous', 'associations', 'evenements'];

const PAGE_TITLES = {
    'accueil': 'Toulouse Esport Connect – Le réseau des associations esport toulousaines',
    'qui-sommes-nous': 'Qui sommes-nous ? – Toulouse Esport Connect',
    'associations': 'Associations Membres & Adhésion – Toulouse Esport Connect',
    'evenements': 'Événements & Tournois – Toulouse Esport Connect'
};

// Track the element that triggered the modal for accessible focus restoration
let lastFocusedElement = null;

/**
 * Safe PostHog Event Tracking Helper
 * @param {string} eventName - Event identifier
 * @param {Record<string, any>} [properties] - Custom event metadata
 */
function trackEvent(eventName, properties = {}) {
    if (typeof window !== 'undefined' && window.posthog && typeof window.posthog.capture === 'function') {
        try {
            window.posthog.capture(eventName, properties);
        } catch (e) {
            console.warn('⚠️ PostHog capture warning:', e);
        }
    }
}

/**
 * Identify a user in PostHog upon key form submissions
 * @param {string} distinctId - Distinct identifier (email)
 * @param {Record<string, any>} [properties] - Profile properties
 */
function identifyUser(distinctId, properties = {}) {
    if (typeof window !== 'undefined' && window.posthog && typeof window.posthog.identify === 'function') {
        try {
            window.posthog.identify(distinctId, properties);
        } catch (e) {
            console.warn('⚠️ PostHog identify warning:', e);
        }
    }
}

/**
 * Track Discord join clicks across different CTAs
 * @param {string} source - Origin ('header', 'hero', 'callout_banner', 'footer', etc.)
 */
function trackDiscordClick(source) {
    trackEvent('discord_join_clicked', {
        source: source,
        url: 'https://discord.gg/VH98qQWEhh'
    });
}

/**
 * Track clicks on social media links
 * @param {string} platform - 'instagram' | 'x_twitter'
 * @param {string} [source='footer'] - Placement source
 */
function trackSocialClick(platform, source = 'footer') {
    trackEvent('social_link_clicked', {
        platform: platform,
        source: source
    });
}

/**
 * Track user interest in agenda events
 * @param {string} eventName - Event title
 * @param {string} organizer - Organizer name
 */
function trackEventInterest(eventName, organizer) {
    trackEvent('event_interest_clicked', {
        event_name: eventName,
        organizer: organizer
    });
}

/**
 * Switch active page view (SPA navigation with History & Hash support)
 * @param {string} pageId - Target page identifier (e.g. 'accueil', 'projet')
 * @param {boolean} [pushState=true] - Whether to update window history
 * @param {boolean} [scrollToTop=true] - Whether to scroll to top of window
 */
function switchTab(pageId, pushState = true, scrollToTop = true) {
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
        setTimeout(updateRejoindreSliderHeight, 60);
    }

    // Smooth scroll to top if requested
    if (scrollToTop) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Toggle mobile navigation dropdown
 */
function toggleMobileMenu() {
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
function scrollToAdhesion() {
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
function scrollToBenevolat() {
    trackEvent('cta_clicked', { cta_name: 'postuler_benevole', destination: 'slider_benevolat' });
    const assocPage = document.getElementById('page-associations');
    if (!assocPage || !assocPage.classList.contains('active')) {
        switchTab('associations', true, false);
    }
    switchRejoindreSlide('benevole', false);
    setTimeout(() => {
        scrollToRejoindreSlider();
    }, 120);
}

/**
 * Smoothly scroll to the structure affiliation form on the Associations page
 */
function scrollToAffiliation() {
    trackEvent('cta_clicked', { cta_name: 'affilier_structure', destination: 'slider_affiliation' });
    const assocPage = document.getElementById('page-associations');
    if (!assocPage || !assocPage.classList.contains('active')) {
        switchTab('associations', true, false);
    }
    switchRejoindreSlide('asso', false);
    setTimeout(() => {
        scrollToRejoindreSlider();
    }, 120);
}

/**
 * Smoothly scroll to the unified rejoindre forms slider container
 */
function scrollToRejoindreSlider() {
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
function filterAssocLogos(category, btnElement) {
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

// Associations Data Registry (populated from data/associations.json or embedded script)
let associationsData = {};

/**
 * Initialize associations data from embedded JSON script tag or fetch
 */
function initAssociationsData() {
    const scriptEl = document.getElementById('associations-data');
    if (scriptEl) {
        try {
            const list = JSON.parse(scriptEl.textContent);
            list.forEach(item => {
                associationsData[item.id] = item;
            });
            return;
        } catch (e) {
            console.warn('⚠️ Erreur lecture script #associations-data:', e);
        }
    }

    if (typeof fetch !== 'undefined') {
        fetch('data/associations.json')
            .then(res => res.json())
            .then(list => {
                list.forEach(item => {
                    associationsData[item.id] = item;
                });
            })
            .catch(err => {
                console.warn('⚠️ Impossible de charger data/associations.json via fetch:', err);
            });
    }
}

// Auto-initialize data
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAssociationsData);
} else {
    initAssociationsData();
}

/**
 * Open the detailed modal by association ID (reads from data/associations.json)
 * @param {string} id - Association ID (e.g. 'oserv-esport')
 * @param {HTMLElement} [triggerElement] - Element that triggered the modal
 */
function openModalById(id, triggerElement) {
    if (Object.keys(associationsData).length === 0) {
        initAssociationsData();
    }
    const assoc = associationsData[id];
    if (assoc) {
        trackEvent('association_modal_opened', {
            association_id: id,
            association_name: assoc.name,
            category: assoc.category,
            games: assoc.games
        });
        openModal(assoc.name, assoc.description, assoc.email, assoc.logo, assoc.games, triggerElement);
    } else if (typeof fetch !== 'undefined') {
        fetch('data/associations.json')
            .then(r => r.json())
            .then(list => {
                list.forEach(a => associationsData[a.id] = a);
                const found = associationsData[id];
                if (found) {
                    trackEvent('association_modal_opened', {
                        association_id: id,
                        association_name: found.name,
                        category: found.category,
                        games: found.games
                    });
                    openModal(found.name, found.description, found.email, found.logo, found.games, triggerElement);
                }
            });
    }
}

/**
 * Open the detailed modal for an association with accessibility focus management
 * Supports both openModal(name, desc, email, logo, games, trigger) and openModal(id, trigger)
 * @param {string} title - Association Name or Association ID
 * @param {string} [description] - Detailed Description
 * @param {string} [email] - Contact Email
 * @param {string} [logoText] - Acronym or Logo Path
 * @param {string} [games] - List of games / activities
 * @param {HTMLElement} [triggerElement] - Element that triggered the modal
 */
function openModal(title, description, email, logoText, games, triggerElement) {
    // If called with openModal(id, triggerElement)
    if (typeof title === 'string' && associationsData[title] && !email) {
        const a = associationsData[title];
        return openModal(a.name, a.description, a.email, a.logo, a.games, description);
    }

    const modal = document.getElementById('assoc-modal');
    const modalContent = document.getElementById('modal-content');

    if (!modal || !modalContent) return;

    // Remember focus
    lastFocusedElement = triggerElement || document.activeElement;

    const isImage = logoText && (logoText.includes('/') || logoText.endsWith('.webp') || logoText.endsWith('.png') || logoText.endsWith('.jpg') || logoText.endsWith('.svg') || logoText.includes('<img'));
    const logoHtml = isImage
        ? (logoText.startsWith('<') ? logoText : `<img src="${logoText}" alt="Logo ${title}" class="w-full h-full object-contain">`)
        : logoText;

    modalContent.innerHTML = `
        <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-2xl assoc-logo-badge border border-white/20 flex items-center justify-center text-brand-red font-bebas text-2xl shadow-lg overflow-hidden flex-shrink-0 p-2">
                ${logoHtml}
            </div>
            <div>
                <h3 id="modal-title" class="font-bebas text-2xl text-white leading-tight">${title}</h3>
                <span class="text-[11px] font-rajdhani font-bold text-brand-redLight uppercase tracking-wider block">${games}</span>
            </div>
        </div>

        <p class="text-gray-300 text-xs leading-relaxed mb-6">${description}</p>
        
        <div class="p-3 bg-brand-dark rounded-xl border border-white/10 mb-6">
            <span class="text-[10px] text-gray-400 block font-rajdhani font-bold uppercase mb-1">Contact Réseau Officiel</span>
            <a href="mailto:${email}" data-assoc-name="${title}" data-assoc-email="${email}" onclick="trackEvent('association_email_clicked', { association_name: this.getAttribute('data-assoc-name'), email: this.getAttribute('data-assoc-email') })" class="text-brand-redLight hover:underline text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-red">
                <i class="fa-solid fa-envelope mr-1.5"></i>${email}
            </a>
        </div>

        <div class="flex justify-end gap-3">
            <button type="button" onclick="closeModal()" id="modal-close-btn" class="px-4 py-2 bg-brand-dark hover:bg-brand-accent text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-brand-cardBorder focus:outline-none focus:ring-2 focus:ring-brand-red">
                Fermer
            </button>
            <a href="mailto:${email}" data-assoc-name="${title}" data-assoc-email="${email}" onclick="trackEvent('association_contact_clicked', { association_name: this.getAttribute('data-assoc-name'), email: this.getAttribute('data-assoc-email'), type: 'button' })" class="px-4 py-2 bg-brand-red hover:bg-brand-redHover text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow focus:outline-none focus:ring-2 focus:ring-brand-red">
                Contacter
            </a>
        </div>
    `;

    modal.classList.remove('hidden');

    // Focus close button inside modal
    setTimeout(() => {
        const closeBtn = document.getElementById('modal-close-btn');
        if (closeBtn) closeBtn.focus();
    }, 50);
}

/**
 * Close the association modal and restore focus
 */
function closeModal() {
    const modal = document.getElementById('assoc-modal');
    if (modal) {
        modal.classList.add('hidden');
    }

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
}

/**
 * Open the Mentions Légales modal
 * @param {HTMLElement} [triggerElement] - Element that triggered the modal
 */
function openLegalModal(triggerElement) {
    trackEvent('legal_modal_opened');
    const modal = document.getElementById('legal-modal');
    if (!modal) return;

    lastFocusedElement = triggerElement || document.activeElement;
    modal.classList.remove('hidden');

    setTimeout(() => {
        const closeBtn = modal.querySelector('button');
        if (closeBtn) closeBtn.focus();
    }, 50);
}

/**
 * Close the Mentions Légales modal and restore focus
 */
function closeLegalModal() {
    const modal = document.getElementById('legal-modal');
    if (modal) {
        modal.classList.add('hidden');
    }

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
}

/**
 * Show a temporary toast notification with custom icon and message
 * @param {string} msg - Message to display
 * @param {string} [type='info'] - 'info' or 'success'
 */
function showNotification(msg, type = 'info') {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast || !toastText) return;

    toastText.innerText = msg;
    if (toastIcon) {
        toastIcon.className = type === 'success' ? 'fa-solid fa-circle-check text-sm' : 'fa-solid fa-bell text-sm';
    }

    toast.classList.remove('hidden');

    if (window.toastTimeout) {
        clearTimeout(window.toastTimeout);
    }

    window.toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}


let currentRejoindreSlide = 'benevole';

/**
 * Switch slider between Benevole and Association forms
 * @param {'benevole' | 'asso'} type
 * @param {boolean} [shouldScroll=false]
 */
function switchRejoindreSlide(type, shouldScroll = false) {
    currentRejoindreSlide = type;
    const track = document.getElementById('rejoindre-slider-track');
    const slideBenevole = document.getElementById('slide-benevole');
    const slideAsso = document.getElementById('slide-asso');
    const tabBenevole = document.getElementById('tab-slider-benevole');
    const tabAsso = document.getElementById('tab-slider-asso');
    const dotBenevole = document.getElementById('dot-benevole');
    const dotAsso = document.getElementById('dot-asso');
    const indicatorText = document.getElementById('slider-indicator-text');

    const isBenevole = type === 'benevole';

    if (track) {
        track.style.transform = isBenevole ? 'translateX(0%)' : 'translateX(-50%)';
    }

    if (slideBenevole && slideAsso) {
        if (isBenevole) {
            slideBenevole.removeAttribute('inert');
            slideBenevole.removeAttribute('aria-hidden');
            slideAsso.setAttribute('inert', '');
            slideAsso.setAttribute('aria-hidden', 'true');
        } else {
            slideAsso.removeAttribute('inert');
            slideAsso.removeAttribute('aria-hidden');
            slideBenevole.setAttribute('inert', '');
            slideBenevole.setAttribute('aria-hidden', 'true');
        }
    }

    // Update segmented tabs styling
    if (tabBenevole && tabAsso) {
        if (isBenevole) {
            tabBenevole.className = 'flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-rajdhani font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 bg-brand-red text-white shadow glow-red-sm border border-brand-red';
            tabBenevole.setAttribute('aria-selected', 'true');
            tabAsso.className = 'flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-rajdhani font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 text-gray-400 hover:text-white border border-transparent';
            tabAsso.setAttribute('aria-selected', 'false');
        } else {
            tabAsso.className = 'flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-rajdhani font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 bg-brand-red text-white shadow glow-red-sm border border-brand-red';
            tabAsso.setAttribute('aria-selected', 'true');
            tabBenevole.className = 'flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-rajdhani font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 text-gray-400 hover:text-white border border-transparent';
            tabBenevole.setAttribute('aria-selected', 'false');
        }
    }

    // Update dots indicator
    if (dotBenevole && dotAsso) {
        if (isBenevole) {
            dotBenevole.className = 'w-3 h-3 rounded-full bg-brand-red transition-all scale-110 shadow-sm';
            dotAsso.className = 'w-3 h-3 rounded-full bg-white/20 hover:bg-white/40 transition-all';
        } else {
            dotAsso.className = 'w-3 h-3 rounded-full bg-brand-red transition-all scale-110 shadow-sm';
            dotBenevole.className = 'w-3 h-3 rounded-full bg-white/20 hover:bg-white/40 transition-all';
        }
    }

    if (indicatorText) {
        indicatorText.textContent = isBenevole ? 'Formulaire 1 sur 2 : Bénévole' : 'Formulaire 2 sur 2 : Association';
    }

    updateRejoindreSliderHeight();

    trackEvent('rejoindre_slider_switched', { slide: type });

    if (shouldScroll) {
        scrollToRejoindreSlider();
    }
}

/**
 * Slide to previous form in slider
 */
function prevRejoindreSlide() {
    switchRejoindreSlide(currentRejoindreSlide === 'asso' ? 'benevole' : 'asso');
}

/**
 * Slide to next form in slider
 */
function nextRejoindreSlide() {
    switchRejoindreSlide(currentRejoindreSlide === 'benevole' ? 'asso' : 'benevole');
}

/**
 * Dynamically adjust slider viewport height to match the active slide
 */
function updateRejoindreSliderHeight() {
    const viewport = document.getElementById('rejoindre-slider-viewport');
    if (!viewport) return;
    const activeSlide = currentRejoindreSlide === 'benevole'
        ? document.getElementById('slide-benevole')
        : document.getElementById('slide-asso');
    if (activeSlide) {
        const height = activeSlide.offsetHeight;
        if (height > 0) {
            viewport.style.height = height + 'px';
        }
    }
}

/**
 * Backwards compatibility helper for switchAdhesionTab
 * @param {'asso' | 'individuel'} type
 * @param {boolean} [shouldScroll=false]
 */
function switchAdhesionTab(type, shouldScroll = false) {
    const targetSlide = type === 'individuel' ? 'benevole' : 'asso';
    switchRejoindreSlide(targetSlide, shouldScroll);
}

/**
 * Backwards compatibility helper for scrollToForm
 */
function scrollToForm() {
    scrollToRejoindreSlider();
}

/**
 * Form handler for Volunteer Candidacy (Espace Bénévolat)
 * @param {HTMLFormElement} form
 */
function handleVolunteerSubmit(form) {
    const name = form.fullname ? form.fullname.value.trim() : (form.name ? form.name.value.trim() : '');
    const email = form.email ? form.email.value.trim() : '';
    const discord = form.discord ? form.discord.value.trim() : (form.pseudo ? form.pseudo.value.trim() : '');
    const availability = form.availability ? form.availability.value : '';
    const message = form.message ? form.message.value.trim() : '';
    const games = form.games ? form.games.value.trim() : '';
    
    // Collect selected volunteer skills
    const checkedSkills = Array.from(form.querySelectorAll('input[name="skills"]:checked')).map(cb => cb.value);
    
    try {
        const volunteers = JSON.parse(localStorage.getItem('tec_volunteers') || '[]');
        volunteers.push({
            name,
            discord,
            email,
            skills: checkedSkills,
            availability,
            games,
            message,
            date: new Date().toISOString()
        });
        localStorage.setItem('tec_volunteers', JSON.stringify(volunteers));
    } catch (e) {
        console.warn('LocalStorage non accessible:', e);
    }

    // PostHog Tracking & Profile Identification
    trackEvent('volunteer_form_submitted', {
        skills_count: checkedSkills.length,
        skills: checkedSkills,
        availability: availability,
        has_discord: Boolean(discord),
        has_games: Boolean(games),
        has_message: Boolean(message)
    });
    if (email) {
        identifyUser(email, {
            email: email,
            name: name,
            discord_handle: discord || undefined,
            volunteer_skills: checkedSkills,
            availability: availability,
            favorite_games: games || undefined,
            role: 'volunteer_applicant'
        });
    }

    // In-card success feedback (sans aucun tarif, focus sur l'échange vocal)
    form.classList.add('hidden');
    const successBox = document.getElementById('vol-success-box');
    const successText = document.getElementById('vol-success-text');
    if (successBox) {
        if (successText && name) {
            successText.innerHTML = `Merci <strong>${name}</strong> pour votre candidature ! Le bureau de TEC vous recontactera rapidement par email (<strong>${email}</strong>) et sur Discord (<strong>${discord}</strong>) pour planifier un échange vocal.`;
        }
        successBox.classList.remove('hidden');
    }

    setTimeout(updateRejoindreSliderHeight, 50);
    showNotification(`Merci ${name || 'bénévole'} ! Candidature transmise avec succès.`, 'success');
}

/**
 * Open Membre Sympathisant modal
 */
function openSympathisantModal() {
    trackEvent('sympathisant_modal_opened');
    const modal = document.getElementById('sympathisant-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close Membre Sympathisant modal
 */
function closeSympathisantModal() {
    const modal = document.getElementById('sympathisant-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

/**
 * Reset volunteer form to allow new submission
 */
function resetVolunteerForm() {
    const form = document.getElementById('form-volunteer');
    const successBox = document.getElementById('vol-success-box');
    if (form) {
        form.reset();
        form.classList.remove('hidden');
    }
    if (successBox) {
        successBox.classList.add('hidden');
    }
    setTimeout(updateRejoindreSliderHeight, 50);
}

/**
 * Form handler for Association Adhesion (50 € / an)
 * @param {HTMLFormElement} form
 */
function handleAdhesionSubmit(form) {
    const structure = form.structureName ? form.structureName.value.trim() : '';
    const email = form.contactEmail ? form.contactEmail.value.trim() : '';
    const contact = form.contactPerson ? form.contactPerson.value.trim() : '';
    const domain = form.activityDomain ? form.activityDomain.value.trim() : '';
    const rna = form.rna ? form.rna.value.trim() : '';
    const links = form.links ? form.links.value.trim() : '';
    const expectations = form.expectations ? form.expectations.value.trim() : '';

    try {
        const adhesions = JSON.parse(localStorage.getItem('tec_adhesions') || '[]');
        adhesions.push({
            structure,
            rna,
            email,
            contact,
            activityDomain: domain,
            links,
            expectations,
            date: new Date().toISOString()
        });
        localStorage.setItem('tec_adhesions', JSON.stringify(adhesions));
    } catch (e) {
        console.warn('LocalStorage non accessible:', e);
    }

    // PostHog Tracking & Profile Identification
    trackEvent('association_adhesion_submitted', {
        structure_name: structure,
        activity_domain: domain,
        has_rna: Boolean(rna),
        has_links: Boolean(links),
        has_expectations: Boolean(expectations)
    });
    if (email) {
        identifyUser(email, {
            email: email,
            name: contact,
            structure_name: structure,
            rna: rna || undefined,
            activity_domain: domain,
            role: 'association_representative'
        });
    }

    // In-card success feedback
    form.classList.add('hidden');
    const successBox = document.getElementById('asso-success-box');
    const successText = document.getElementById('asso-success-text');
    if (successBox) {
        if (successText && structure) {
            successText.innerHTML = `Merci à la structure <strong>${structure}</strong> ! Votre dossier d'adhésion a été transmis avec succès. Nous vous contacterons à l'adresse <strong>${email}</strong>.`;
        }
        successBox.classList.remove('hidden');
    }

    setTimeout(updateRejoindreSliderHeight, 50);
    showNotification(`Candidature pour "${structure || 'votre association'}" transmise au bureau TEC !`, 'success');
}

/**
 * Reset association form to allow new submission
 */
function resetAssoForm() {
    const form = document.getElementById('form-asso');
    const successBox = document.getElementById('asso-success-box');
    if (form) {
        form.reset();
        form.classList.remove('hidden');
    }
    if (successBox) {
        successBox.classList.add('hidden');
    }
    setTimeout(updateRejoindreSliderHeight, 50);
}

/**
 * Form handler for Individual Adhesion (1 € / an) - Fallback
 * @param {HTMLFormElement} form
 */
function handleIndividualAdhesionSubmit(form) {
    return handleVolunteerSubmit(form);
}

// Global window exposure for inline handlers
window.switchAdhesionTab = switchAdhesionTab;
window.switchRejoindreSlide = switchRejoindreSlide;
window.prevRejoindreSlide = prevRejoindreSlide;
window.nextRejoindreSlide = nextRejoindreSlide;
window.updateRejoindreSliderHeight = updateRejoindreSliderHeight;
window.scrollToRejoindreSlider = scrollToRejoindreSlider;
window.scrollToForm = scrollToForm;
window.scrollToAdhesion = scrollToAdhesion;
window.scrollToBenevolat = scrollToBenevolat;
window.scrollToAffiliation = scrollToAffiliation;
window.openSympathisantModal = openSympathisantModal;
window.closeSympathisantModal = closeSympathisantModal;
window.handleVolunteerSubmit = handleVolunteerSubmit;
window.handleAdhesionSubmit = handleAdhesionSubmit;
window.resetVolunteerForm = resetVolunteerForm;
window.resetAssoForm = resetAssoForm;
window.trackEvent = trackEvent;
window.identifyUser = identifyUser;
window.trackDiscordClick = trackDiscordClick;
window.trackSocialClick = trackSocialClick;
window.trackEventInterest = trackEventInterest;
window.openProtectedEmail = openProtectedEmail;

/**
 * Ouvre le client de messagerie tout en protégeant les adresses contre le moissonnage (scraping).
 * Décode la valeur Base64, déclenche l'ouverture du mailto: et copie également l'adresse dans le presse-papier.
 * @param {HTMLElement} btn - Bouton déclencheur contenant l'attribut data-contact
 * @param {Event} [event]
 */
function openProtectedEmail(btn, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    if (!btn) return;
    const encoded = btn.getAttribute('data-contact');
    if (!encoded) return;

    try {
        const email = atob(encoded.trim());
        
        // Copie dans le presse-papier pour le confort des utilisateurs webmail
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(email).then(() => {
                showNotification(`Messagerie ouverte (${email} copié dans le presse-papier) !`, 'success');
            }).catch(() => {
                showNotification(`Ouverture de votre messagerie vers ${email}...`, 'info');
            });
        } else {
            showNotification(`Ouverture de votre messagerie vers ${email}...`, 'info');
        }

        // Déclenche l'ouverture du client mail par défaut
        window.location.href = `mailto:${email}`;

        if (typeof trackEvent === 'function') {
            trackEvent('bureau_email_clicked', { email_domain: email.split('@')[1] });
        }
    } catch (e) {
        console.error('Erreur lors du décodage de l\'adresse email:', e);
    }
}

/**
 * Form handler for Contact
 * @param {HTMLFormElement} form
 */
function handleContactSubmit(form) {
    trackEvent('contact_form_submitted');
    form.reset();
    showNotification('Message envoyé au bureau TEC ! Nous vous répondrons sous 48h.', 'success');
}

/**
 * Handle initial URL routing and hash change
 */
function handleRouting() {
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

// Initialise event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initial routing based on current URL hash
    handleRouting();

    // Initialise and observe slider height
    updateRejoindreSliderHeight();
    window.addEventListener('resize', updateRejoindreSliderHeight);
    if (window.ResizeObserver) {
        const s1 = document.getElementById('slide-benevole');
        const s2 = document.getElementById('slide-asso');
        const resizeObs = new ResizeObserver(() => {
            updateRejoindreSliderHeight();
        });
        if (s1) resizeObs.observe(s1);
        if (s2) resizeObs.observe(s2);
    }

    // Listen to hash changes and browser Back/Forward (popstate)
    window.addEventListener('popstate', () => {
        handleRouting();
    });

    window.addEventListener('hashchange', () => {
        handleRouting();
    });

    // Mobile menu trigger
    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', toggleMobileMenu);
    }

    // Modal backdrop click to close (Association modal)
    const modal = document.getElementById('assoc-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Modal backdrop click to close (Legal modal)
    const legalModal = document.getElementById('legal-modal');
    if (legalModal) {
        legalModal.addEventListener('click', (e) => {
            if (e.target === legalModal) {
                closeLegalModal();
            }
        });
    }

    // Modal backdrop click to close (Sympathisant modal)
    const sympathisantModal = document.getElementById('sympathisant-modal');
    if (sympathisantModal) {
        sympathisantModal.addEventListener('click', (e) => {
            if (e.target === sympathisantModal) {
                closeSympathisantModal();
            }
        });
    }

    // Keyboard navigation: Escape closes modals & Tab focus trap
    document.addEventListener('keydown', (e) => {
        // Assoc modal handling
        if (modal && !modal.classList.contains('hidden')) {
            if (e.key === 'Escape') {
                closeModal();
                return;
            }
            if (e.key === 'Tab') {
                const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable.length > 0) {
                    const first = focusable[0];
                    const last = focusable[focusable.length - 1];
                    if (e.shiftKey && document.activeElement === first) {
                        last.focus();
                        e.preventDefault();
                    } else if (!e.shiftKey && document.activeElement === last) {
                        first.focus();
                        e.preventDefault();
                    }
                }
            }
        }

        // Legal modal handling
        if (legalModal && !legalModal.classList.contains('hidden')) {
            if (e.key === 'Escape') {
                closeLegalModal();
                return;
            }
            if (e.key === 'Tab') {
                const focusable = legalModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable.length > 0) {
                    const first = focusable[0];
                    const last = focusable[focusable.length - 1];
                    if (e.shiftKey && document.activeElement === first) {
                        last.focus();
                        e.preventDefault();
                    } else if (!e.shiftKey && document.activeElement === last) {
                        first.focus();
                        e.preventDefault();
                    }
                }
            }
        }

        // Sympathisant modal handling
        if (sympathisantModal && !sympathisantModal.classList.contains('hidden')) {
            if (e.key === 'Escape') {
                closeSympathisantModal();
                return;
            }
            if (e.key === 'Tab') {
                const focusable = sympathisantModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable.length > 0) {
                    const first = focusable[0];
                    const last = focusable[focusable.length - 1];
                    if (e.shiftKey && document.activeElement === first) {
                        last.focus();
                        e.preventDefault();
                    } else if (!e.shiftKey && document.activeElement === last) {
                        first.focus();
                        e.preventDefault();
                    }
                }
            }
        }
    });
});
