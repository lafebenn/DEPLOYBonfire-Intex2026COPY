/** Version bump when cookie categories or policy change; users see the banner again. */
export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = "bonfire_consent_v1";
const LEGACY_CONSENT_KEY = "bonfire_cookie_consent";

const THEME_COOKIE_NAME = "sanctuary_theme";
const SIDEBAR_COOKIE_NAME = "sidebar:state";

export const CONSENT_CHANGED_EVENT = "bonfire-consent-changed";

export type StoredConsent = {
  version: number;
  /** When true, theme and UI layout cookies may be stored. */
  preferences: boolean;
  decidedAt: string;
};

function dispatchConsentChanged() {
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT));
}

/** Remove preference cookies (theme, sidebar persistence). */
export function clearPreferenceCookies() {
  document.cookie = `${THEME_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${SIDEBAR_COOKIE_NAME}=; path=/; max-age=0`;
}

export function readStoredConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw) {
      const o = JSON.parse(raw) as Partial<StoredConsent>;
      if (o && typeof o.preferences === "boolean" && typeof o.decidedAt === "string") {
        return {
          version: typeof o.version === "number" ? o.version : CONSENT_VERSION,
          preferences: o.preferences,
          decidedAt: o.decidedAt,
        };
      }
    }

    const legacy = localStorage.getItem(LEGACY_CONSENT_KEY);
    if (legacy === "accepted") {
      const c: StoredConsent = {
        version: CONSENT_VERSION,
        preferences: true,
        decidedAt: new Date().toISOString(),
      };
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(c));
      localStorage.removeItem(LEGACY_CONSENT_KEY);
      return c;
    }
    if (legacy === "declined") {
      const c: StoredConsent = {
        version: CONSENT_VERSION,
        preferences: false,
        decidedAt: new Date().toISOString(),
      };
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(c));
      localStorage.removeItem(LEGACY_CONSENT_KEY);
      clearPreferenceCookies();
      return c;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** User has chosen and policy version is current. */
export function hasUpToDateConsent(): boolean {
  const c = readStoredConsent();
  return c != null && c.version >= CONSENT_VERSION;
}

export function saveConsent(preferences: boolean) {
  const c: StoredConsent = {
    version: CONSENT_VERSION,
    preferences,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(c));
  if (!preferences) clearPreferenceCookies();
  dispatchConsentChanged();
}

export function mayPersistPreferenceCookies(): boolean {
  const c = readStoredConsent();
  return c != null && c.version >= CONSENT_VERSION && c.preferences === true;
}
