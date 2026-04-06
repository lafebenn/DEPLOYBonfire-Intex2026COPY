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

          <h2 className="font-heading text-2xl font-semibold mt-8">Cookies we use</h2>
          <p className="text-muted-foreground leading-relaxed">
            Bonfire uses only <strong>essential/functional cookies</strong> required for the application to work properly. These include session cookies for authentication and preference storage (such as cookie consent status).
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We do <strong>not</strong> use analytics, tracking, or advertising cookies. No data is shared with third-party advertisers.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">Managing cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            You can control cookies through your browser settings. Note that disabling essential cookies may prevent the application from functioning correctly.
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
