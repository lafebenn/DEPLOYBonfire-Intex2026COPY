/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Preferred: ASP.NET API base URL (no trailing slash). */
  readonly VITE_API_BASE_URL?: string;
  /** Fallback if VITE_API_BASE_URL is unset. */
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
