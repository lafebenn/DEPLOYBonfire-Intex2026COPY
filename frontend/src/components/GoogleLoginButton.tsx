import { useEffect, useRef } from "react";
import { useAuth, type User } from "@/contexts/AuthContext";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
          }) => void;
          renderButton: (el: HTMLElement, cfg: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GSI_SCRIPT = "https://accounts.google.com/gsi/client";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(s);
  });
}

type GoogleLoginButtonProps = {
  onSuccess?: (user: User) => void;
  onError?: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
};

export function GoogleLoginButton({ onSuccess, onError, onBusyChange }: GoogleLoginButtonProps) {
  const { googleLogin } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId || !containerRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        await loadScript(GSI_SCRIPT);
        if (cancelled || !window.google?.accounts?.id || !containerRef.current) {
          if (!cancelled && !window.google?.accounts?.id) {
            onError?.("Google sign-in could not load. Check your connection or site security settings (CSP).");
          }
          return;
        }
        // client_id must match the API's Google:ClientId / GOOGLE_CLIENT_ID (same Google Cloud OAuth Web client).
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp) => {
            try {
              onBusyChange?.(true);
              const user = await googleLogin(resp.credential);
              onSuccess?.(user);
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Google sign-in failed";
              onError?.(msg);
              console.error(e);
            } finally {
              onBusyChange?.(false);
            }
          },
        });
        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
        });
      } catch (e) {
        console.error(e);
        onError?.(
          e instanceof Error
            ? `Could not load Google sign-in: ${e.message}`
            : "Could not load Google sign-in (blocked script or network).",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [googleLogin, onSuccess, onError, onBusyChange]);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) {
    return (
      <p className="text-xs text-muted-foreground text-center">Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.</p>
    );
  }

  return <div ref={containerRef} className="min-h-[40px] flex items-center justify-center w-full" />;
}
