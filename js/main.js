/* ==========================================================================
   Toulouse Esport Connect - Main Application Script (main.js)
   ========================================================================== */

const VALID_PAGES = ['accueil', 'projet', 'associations', 'evenements', 'qui-sommes-nous'];

const PAGE_TITLES = {
    'accueil': 'Toulouse Esport Connect – Le réseau des associations esport toulousaines',
    'projet': 'Notre Projet – Toulouse Esport Connect',
    'associations': 'Associations Membres – Toulouse Esport Connect',
    'evenements': 'Événements & Tournois – Toulouse Esport Connect',
    'qui-sommes-nous': 'Qui sommes-nous ? – Toulouse Esport Connect'
};

// Track the element that triggered the modal for accessible focus restoration
let lastFocusedElement = null;

/**
 * Switch active page view (SPA navigation with History & Hash support)
 * @param {string} pageId - Target page identifier (e.g. 'accueil', 'projet')
 * @param {boolean} [pushState=true] - Whether to update window history
 */
function switchTab(pageId, pushState = true) {
    const targetId = VALID_PAGES.includes(pageId) ? pageId : 'accueil';

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

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
 * Smoothly scroll to the adhesion section on the Projet page
 */
function scrollToAdhesion() {
    setTimeout(() => {
        const el = document.getElementById('section-adhesion');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    }, 150);
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

/**
 * Open the detailed modal for an association with accessibility focus management
 * @param {string} title - Association Name
 * @param {string} description - Detailed Description
 * @param {string} email - Contact Email
 * @param {string} logoText - Acronym or Logo Path
 * @param {string} games - List of games / activities
 * @param {HTMLElement} [triggerElement] - Element that triggered the modal
 */
function openModal(title, description, email, logoText, games, triggerElement) {
    const modal = document.getElementById('assoc-modal');
    const modalContent = document.getElementById('modal-content');

    if (!modal || !modalContent) return;

    // Remember focus
    lastFocusedElement = triggerElement || document.activeElement;

    const isImage = logoText && (logoText.includes('/') || logoText.endsWith('.webp') || logoText.endsWith('.png') || logoText.endsWith('.jpg') || logoText.endsWith('.svg') || logoText.includes('<img'));
    const logoHtml = isImage
        ? (logoText.startsWith('<') ? logoText : `<img src="${logoText}" alt="Logo ${title}" class="w-full h-full object-contain p-1 rounded-xl">`)
        : logoText;

    modalContent.innerHTML = `
        <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-2xl bg-brand-dark border-2 border-brand-red flex items-center justify-center text-brand-red font-bebas text-2xl shadow-lg overflow-hidden flex-shrink-0">
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
 * Form handler for Adhesion
 * @param {HTMLFormElement} form
 */
function handleAdhesionSubmit(form) {
    const structure = form.structureName ? form.structureName.value : '';
    form.reset();
    showNotification(`Candidature pour "${structure || 'votre association'}" transmise au bureau TEC !`, 'success');
}

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
        switchTab('projet', false);
        scrollToAdhesion();
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

    // Modal backdrop click to close
    const modal = document.getElementById('assoc-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Keyboard navigation: Escape closes modal & Tab focus trap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeModal();
        }

        // Focus trap inside modal
        if (e.key === 'Tab' && modal && !modal.classList.contains('hidden')) {
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
