/* ==========================================================================
   Toulouse Esport Connect - Main Application Script (main.js)
   ========================================================================== */

/**
 * Switch active page view (SPA navigation)
 * @param {string} pageId - Target page identifier (e.g. 'accueil', 'projet')
 */
function switchTab(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-view');
    pages.forEach(p => p.classList.remove('active'));

    // Show target page
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update Desktop Nav styles
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('text-brand-red', 'font-bold');
        link.classList.add('text-gray-400');
    });

    const activeNav = document.getElementById('nav-' + pageId);
    if (activeNav) {
        activeNav.classList.add('text-brand-red', 'font-bold');
        activeNav.classList.remove('text-gray-400');
    }

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Toggle mobile navigation dropdown
 */
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
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
    }, 100);
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
 * Open the detailed modal for an association
 * @param {string} title - Association Name
 * @param {string} description - Detailed Description
 * @param {string} email - Contact Email
 * @param {string} logoText - Acronym or Logo Text
 * @param {string} games - List of games / activities
 */
function openModal(title, description, email, logoText, games) {
    const modal = document.getElementById('assoc-modal');
    const modalContent = document.getElementById('modal-content');

    if (!modal || !modalContent) return;

    const isImage = logoText && (logoText.includes('/') || logoText.endsWith('.webp') || logoText.endsWith('.png') || logoText.endsWith('.jpg') || logoText.endsWith('.svg') || logoText.includes('<img'));
    const logoHtml = isImage
        ? (logoText.startsWith('<') ? logoText : `<img src="${logoText}" alt="${title}" class="w-full h-full object-contain p-1 rounded-xl">`)
        : logoText;

    modalContent.innerHTML = `
        <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-2xl bg-brand-dark border-2 border-brand-red flex items-center justify-center text-brand-red font-bebas text-2xl shadow-lg overflow-hidden">
                ${logoHtml}
            </div>
            <div>
                <h3 class="font-bebas text-2xl text-white leading-tight">${title}</h3>
                <span class="text-[10px] font-rajdhani font-bold text-brand-red uppercase tracking-wider block">${games}</span>
            </div>
        </div>

        <p class="text-gray-300 text-xs leading-relaxed mb-6">${description}</p>
        
        <div class="p-3 bg-brand-dark rounded-xl border border-white/10 mb-6">
            <span class="text-[10px] text-gray-400 block font-rajdhani font-bold uppercase mb-1">Contact Réseau</span>
            <a href="mailto:${email}" class="text-brand-red hover:underline text-xs font-medium"><i class="fa-solid fa-envelope mr-1.5"></i>${email}</a>
        </div>

        <div class="flex justify-end gap-3">
            <button onclick="closeModal()" class="px-4 py-2 bg-brand-dark hover:bg-brand-accent text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-brand-cardBorder">
                Fermer
            </button>
            <a href="mailto:${email}" class="px-4 py-2 bg-brand-red hover:bg-brand-redHover text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow">
                Contacter
            </a>
        </div>
    `;

    modal.classList.remove('hidden');
}

/**
 * Close the association modal
 */
function closeModal() {
    const modal = document.getElementById('assoc-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Show a temporary toast notification
 * @param {string} msg - Message to display
 */
function showNotification(msg) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');
    if (!toast || !toastText) return;

    toastText.innerText = msg;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Initialise event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
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

    // Keyboard navigation (Escape closes modal)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});
