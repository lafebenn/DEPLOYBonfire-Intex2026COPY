export default function PrivacyPage() {
  return (
    <div className="py-16">
      <div className="section-container max-w-3xl">
        <h1 className="font-heading text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-warm max-w-none space-y-6 text-foreground">
          <p className="text-muted-foreground text-lg">Last updated: April 6, 2026</p>

          <h2 className="font-heading text-2xl font-semibold mt-8">1. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            Bonfire collects only the minimum information necessary to provide our services. For staff users, this includes account credentials and role information. For donors, we collect contact information and donation records. All survivor data is protected under the highest security standards.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">2. How We Use Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            Information is used exclusively for case management, donor engagement, and organizational operations. We never sell or share personal data with third parties for marketing purposes.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">3. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            All data is encrypted in transit and at rest. Access is role-based and audited. Survivor information receives additional protection including anonymization in reports and restricted access controls.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">4. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to access, correct, or delete your personal information. Contact our data protection officer at privacy@bonfire.org for any requests.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">5. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy-related inquiries, reach us at privacy@bonfire.org.
          </p>
        </div>
      </div>
    </div>
  );
}
