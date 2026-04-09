import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CONSENT_VERSION,
  readStoredConsent,
  saveConsent,
  type StoredConsent,
} from "@/lib/cookieConsent";

function initialConsentUi(): { consent: StoredConsent | null; showBanner: boolean } {
  const c = readStoredConsent();
  const upToDate = c != null && c.version >= CONSENT_VERSION;
  return { consent: c, showBanner: !upToDate };
}

type CookieConsentContextValue = {
  consent: StoredConsent | null;
  /** True until the user has recorded a choice for the current policy version. */
  showBanner: boolean;
  acceptPreferences: () => void;
  necessaryOnly: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [{ consent, showBanner }, setUi] = useState(initialConsentUi);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const refresh = useCallback(() => {
    const next = readStoredConsent();
    const upToDate = next != null && next.version >= CONSENT_VERSION;
    setUi({ consent: next, showBanner: !upToDate });
  }, []);

  const acceptPreferences = useCallback(() => {
    saveConsent(true);
    refresh();
    setSettingsOpen(false);
  }, [refresh]);

  const necessaryOnly = useCallback(() => {
    saveConsent(false);
    refresh();
    setSettingsOpen(false);
  }, [refresh]);

  const value = useMemo(
    () => ({
      consent,
      showBanner,
      acceptPreferences,
      necessaryOnly,
      settingsOpen,
      setSettingsOpen,
    }),
    [consent, showBanner, acceptPreferences, necessaryOnly, settingsOpen],
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}
