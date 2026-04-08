import { useCallback, useEffect, useState } from "react";
import {
  CONSENT_CHANGED_EVENT,
  mayPersistPreferenceCookies,
} from "@/lib/cookieConsent";

const COOKIE_NAME = "sanctuary_theme";
const MAX_AGE = 31536000;

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeThemeCookie(value: "light" | "dark") {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`;
}

function applyThemeClass(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

function systemPreferredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const sync = () => {
      if (mayPersistPreferenceCookies()) {
        const stored = readCookie(COOKIE_NAME);
        const initial = stored === "dark" || stored === "light" ? stored : "light";
        setTheme(initial);
        applyThemeClass(initial);
      } else {
        const initial = systemPreferredTheme();
        setTheme(initial);
        applyThemeClass(initial);
      }
    };

    sync();
    window.addEventListener(CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, sync);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      if (mayPersistPreferenceCookies()) writeThemeCookie(next);
      applyThemeClass(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
