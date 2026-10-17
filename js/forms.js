/* ==========================================================================
   Toulouse Esport Connect - Forms & Slider Module
   Volunteer, association & contact forms + rejoindre slider
   ========================================================================== */

import { trackEvent, identifyUser } from './tracking.js';
import { scrollToRejoindreSlider } from './router.js';
import { showNotification } from './modal.js';

let currentRejoindreSlide = 'benevole';

/**
 * Switch slider between Benevole and Association forms
 * @param {'benevole' | 'asso'} type
 * @param {boolean} [shouldScroll=false]
 */
export function switchRejoindreSlide(type, shouldScroll = false) {
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
export function prevRejoindreSlide() {
    switchRejoindreSlide(currentRejoindreSlide === 'asso' ? 'benevole' : 'asso');
}

/**
 * Slide to next form in slider
 */
export function nextRejoindreSlide() {
    switchRejoindreSlide(currentRejoindreSlide === 'benevole' ? 'asso' : 'benevole');
}

/**
 * Dynamically adjust slider viewport height to match the active slide
 */
export function updateRejoindreSliderHeight() {
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
export function switchAdhesionTab(type, shouldScroll = false) {
    const targetSlide = type === 'individuel' ? 'benevole' : 'asso';
    switchRejoindreSlide(targetSlide, shouldScroll);
}

/**
 * Backwards compatibility helper for scrollToForm
 */
export function scrollToForm() {
    scrollToRejoindreSlider();
}

/**
 * Form handler for Volunteer Candidacy (Espace Bénévolat)
 * @param {HTMLFormElement} form
 */
export function handleVolunteerSubmit(form) {
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
 * Reset volunteer form to allow new submission
 */
export function resetVolunteerForm() {
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
export function handleAdhesionSubmit(form) {
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
export function resetAssoForm() {
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
export function handleIndividualAdhesionSubmit(form) {
    return handleVolunteerSubmit(form);
}

/**
 * Form handler for Contact
 * @param {HTMLFormElement} form
 */
export function handleContactSubmit(form) {
    trackEvent('contact_form_submitted');
    form.reset();
    showNotification('Message envoyé au bureau TEC ! Nous vous répondrons sous 48h.', 'success');
}
