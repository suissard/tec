/* ==========================================================================
   Toulouse Esport Connect - Main Application Entry Point
   Imports modular sub-systems and exposes globals for inline HTML handlers
   ========================================================================== */

import { trackEvent, identifyUser, trackDiscordClick, trackSocialClick, trackEventInterest } from './tracking.js';
import {
    switchTab, toggleMobileMenu, scrollToAdhesion,
    scrollToBenevolat, scrollToAffiliation, scrollToRejoindreSlider, filterAssocLogos,
    handleRouting, setAssocSearchTerm, applyAssocFilters, filterEvents, scrollToArticle
} from './router.js';
import {
    openModal, closeModal, openLegalModal, closeLegalModal, openSympathisantModal,
    closeSympathisantModal, showNotification, setupModalKeyboardHandler
} from './modal.js';
import {
    switchRejoindreSlide, prevRejoindreSlide, nextRejoindreSlide,
    updateRejoindreSliderHeight, scrollToForm, switchAdhesionTab,
    handleVolunteerSubmit, resetVolunteerForm, handleAdhesionSubmit,
    resetAssoForm, handleIndividualAdhesionSubmit, handleContactSubmit
} from './forms.js';
import { initCookieBanner } from './cookies.js';

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
        openModal(assoc.name, assoc.description, assoc.email, assoc.logo, assoc.games, triggerElement, associationsData);
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
                    openModal(found.name, found.description, found.email, found.logo, found.games, triggerElement, associationsData);
                }
            });
    }
}

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

// Auto-initialize data
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAssociationsData);
} else {
    initAssociationsData();
}

// ============================================================================
// Expose functions on window for inline onclick handlers in HTML
// ============================================================================
window.switchTab = switchTab;
window.toggleMobileMenu = toggleMobileMenu;
window.scrollToAdhesion = scrollToAdhesion;
window.scrollToBenevolat = scrollToBenevolat;
window.scrollToAffiliation = scrollToAffiliation;
window.scrollToRejoindreSlider = scrollToRejoindreSlider;
window.filterAssocLogos = filterAssocLogos;
window.setAssocSearchTerm = setAssocSearchTerm;
window.applyAssocFilters = applyAssocFilters;
window.filterEvents = filterEvents;
window.scrollToArticle = scrollToArticle;
window.handleRouting = handleRouting;
window.openModal = openModal;
window.openModalById = openModalById;
window.closeModal = closeModal;
window.openLegalModal = openLegalModal;
window.closeLegalModal = closeLegalModal;
window.showNotification = showNotification;
window.switchRejoindreSlide = switchRejoindreSlide;
window.prevRejoindreSlide = prevRejoindreSlide;
window.nextRejoindreSlide = nextRejoindreSlide;
window.updateRejoindreSliderHeight = updateRejoindreSliderHeight;
window.scrollToForm = scrollToForm;
window.switchAdhesionTab = switchAdhesionTab;
window.handleVolunteerSubmit = handleVolunteerSubmit;
window.openSympathisantModal = openSympathisantModal;
window.closeSympathisantModal = closeSympathisantModal;
window.resetVolunteerForm = resetVolunteerForm;
window.handleAdhesionSubmit = handleAdhesionSubmit;
window.resetAssoForm = resetAssoForm;
window.handleIndividualAdhesionSubmit = handleIndividualAdhesionSubmit;
window.handleContactSubmit = handleContactSubmit;
window.trackEvent = trackEvent;
window.identifyUser = identifyUser;
window.trackDiscordClick = trackDiscordClick;
window.trackSocialClick = trackSocialClick;
window.trackEventInterest = trackEventInterest;
window.openProtectedEmail = openProtectedEmail;
window.initCookieBanner = initCookieBanner;

// Initialise event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initial routing based on current URL hash
    handleRouting();

    // Initialise and observe slider height
    if (typeof updateRejoindreSliderHeight === 'function') {
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

    // Association search & category filters
    const searchInput = document.getElementById('assoc-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            setAssocSearchTerm(e.target.value);
        });
    }

    const categoryBtns = document.querySelectorAll('.assoc-filter-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cat = e.currentTarget.getAttribute('data-cat');
            filterAssocLogos(cat, e.currentTarget);
        });
    });

    // Event category filters
    const eventBtns = document.querySelectorAll('.event-filter-btn');
    eventBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cat = e.currentTarget.getAttribute('data-cat');
            filterEvents(cat, e.currentTarget);
        });
    });

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
    setupModalKeyboardHandler(document.getElementById('assoc-modal'), closeModal);
    setupModalKeyboardHandler(document.getElementById('legal-modal'), closeLegalModal);
    setupModalKeyboardHandler(document.getElementById('sympathisant-modal'), closeSympathisantModal);

    // Cookie consent banner (RGPD) — loads PostHog only after acceptance
    if (typeof window.initCookieBanner === 'function') {
        window.initCookieBanner();
    }
});
