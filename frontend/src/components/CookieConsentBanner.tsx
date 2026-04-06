import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("bonfire_cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("bonfire_cookie_consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("bonfire_cookie_consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in">
      <div className="section-container">
        <div className="bg-card border border-border rounded-2xl shadow-warm-lg p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Shield className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-foreground font-medium">We use cookies</p>
            <p className="text-sm text-muted-foreground mt-1">
              This site uses essential cookies for functionality. We do not use analytics or tracking cookies.{" "}
              <a href="/cookies" className="text-primary hover:underline">Learn more</a>
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button variant="outline" size="sm" onClick={decline}>Decline</Button>
            <Button size="sm" onClick={accept}>Accept</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
