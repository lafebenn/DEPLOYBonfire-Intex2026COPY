export default function CookiesPage() {
  return (
    <div className="py-16">
      <div className="section-container max-w-3xl">
        <h1 className="font-heading text-4xl font-bold mb-8">Cookie Policy</h1>
        <div className="space-y-6">
          <p className="text-muted-foreground text-lg">Last updated: April 6, 2026</p>

          <h2 className="font-heading text-2xl font-semibold mt-8">What are cookies?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cookies are small text files stored on your device when you visit a website. They help us provide essential functionality.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">Cookies and similar storage we use</h2>
          <p className="text-muted-foreground leading-relaxed">
            We split storage into <strong>strictly necessary</strong> items (needed for security and basic operation) and{" "}
            <strong>preferences</strong> (optional UI memory). You choose whether we may set preference cookies via the banner or{" "}
            <strong>Cookie settings</strong> in the site footer.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We do <strong>not</strong> use analytics, tracking, or advertising cookies. No data is shared with third-party advertisers.
          </p>

          <h3 className="font-heading text-xl font-semibold mt-6">Strictly necessary</h3>
          <ul className="text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">Authentication</strong> — when you sign in, tokens may be stored in{" "}
              <code className="text-sm">localStorage</code> (or equivalent) so the portal stays signed in until you sign out.
            </li>
            <li>
              <strong className="text-foreground">Consent record</strong> — <code className="text-sm">localStorage</code> key{" "}
              <code className="text-sm">bonfire_consent_v1</code> stores your choice (necessary-only vs preferences allowed) and the policy version so we do
              not ask on every visit.
            </li>
          </ul>

          <h3 className="font-heading text-xl font-semibold mt-6">Preferences (only if you allow)</h3>
          <ul className="text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
            <li>
              <code className="text-sm">sanctuary_theme</code> — remembers light or dark theme (about one year).
            </li>
            <li>
              <code className="text-sm">sidebar:state</code> — remembers sidebar open/collapsed where that UI is used (about one week).
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            If you choose <strong>Necessary only</strong>, we clear these preference cookies and do not write them again until you allow preferences.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">Managing cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            Use <strong>Cookie settings</strong> in the footer to change your mind at any time. You can also control or delete cookies through your browser.
            Disabling strictly necessary storage may prevent sign-in or core features from working.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Questions about our cookie practices? Email us at privacy@bonfire.org.
          </p>
        </div>
      </div>
    </div>
  );
}
