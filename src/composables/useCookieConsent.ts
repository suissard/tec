import { computed, type ComputedRef, type Ref } from 'vue';

import { useLocalStorage } from '@/composables/useLocalStorage';
import { COOKIE_CONSENT_STORAGE_KEY } from '@/utils/constants';
import type { CookieConsentStatus } from '@/types';

/** Contrôleur retourné par {@link useCookieConsent}. */
export interface CookieConsentController {
  /** Consentement actuel ('pending' tant que l'utilisateur n'a pas choisi) */
  status: Ref<CookieConsentStatus>;
  /** Vrai tant que la bannière doit être affichée */
  needsConsent: ComputedRef<boolean>;
  /** Vrai si l'utilisateur a accepté (autorise PostHog, etc.) */
  hasAccepted: ComputedRef<boolean>;
  /** Accepte, persiste le consentement et injecte PostHog */
  accept: () => void;
  /** Refuse et persiste le consentement */
  decline: () => void;
  /** Lit le consentement stocké et injecte PostHog si déjà accordé */
  init: () => void;
}

const POSTHOG_SCRIPT_ID = 'posthog-script';
const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

/**
 * État partagé (singleton) du consentement cookies.
 */
const { value: status } = useLocalStorage<CookieConsentStatus>(
  COOKIE_CONSENT_STORAGE_KEY,
  'pending'
);

const needsConsent = computed(() => status.value === 'pending');
const hasAccepted = computed(() => status.value === 'granted');

/** Vrai si le script PostHog est déjà présent dans la page. */
function isPosthogInjected(): boolean {
  return document.getElementById(POSTHOG_SCRIPT_ID) !== null;
}

/**
 * Injecte le SDK PostHog dans <head> (uniquement après consentement).
 * Sans `VITE_POSTHOG_KEY`, l'injection est un no-op.
 */
function injectPosthog(): void {
  if (typeof document === 'undefined') return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key || isPosthogInjected()) return;

  const host = import.meta.env.VITE_POSTHOG_HOST ?? DEFAULT_POSTHOG_HOST;
  const script = document.createElement('script');
  script.id = POSTHOG_SCRIPT_ID;
  script.async = true;
  script.src = `${host.replace(/\/$/, '')}/static/array.js`;
  script.setAttribute('data-api-key', key);
  script.setAttribute('data-host', host);
  document.head.appendChild(script);
}

/**
 * Gère le consentement cookies (bannière RGPD + persistance localStorage).
 * Les trackers tiers ne sont chargés que si le consentement est `granted`.
 *
 * Usage : `cookieConsent.init()` au montage de l'app (App.vue).
 *
 * @returns `{ status, needsConsent, hasAccepted, accept, decline, init }`
 * @example
 * const { init, needsConsent } = useCookieConsent();
 * onMounted(init); // injecte PostHog si déjà accordé
 */
export function useCookieConsent(): CookieConsentController {
  function accept(): void {
    status.value = 'granted';
    injectPosthog();
  }

  function decline(): void {
    status.value = 'denied';
  }

  function init(): void {
    if (typeof document === 'undefined') return;
    if (status.value === 'granted') injectPosthog();
  }

  return { status, needsConsent, hasAccepted, accept, decline, init };
}
