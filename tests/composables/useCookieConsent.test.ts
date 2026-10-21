import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CookieConsentController } from '@/composables/useCookieConsent';
import { COOKIE_CONSENT_STORAGE_KEY } from '@/utils/constants';

/** Le consentement est un singleton stocké au niveau module : on réimporte à chaque test. */
async function importFreshConsent(): Promise<CookieConsentController> {
  vi.resetModules();
  const module = await import('@/composables/useCookieConsent');
  return module.useCookieConsent();
}

describe('useCookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('status par défaut pending', async () => {
    const { status, needsConsent, hasAccepted } = await importFreshConsent();
    expect(status.value).toBe('pending');
    expect(needsConsent.value).toBe(true);
    expect(hasAccepted.value).toBe(false);
  });

  it('accept() passe à granted, persiste et expose les computeds', async () => {
    const { status, needsConsent, hasAccepted, accept } = await importFreshConsent();
    accept();
    expect(status.value).toBe('granted');
    expect(needsConsent.value).toBe(false);
    expect(hasAccepted.value).toBe(true);
    expect(localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toBe(JSON.stringify('granted'));
    // Sans VITE_POSTHOG_KEY, l’injection est un no-op (aucun script posé).
    expect(document.getElementById('posthog-script')).toBeNull();
  });

  it('decline() passe à denied et persiste', async () => {
    const { status, needsConsent, decline } = await importFreshConsent();
    decline();
    expect(status.value).toBe('denied');
    expect(needsConsent.value).toBe(false);
    expect(localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toBe(JSON.stringify('denied'));
  });

  it('relit le consentement persisté au re-import du module', async () => {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify('granted'));
    const { status, hasAccepted, init } = await importFreshConsent();
    expect(status.value).toBe('granted');
    expect(hasAccepted.value).toBe(true);
    expect(() => init()).not.toThrow();
  });

  it('init() sans consentement accordé n’injecte rien', async () => {
    const { init } = await importFreshConsent();
    expect(() => init()).not.toThrow();
    expect(document.getElementById('posthog-script')).toBeNull();
  });
});
