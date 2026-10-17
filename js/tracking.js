/* ==========================================================================
   Toulouse Esport Connect - Tracking Module
   PostHog event tracking helpers
   ========================================================================== */

/**
 * Safe PostHog Event Tracking Helper
 * @param {string} eventName - Event identifier
 * @param {Record<string, any>} [properties] - Custom event metadata
 */
export function trackEvent(eventName, properties = {}) {
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
export function identifyUser(distinctId, properties = {}) {
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
export function trackDiscordClick(source) {
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
export function trackSocialClick(platform, source = 'footer') {
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
export function trackEventInterest(eventName, organizer) {
    trackEvent('event_interest_clicked', {
        event_name: eventName,
        organizer: organizer
    });
}
