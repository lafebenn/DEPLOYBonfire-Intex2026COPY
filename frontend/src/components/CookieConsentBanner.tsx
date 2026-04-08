import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { Shield } from "lucide-react";

function CookiePreferencesDialog() {
  const { settingsOpen, setSettingsOpen, consent, acceptPreferences, necessaryOnly } = useCookieConsent();

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cookie preferences</DialogTitle>
          <DialogDescription>
            We use essential storage so the site and your session work. Optional preference cookies remember choices
            like color theme or sidebar layout. We do not use analytics or advertising cookies.
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-muted-foreground space-y-2 py-2">
          <p>
            <strong className="text-foreground">Necessary</strong> — always on: authentication tokens when you sign in,
            security, and this consent record.
          </p>
          <p>
            <strong className="text-foreground">Preferences</strong> — optional: theme (<code className="text-xs">sanctuary_theme</code>)
            and sidebar state (<code className="text-xs">sidebar:state</code>), each for up to one year / one week.
          </p>
          {consent && (
            <p className="text-xs pt-2 border-t border-border">
              Current choice: <strong className="text-foreground">{consent.preferences ? "Preferences allowed" : "Necessary only"}</strong>
              {" · "}
              Updated {new Date(consent.decidedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={() => necessaryOnly()}>
            Necessary only
          </Button>
          <Button type="button" onClick={() => acceptPreferences()}>
            Allow preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CookieConsentBanner() {
  const { showBanner, acceptPreferences, necessaryOnly, setSettingsOpen } = useCookieConsent();

  if (!showBanner) {
    return <CookiePreferencesDialog />;
  }

  return (
    <>
      <CookiePreferencesDialog />
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in">
        <div className="section-container">
          <div className="bg-card border border-border rounded-2xl shadow-warm-lg p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Shield className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">Cookies and storage</p>
              <p className="text-sm text-muted-foreground mt-1">
                We use essential cookies and local storage for sign-in and security. With your permission we also store
                UI preferences (theme and layout). We do not use analytics or tracking cookies.{" "}
                <a href="/cookies" className="text-primary hover:underline">
                  Cookie Policy
                </a>
                {" · "}
                <button
                  type="button"
                  className="text-primary hover:underline p-0 align-baseline bg-transparent border-0 cursor-pointer text-sm font-inherit"
                  onClick={() => setSettingsOpen(true)}
                >
                  Manage preferences
                </button>
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Button variant="outline" size="sm" onClick={() => necessaryOnly()}>
                Necessary only
              </Button>
              <Button size="sm" onClick={() => acceptPreferences()}>
                Allow preferences
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Footer / nav control to reopen cookie preferences. */
export function CookieSettingsLink({ className }: { className?: string }) {
  const { setSettingsOpen } = useCookieConsent();
  return (
    <button type="button" className={className} onClick={() => setSettingsOpen(true)}>
      Cookie settings
    </button>
  );
}
