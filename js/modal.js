/* ==========================================================================
   Toulouse Esport Connect - Modal Module
   Accessible modals: association, legal, sympathisant
   Focus trap, Escape close, focus restoration
   ========================================================================== */

import { trackEvent } from './tracking.js';

// Track the element that triggered the modal for accessible focus restoration
let lastFocusedElement = null;

/**
 * Open the detailed modal for an association
 * Supports both openModal(name, desc, email, logo, games, trigger) and openModal(id, trigger)
 * @param {string} title - Association Name or Association ID
 * @param {string} [description] - Detailed Description
 * @param {string} [email] - Contact Email
 * @param {string} [logoText] - Acronym or Logo Path
 * @param {string} [games] - List of games / activities
 * @param {HTMLElement} [triggerElement] - Element that triggered the modal
 * @param {Object} [associationsData] - Associations data registry (for id-based lookup)
 */
export function openModal(title, description, email, logoText, games, triggerElement, associationsData = {}) {
    // If called with openModal(id, triggerElement)
    if (typeof title === 'string' && associationsData[title] && !email) {
        const a = associationsData[title];
        return openModal(a.name, a.description, a.email, a.logo, a.games, description, associationsData);
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
export function closeModal() {
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
export function openLegalModal(triggerElement) {
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
export function closeLegalModal() {
    const modal = document.getElementById('legal-modal');
    if (modal) {
        modal.classList.add('hidden');
    }

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
}

/**
 * Open Membre Sympathisant modal
 */
export function openSympathisantModal() {
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
export function closeSympathisantModal() {
    const modal = document.getElementById('sympathisant-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

/**
 * Show a temporary toast notification with custom icon and message
 * @param {string} msg - Message to display
 * @param {string} [type='info'] - 'info' or 'success'
 */
export function showNotification(msg, type = 'info') {
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
 * Generic keyboard handler for modals: Escape closes, Tab traps focus inside modal.
 * @param {HTMLElement} modal - The modal element
 * @param {Function} closeFn - Function to call on Escape
 */
export function setupModalKeyboardHandler(modal, closeFn) {
    if (!modal) return;

    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('hidden')) return;

        if (e.key === 'Escape') {
            closeFn();
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
    });
}
