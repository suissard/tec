/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'true' → utilise le hash-routing (utile sans rewrite serveur) */
  readonly VITE_HASH_ROUTER?: string;
  /** Clé API PostHog (injection du tracker si consentement accordé) */
  readonly VITE_POSTHOG_KEY?: string;
  /** Hébergeur PostHog (défaut : https://eu.i.posthog.com) */
  readonly VITE_POSTHOG_HOST?: string;
}
