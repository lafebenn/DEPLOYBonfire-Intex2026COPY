export default function PrivacyPage() {
  return (
    <div className="py-16">
      <div className="section-container max-w-3xl">
        <h1 className="font-heading text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-warm max-w-none space-y-6 text-foreground">
          <p className="text-muted-foreground text-lg">Last updated: April 8, 2026</p>

          <p className="text-muted-foreground leading-relaxed">
            This Privacy Policy explains how <strong>Bonfire Sanctuary</strong> (“Bonfire”, “we”, “us”) collects and uses personal data when
            you use our website and services, including our public pages (Home, Impact) and our authenticated portal (staff/admin
            and donors). Because our mission involves supporting survivors and vulnerable individuals, we design our systems to
            minimize collection, restrict access, and publish only aggregated/anonymized impact information where appropriate.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">1. Who we are (Data Controller)</h2>
          <p className="text-muted-foreground leading-relaxed">
            Data controller: <strong>Bonfire Sanctuary</strong>
            <br />
            Address: <strong>12 Bayanihan Street, Barangay San Antonio, Makati City 1200, Philippines</strong>
            <br />
            Email: <strong>privacy@bonfiresanctuary.org</strong>
            <br />
            Phone: <strong>+63 (2) 8555-0142</strong>
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We do not have a dedicated Data Protection Officer. Privacy and data-protection questions are handled by our operations team
            at <strong>privacy@bonfiresanctuary.org</strong>. We will respond within a reasonable time and may ask you to verify your identity before
            disclosing or changing personal data.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">2. What data we collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            We collect only what we need to operate Bonfire’s services. Depending on your relationship with Bonfire, this may include:
          </p>
          <ul className="text-muted-foreground leading-relaxed">
            <li>
              <strong>Account data (staff/admin/donor portal)</strong>: email address, password (stored as a secure hash), display name, role
              (e.g., donor, staff, admin), two-factor authentication status where enabled, and session/JWT tokens used to keep you signed in securely.
            </li>
            <li>
              <strong>Donor/supporter data</strong>: display name, email, phone (if you provide it), country/region, supporter type (e.g., monetary,
              in-kind, volunteer), acquisition channel (e.g., campaign, direct, referral), status, and dates such as first donation date.
            </li>
            <li>
              <strong>Donation and contribution data</strong>: donation amounts (for monetary donations), contribution type (monetary, in-kind, time,
              skills, social advocacy), dates, currency, campaign name, channel source, recurring flags, and notes entered for administration.
            </li>
            <li>
              <strong>Operational and case-management data (restricted access)</strong>: information recorded by authorized staff to coordinate services,
              such as resident identifiers, case status, visit logs, counseling session documentation, education and health progress, intervention plans,
              incident reports, and reintegration fields. This data may relate to vulnerable individuals and may be highly sensitive.
            </li>
            <li>
              <strong>Website technical data</strong>: IP address, HTTP request path, user agent string, timestamps, and error or security events as
              needed to operate, secure, and troubleshoot the service. Authentication-related events (e.g., sign-in success or failure) may be logged at
              a high level for security monitoring.
            </li>
            <li>
              <strong>Cookie consent choice</strong>: your cookie consent selection (Accept/Decline) stored to remember your preference.
            </li>
          </ul>

          <h2 className="font-heading text-2xl font-semibold mt-8">3. How we collect your data</h2>
          <ul className="text-muted-foreground leading-relaxed">
            <li>
              <strong>Directly from you</strong> when you create an account, sign in, donate, fill out forms, or contact us.
            </li>
            <li>
              <strong>From authorized staff</strong> when staff record operational or case information to deliver services and coordinate care.
            </li>
            <li>
              <strong>Automatically</strong> through essential cookies and server or application logs when you use the website.
            </li>
            <li>
              <strong>From partners or referrers</strong> only when necessary for services and only as entered or uploaded by authorized staff into Bonfire
              (we do not operate a public API for bulk import of third-party referral data).
            </li>
          </ul>

          <h2 className="font-heading text-2xl font-semibold mt-8">4. Why we use your data (purposes) and legal bases</h2>
          <p className="text-muted-foreground leading-relaxed">
            We process personal data for the purposes below. Where the EU General Data Protection Regulation (GDPR) applies, we rely on a “lawful basis”
            for each purpose.
          </p>
          <ul className="text-muted-foreground leading-relaxed">
            <li>
              <strong>Provide and secure the website and portal</strong> (authentication, authorization, preventing fraud/abuse, debugging).
              <br />
              Lawful basis: <strong>legitimate interests</strong> (security and service reliability) and/or <strong>contract</strong> (providing requested services).
            </li>
            <li>
              <strong>Process and record donations/contributions</strong> (including receipts and administrative tracking).
              <br />
              Lawful basis: <strong>contract</strong> (to process your contribution) and <strong>legal obligation</strong> (financial and tax record-keeping under applicable
              Philippines law and other laws that apply to Bonfire).
            </li>
            <li>
              <strong>Communicate with supporters</strong> (respond to inquiries, provide updates you request, stewardship such as thank-you messages).
              <br />
              Lawful basis: <strong>legitimate interests</strong> and/or <strong>consent</strong> where required (for example, marketing communications where opt-in is required).
            </li>
            <li>
              <strong>Run Bonfire operations</strong> (safehouse/service coordination, staffing, internal reporting, audits).
              <br />
              Lawful basis: <strong>legitimate interests</strong> and/or <strong>legal obligation</strong> depending on the activity.
            </li>
            <li>
              <strong>Case management and safeguarding</strong> (intake, assessments, counseling documentation, education/health tracking,
              home visits, intervention planning, incident reporting, reintegration planning).
              <br />
              Lawful basis: <strong>legitimate interests</strong> (providing care and protection), <strong>vital interests</strong> where necessary in emergencies,
              and <strong>legal obligation</strong> where child protection or safeguarding duties apply.
            </li>
            <li>
              <strong>Publish impact information</strong> on our public “Impact” pages using aggregated/anonymized metrics.
              <br />
              Lawful basis: <strong>legitimate interests</strong> (transparency to donors and the public).
            </li>
            <li>
              <strong>Machine learning / analytics features</strong> (for example, donor lapse risk scores and resident risk indicators) when enabled.
              Outputs are intended for <strong>authorized staff only</strong> inside the portal to prioritize follow-up and program quality; they are not sold and are
              not used as the sole basis for decisions with legal or similarly significant effects without human review.
              <br />
              Lawful basis: <strong>legitimate interests</strong> (program effectiveness and sustainable fundraising) and, where required, <strong>consent</strong>.
            </li>
          </ul>

          <h2 className="font-heading text-2xl font-semibold mt-8">5. Special and sensitive data</h2>
          <p className="text-muted-foreground leading-relaxed">
            Some information handled by Bonfire may be <strong>highly sensitive</strong>, including information about minors and
            individuals receiving support services. We restrict access using role-based permissions, and we avoid publishing or
            exposing sensitive information on public pages. Where required, we use additional safeguards such as data
            minimization, redaction/anonymization, and stricter access controls.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong>Important:</strong> Do not submit sensitive personal information through any public contact channel unless
            specifically instructed by Bonfire staff.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">6. Who we share data with (recipients)</h2>
          <p className="text-muted-foreground leading-relaxed">
            We do <strong>not</strong> sell personal data. We share personal data only with:
          </p>
          <ul className="text-muted-foreground leading-relaxed">
            <li>
              <strong>Service providers</strong> that host and operate our systems, including cloud hosting and database services (for example, Microsoft Azure
              for application and data hosting), machine-learning inference services used to generate risk scores, and email or notification providers when we send
              operational messages. These providers process data on our instructions and under contractual terms.
            </li>
            <li>
              <strong>Authorized partners</strong> (such as funders, government agencies, healthcare or education partners, or referral organizations) only when needed
              to deliver services, meet grant or regulatory requirements, or coordinate care, and only to the extent necessary.
            </li>
            <li>
              <strong>Legal and compliance</strong> where required by law, regulation, court order, or to protect rights, safety, and security.
            </li>
          </ul>

          <h2 className="font-heading text-2xl font-semibold mt-8">7. International transfers</h2>
          <p className="text-muted-foreground leading-relaxed">
            Bonfire may process or store data in countries other than where you live, depending on our hosting and service providers (for example, servers in
            Southeast Asia, the United States, or the European Economic Area). When we transfer personal data internationally, we use appropriate safeguards as
            required by law, such as standard contractual clauses approved by the European Commission, vendor data processing agreements, and other legally
            recognized transfer mechanisms.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">8. How long we keep your data (retention)</h2>
          <p className="text-muted-foreground leading-relaxed">
            We keep personal data only as long as necessary for the purposes described above, including legal, operational, and
            security needs. Retention varies by data type:
          </p>
          <ul className="text-muted-foreground leading-relaxed">
            <li>
              <strong>Account data</strong>: retained while your account is active and for up to <strong>24 months</strong> after closure unless a longer period is needed for
              security, disputes, or legal requirements.
            </li>
            <li>
              <strong>Donation records</strong>: retained for at least <strong>seven (7) years</strong> from the date of the transaction where required for accounting, tax, and audit
              purposes, unless applicable law requires a longer period.
            </li>
            <li>
              <strong>Operational/case records</strong>: retained according to internal safeguarding and program policies and applicable laws; typically for the duration of
              services plus a defined archival period for child protection and legal defense, unless a shorter or longer period is required by law.
            </li>
            <li>
              <strong>Security and application logs</strong>: retained for approximately <strong>90 days</strong>, unless extended for incident investigation or legal hold.
            </li>
          </ul>

          <h2 className="font-heading text-2xl font-semibold mt-8">9. How we protect your data</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use administrative, technical, and physical safeguards designed to protect personal data, including HTTPS (TLS) for data in transit,
            hashed passwords, role-based access control for staff and administrators, authentication tokens with limited lifetime, and separation between public
            marketing pages and authenticated operational tools. Access to sensitive operational and case information is restricted to authorized staff on a need-to-know
            basis. We review access patterns and update practices as threats evolve. No method of transmission over the Internet is completely secure; we encourage
            strong passwords and protecting your account credentials.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">10. Your data protection rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            Depending on where you live and how we process your data, you may have rights including:
          </p>
          <ul className="text-muted-foreground leading-relaxed">
            <li>
              <strong>Access</strong>: request a copy of your personal data.
            </li>
            <li>
              <strong>Rectification</strong>: request correction of inaccurate or incomplete data.
            </li>
            <li>
              <strong>Erasure</strong>: request deletion of your personal data in certain situations.
            </li>
            <li>
              <strong>Restriction</strong>: request we limit processing in certain situations.
            </li>
            <li>
              <strong>Objection</strong>: object to processing based on legitimate interests in certain situations.
            </li>
            <li>
              <strong>Data portability</strong>: request transfer of certain data to you or another provider.
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            To exercise these rights, contact us at <strong>privacy@bonfiresanctuary.org</strong>. We may need to verify your identity. We will respond within the timeframes
            required by applicable law (for example, within one month for GDPR requests, subject to extension where permitted).
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">11. Withdrawing consent</h2>
          <p className="text-muted-foreground leading-relaxed">
            Where we rely on your consent, you can withdraw it at any time by contacting us at <strong>privacy@bonfiresanctuary.org</strong> or using in-product controls where
            available (for example, cookie preferences via our cookie banner). Marketing emails, where we send them, will include an unsubscribe link where required.
            Withdrawing consent does not affect the lawfulness of processing before you withdrew it.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">12. Automated decision-making</h2>
          <p className="text-muted-foreground leading-relaxed">
            Bonfire may use automated analysis (including machine learning) to produce insights for staff—for example, donor lapse risk scores or resident risk
            indicators displayed on internal dashboards. These tools are aids to prioritization and do not replace professional judgment. We do not make decisions that
            produce legal or similarly significant effects concerning you solely by automated means without meaningful human involvement appropriate to the context.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">13. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use essential cookies and similar storage to make the site work and to remember your cookie consent choice. For
            details, please see our <a href="/cookies">Cookie Policy</a>.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">14. Links to other websites</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our website may contain links to other websites. This Privacy Policy applies only to Bonfire’s website. If you follow a
            link to another site, review that site’s privacy policy.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">15. Changes to this policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We keep this Privacy Policy under review and will post updates on this page. The “Last updated” date above shows when
            this policy was most recently changed. For material changes, we may provide additional notice (for example, by email or a notice in the portal) where
            appropriate.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">16. How to contact us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about this Privacy Policy or our data practices, contact:
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Email: <strong>privacy@bonfiresanctuary.org</strong>
            <br />
            Address: <strong>12 Bayanihan Street, Barangay San Antonio, Makati City 1200, Philippines</strong>
            <br />
            Phone: <strong>+63 (2) 8555-0142</strong>
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">17. How to complain</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have a concern about how we handle personal data, please contact us first at <strong>privacy@bonfiresanctuary.org</strong> so we can try to resolve it.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            If you are in the <strong>Philippines</strong>, you may file a complaint with the{" "}
            <strong>National Privacy Commission (NPC)</strong> (
            <a href="https://privacy.gov.ph" className="underline" target="_blank" rel="noopener noreferrer">
              privacy.gov.ph
            </a>
            ).
          </p>
          <p className="text-muted-foreground leading-relaxed">
            If you are in the <strong>European Economic Area</strong>, you have the right to lodge a complaint with a supervisory authority in your country of residence,
            place of work, or place of an alleged infringement. A list of EU data protection authorities is available from the European Data Protection Board.
          </p>
        </div>
      </div>
    </div>
  );
}
