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
 * Filter logos on the Associations page
 * @param {string} category - Category filter ('all', 'esport', 'versus', 'retro', 'etudiant')
 * @param {HTMLElement} [btnElement] - Optional button element clicked
 */
function filterAssocLogos(category, btnElement) {
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
        openModal(assoc.name, assoc.description, assoc.email, assoc.logo, assoc.games, triggerElement);
    } else if (typeof fetch !== 'undefined') {
        fetch('data/associations.json')
            .then(r => r.json())
            .then(list => {
                list.forEach(a => associationsData[a.id] = a);
                const found = associationsData[id];
                if (found) {
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
            <a href="mailto:${email}" class="text-brand-redLight hover:underline text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-red">
                <i class="fa-solid fa-envelope mr-1.5"></i>${email}
            </a>
        </div>

        <div class="flex justify-end gap-3">
            <button type="button" onclick="closeModal()" id="modal-close-btn" class="px-4 py-2 bg-brand-dark hover:bg-brand-accent text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-brand-cardBorder focus:outline-none focus:ring-2 focus:ring-brand-red">
                Fermer
            </button>
            <a href="mailto:${email}" class="px-4 py-2 bg-brand-red hover:bg-brand-redHover text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow focus:outline-none focus:ring-2 focus:ring-brand-red">
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

/**
 * Lead Capture handler for Occitanie Gaming Festival
 * @param {HTMLFormElement} form
 */
function handleOgfLeadSubmit(form) {
    const email = form.email.value.trim();
    const profile = form.profile.value;

    if (!email) return;

    try {
        const leads = JSON.parse(localStorage.getItem('tec_ogf_leads') || '[]');
        leads.push({ email, profile, date: new Date().toISOString() });
        localStorage.setItem('tec_ogf_leads', JSON.stringify(leads));
    } catch (e) {
        console.warn('Storage not accessible:', e);
    }

    // Hide form, show confirmation box
    form.classList.add('hidden');
    const successMsg = document.getElementById('ogf-success-msg');
    if (successMsg) {
        successMsg.classList.remove('hidden');
    }

    showNotification('🎉 Inscription confirmée ! Vous recevrez votre accès prioritaire.', 'success');
}

/**
 * Switch adhesion formula tab ('asso' | 'individuel')
 * Synchronizes tabs, pricing cards highlights, and buttons
 * @param {'asso' | 'individuel'} type
 * @param {boolean} [shouldScroll=false]
 */
function switchAdhesionTab(type, shouldScroll = false) {
    const btnAsso = document.getElementById('tab-adhesion-asso');
    const btnIndiv = document.getElementById('tab-adhesion-individuel');
    const panelAsso = document.getElementById('panel-adhesion-asso');
    const panelIndiv = document.getElementById('panel-adhesion-individuel');

    const cardIndiv = document.getElementById('card-adhesion-individuel');
    const cardAsso = document.getElementById('card-adhesion-asso');
    const btnSelectIndiv = document.getElementById('btn-select-individuel');
    const btnSelectAsso = document.getElementById('btn-select-asso');

    if (type === 'individuel') {
        // Individual tab active
        if (btnIndiv) {
            btnIndiv.className = 'p-4 rounded-2xl font-rajdhani transition-all flex items-center gap-3.5 bg-brand-red text-white shadow-lg glow-red-sm border border-brand-red text-left group';
            btnIndiv.setAttribute('aria-selected', 'true');
        }
        if (btnAsso) {
            btnAsso.className = 'p-4 rounded-2xl font-rajdhani transition-all flex items-center gap-3.5 bg-brand-dark/80 text-gray-400 hover:text-white border border-brand-cardBorder hover:border-brand-red/40 text-left group';
            btnAsso.setAttribute('aria-selected', 'false');
        }

        if (panelIndiv) panelIndiv.classList.remove('hidden');
        if (panelAsso) panelAsso.classList.add('hidden');

        // Update pricing cards highlight
        if (cardIndiv) {
            cardIndiv.classList.add('border-brand-red', 'ring-2', 'ring-brand-red/40', 'bg-brand-red/5');
            cardIndiv.classList.remove('border-white/10');
        }
        if (cardAsso) {
            cardAsso.classList.remove('border-brand-red', 'ring-2', 'ring-brand-red/40', 'bg-brand-red/5');
            cardAsso.classList.add('border-white/10');
        }

        if (btnSelectIndiv) {
            btnSelectIndiv.className = 'w-full py-3 px-4 rounded-xl bg-brand-red hover:bg-brand-redHover text-white font-rajdhani font-bold text-xs uppercase tracking-wider transition-all shadow glow-red-sm flex items-center justify-center gap-2';
            btnSelectIndiv.innerHTML = '<i class="fa-solid fa-check"></i><span>Formule sélectionnée (1 € / an)</span>';
        }
        if (btnSelectAsso) {
            btnSelectAsso.className = 'w-full py-3 px-4 rounded-xl bg-brand-dark hover:bg-brand-red text-gray-300 hover:text-white font-rajdhani font-bold text-xs uppercase tracking-wider transition-all border border-brand-red/40 hover:border-brand-red flex items-center justify-center gap-2';
            btnSelectAsso.innerHTML = '<i class="fa-solid fa-building"></i><span>Choisir cette formule (50 € / an)</span>';
        }
    } else {
        // Association tab active
        if (btnAsso) {
            btnAsso.className = 'p-4 rounded-2xl font-rajdhani transition-all flex items-center gap-3.5 bg-brand-red text-white shadow-lg glow-red-sm border border-brand-red text-left group';
            btnAsso.setAttribute('aria-selected', 'true');
        }
        if (btnIndiv) {
            btnIndiv.className = 'p-4 rounded-2xl font-rajdhani transition-all flex items-center gap-3.5 bg-brand-dark/80 text-gray-400 hover:text-white border border-brand-cardBorder hover:border-brand-red/40 text-left group';
            btnIndiv.setAttribute('aria-selected', 'false');
        }

        if (panelAsso) panelAsso.classList.remove('hidden');
        if (panelIndiv) panelIndiv.classList.add('hidden');

        // Update pricing cards highlight
        if (cardAsso) {
            cardAsso.classList.add('border-brand-red', 'ring-2', 'ring-brand-red/40', 'bg-brand-red/5');
            cardAsso.classList.remove('border-white/10');
        }
        if (cardIndiv) {
            cardIndiv.classList.remove('border-brand-red', 'ring-2', 'ring-brand-red/40', 'bg-brand-red/5');
            cardIndiv.classList.add('border-white/10');
        }

        if (btnSelectAsso) {
            btnSelectAsso.className = 'w-full py-3 px-4 rounded-xl bg-brand-red hover:bg-brand-redHover text-white font-rajdhani font-bold text-xs uppercase tracking-wider transition-all shadow glow-red-sm flex items-center justify-center gap-2';
            btnSelectAsso.innerHTML = '<i class="fa-solid fa-check"></i><span>Formule sélectionnée (50 € / an)</span>';
        }
        if (btnSelectIndiv) {
            btnSelectIndiv.className = 'w-full py-3 px-4 rounded-xl bg-brand-dark hover:bg-brand-red text-gray-300 hover:text-white font-rajdhani font-bold text-xs uppercase tracking-wider transition-all border border-brand-red/40 hover:border-brand-red flex items-center justify-center gap-2';
            btnSelectIndiv.innerHTML = '<i class="fa-solid fa-user-plus"></i><span>Choisir cette formule (1 € / an)</span>';
        }
    }

    if (shouldScroll) {
        scrollToForm();
    }
}

/**
 * Smooth scroll to adhesion form container taking the 80px sticky header into account
 */
function scrollToForm() {
    const el = document.getElementById('form-container-card');
    if (el) {
        const headerOffset = 90;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
}

/**
 * Form handler for Individual Volunteer Candidacy (1 € / an)
 * @param {HTMLFormElement} form
 */
function handleVolunteerSubmit(form) {
    const name = form.fullname ? form.fullname.value.trim() : (form.name ? form.name.value.trim() : '');
    const email = form.email ? form.email.value.trim() : '';
    const discord = form.discord ? form.discord.value.trim() : '';
    const pseudo = form.pseudo ? form.pseudo.value.trim() : '';
    const availability = form.availability ? form.availability.value : '';
    const message = form.message ? form.message.value.trim() : '';
    const games = form.games ? form.games.value.trim() : '';
    
    // Collect selected volunteer skills
    const checkedSkills = Array.from(form.querySelectorAll('input[name="skills"]:checked')).map(cb => cb.value);
    
    try {
        const volunteers = JSON.parse(localStorage.getItem('tec_volunteers') || '[]');
        volunteers.push({
            name,
            pseudo,
            email,
            discord,
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

    // In-card success feedback
    form.classList.add('hidden');
    const successBox = document.getElementById('vol-success-box');
    const successText = document.getElementById('vol-success-text');
    if (successBox) {
        if (successText && name) {
            successText.innerHTML = `Merci <strong>${name}</strong> pour votre engagement ! Le bureau de TEC vous recontactera rapidement à l'adresse <strong>${email}</strong> et sur Discord (<strong>${discord}</strong>) pour finaliser votre adhésion.`;
        }
        successBox.classList.remove('hidden');
    }

    showNotification(`Merci ${name || 'bénévole'} ! Candidature enregistrée avec succès.`, 'success');
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
}

/**
 * Form handler for Association Adhesion (50 € / an)
 * @param {HTMLFormElement} form
 */
function handleAdhesionSubmit(form) {
    const structure = form.structureName ? form.structureName.value.trim() : '';
    const email = form.contactEmail ? form.contactEmail.value.trim() : '';
    const contact = form.contactPerson ? form.contactPerson.value.trim() : '';

    try {
        const adhesions = JSON.parse(localStorage.getItem('tec_adhesions') || '[]');
        adhesions.push({
            structure,
            rna: form.rna ? form.rna.value.trim() : '',
            email,
            contact,
            activityDomain: form.activityDomain ? form.activityDomain.value.trim() : '',
            links: form.links ? form.links.value.trim() : '',
            expectations: form.expectations ? form.expectations.value.trim() : '',
            date: new Date().toISOString()
        });
        localStorage.setItem('tec_adhesions', JSON.stringify(adhesions));
    } catch (e) {
        console.warn('LocalStorage non accessible:', e);
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
window.scrollToForm = scrollToForm;
window.scrollToAdhesion = scrollToAdhesion;
window.handleVolunteerSubmit = handleVolunteerSubmit;
window.handleAdhesionSubmit = handleAdhesionSubmit;
window.resetVolunteerForm = resetVolunteerForm;
window.resetAssoForm = resetAssoForm;

/**
 * Form handler for Contact
 * @param {HTMLFormElement} form
 */
function handleContactSubmit(form) {
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
    });

    // Check if user previously signed up for OGF lead capture
    try {
        const leads = JSON.parse(localStorage.getItem('tec_ogf_leads') || '[]');
        if (leads.length > 0) {
            const ogfForm = document.getElementById('ogf-lead-form');
            const successMsg = document.getElementById('ogf-success-msg');
            if (ogfForm && successMsg) {
                ogfForm.classList.add('hidden');
                successMsg.classList.remove('hidden');
            }
        }
    } catch (e) {}
});
