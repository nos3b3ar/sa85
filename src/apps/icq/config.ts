export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Cloudflares offizieller Test-Schlüssel besteht immer, damit lokal ohne eigenes Widget entwickelt werden kann. */
export const turnstileSiteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || '1x00000000000000000000AA';

export const netConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const loadNet = () => import('./net');
