export default function PrivacyPage() {
  return (
    <div className="py-16">
      <div className="section-container max-w-3xl">
        <h1 className="font-heading text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-warm max-w-none space-y-6 text-foreground">
          <p className="text-muted-foreground text-lg">Last updated: [[TODO: Month Day, Year]]</p>

          <p className="text-muted-foreground leading-relaxed">
            This Privacy Policy explains how <strong>Bonfire</strong> (“Bonfire”, “we”, “us”) collects and uses personal data when
            you use our website and services, including our public pages (Home, Impact) and our authenticated portal (staff/admin
            and donors). Because our mission involves supporting survivors and vulnerable individuals, we design our systems to
            minimize collection, restrict access, and publish only aggregated/anonymized impact information where appropriate.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">1. Who we are (Data Controller)</h2>
          <p className="text-muted-foreground leading-relaxed">
            Data controller: <strong>Bonfire</strong>
            <br />
            Address: <strong>[[TODO: Bonfire mailing address]]</strong>
            <br />
            Email: <strong>[[TODO: privacy email address]]</strong>
            <br />
            Phone: <strong>[[TODO: phone number]]</strong>
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Data Protection Officer (DPO) / privacy contact: <strong>[[TODO: DPO name and contact info, or “Not appointed”]]</strong>
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">2. What data we collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            We collect only what we need to operate Bonfire’s services. Depending on your relationship with Bonfire, this may include:
          </p>
          <ul className="text-muted-foreground leading-relaxed">
            <li>
              <strong>Account data (staff/admin/donor portal)</strong>: username, password (stored as a secure hash), role (e.g., donor, staff, admin),
              and authentication/session information.
            </li>
            <li>
              <strong>Donor/supporter data</strong>: name, email, phone (if provided), country/region, and communication preferences
              <span> [[TODO: confirm exactly what supporter fields are collected in your UI]]</span>.
            </li>
            <li>
              <strong>Donation and contribution data</strong>: donation amounts (for monetary donations), contribution type (monetary, in-kind, time,
              skills, social advocacy), dates, and campaign/channel details.
            </li>
            <li>
              <strong>Operational and case-management data (restricted access)</strong>: information recorded by authorized staff to coordinate services,
              such as case status, visit logs, counseling session documentation, education/health progress, intervention plans, and incident reports.
              This data may relate to vulnerable individuals and may be highly sensitive.
            </li>
            <li>
              <strong>Website technical data</strong>: basic device/browser information necessary to deliver the site, secure it, and keep it functioning.
              <span> [[TODO: list any logs you keep: IP address, user agent, timestamps, etc.]]</span>
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
              <strong>Automatically</strong> through essential cookies and server logs when you use the website.
            </li>
            <li>
              <strong>Indirectly from partners/referrers</strong> only when needed for services or operations.
              <span> [[TODO: confirm if you ingest any partner/referral data in production]]</span>
            </li>
          </ul>

          <h2 className="font-heading text-2xl font-semibold mt-8">4. Why we use your data (purposes) and legal bases</h2>
          <p className="text-muted-foreground leading-relaxed">
            We process personal data for the purposes below. The GDPR requires us to have a “lawful basis” for each purpose.
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
              Lawful basis: <strong>contract</strong> (to process your contribution) and <strong>legal obligation</strong> (record-keeping) <span>[[TODO: specify applicable laws/jurisdiction]]</span>.
            </li>
            <li>
              <strong>Communicate with supporters</strong> (respond to inquiries, provide updates you request, stewardship such as thank-you messages).
              <br />
              Lawful basis: <strong>legitimate interests</strong> and/or <strong>consent</strong> where required.
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
              Lawful basis: <strong>vital interests</strong> and/or <strong>public interest</strong> and/or <strong>legitimate interests</strong>
              <span> [[TODO: choose the bases that match your real-world operations and jurisdiction]]</span>.
            </li>
            <li>
              <strong>Publish impact information</strong> on our public “Impact” pages using aggregated/anonymized metrics.
              <br />
              Lawful basis: <strong>legitimate interests</strong> (transparency to donors and the public).
            </li>
            <li>
              <strong>Machine learning / analytics features</strong> (e.g., predicting donor lapse risk, analyzing program trends) when enabled.
              We design these features to avoid unnecessary personal data and to limit access to authorized staff.
              <br />
              Lawful basis: <strong>legitimate interests</strong> and/or <strong>consent</strong> where required
              <span> [[TODO: describe which ML outputs are shown to whom]]</span>.
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
              <strong>Service providers</strong> that host and operate our systems (e.g., cloud hosting, database hosting, email delivery).
              <span> [[TODO: list vendors used in production: Azure, email provider, etc.]]</span>
            </li>
            <li>
              <strong>Authorized partners</strong> only when needed to deliver services or coordinate operations, and only to the extent necessary.
              <span> [[TODO: describe partner categories and typical data shared]]</span>
            </li>
            <li>
              <strong>Legal/Compliance</strong> where required by law or to protect rights, safety, and security.
            </li>
          </ul>

          <h2 className="font-heading text-2xl font-semibold mt-8">7. International transfers</h2>
          <p className="text-muted-foreground leading-relaxed">
            Bonfire may process or store data in countries other than where you live, depending on our hosting and service providers.
            When data is transferred internationally, we use appropriate safeguards as required by law.
            <span> [[TODO: specify hosting region(s) and transfer safeguard(s), e.g., SCCs]]</span>
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">8. How long we keep your data (retention)</h2>
          <p className="text-muted-foreground leading-relaxed">
            We keep personal data only as long as necessary for the purposes described above, including legal, operational, and
            security needs. Retention varies by data type:
          </p>
          <ul className="text-muted-foreground leading-relaxed">
            <li>
              <strong>Account data</strong>: retained while your account is active, and for a limited time afterward for security and audit needs
              <span> [[TODO: define retention period]]</span>.
            </li>
            <li>
              <strong>Donation records</strong>: retained as required for financial record-keeping
              <span> [[TODO: define retention period and reason]]</span>.
            </li>
            <li>
              <strong>Operational/case records</strong>: retained according to safeguarding requirements and applicable laws/policies
              <span> [[TODO: define retention policy for case management records]]</span>.
            </li>
            <li>
              <strong>Security logs</strong>: retained for a limited time for monitoring and incident response
              <span> [[TODO: define retention period]]</span>.
            </li>
          </ul>

          <h2 className="font-heading text-2xl font-semibold mt-8">9. How we protect your data</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use administrative, technical, and physical safeguards designed to protect personal data, including encryption in
            transit, access controls, and role-based permissions. Access to sensitive operational/case information is restricted to
            authorized staff.
            <span> [[TODO: describe security measures at a high level without exposing secrets]]</span>
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
            To exercise these rights, contact us at <strong>[[TODO: privacy email address]]</strong>. We may need to verify your identity.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">11. Withdrawing consent</h2>
          <p className="text-muted-foreground leading-relaxed">
            Where we rely on your consent, you can withdraw it at any time by contacting us or using the relevant settings in the
            service. Withdrawing consent does not affect the lawfulness of processing before you withdrew it.
            <span> [[TODO: describe the specific consent flows you offer (email opt-in, etc.)]]</span>
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">12. Automated decision-making</h2>
          <p className="text-muted-foreground leading-relaxed">
            Bonfire may use automated analysis (including machine learning) to produce insights for staff (for example, identifying
            trends or prioritizing follow-up). We do not make decisions that produce legal or similarly significant effects solely by
            automated processing without appropriate human review.
            <span> [[TODO: confirm this statement matches your implementation]]</span>
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
            this policy was most recently changed.
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">16. How to contact us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about this Privacy Policy or our data practices, contact:
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Email: <strong>[[TODO: privacy email address]]</strong>
            <br />
            Address: <strong>[[TODO: Bonfire mailing address]]</strong>
            <br />
            Phone: <strong>[[TODO: phone number]]</strong>
          </p>

          <h2 className="font-heading text-2xl font-semibold mt-8">17. How to complain</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have a concern about how we handle personal data, please contact us first so we can try to resolve it.
            Depending on where you live, you may also have the right to lodge a complaint with your local data protection authority.
            <span> [[TODO: name the authority relevant to your primary EU audience (e.g., ICO) and provide contact details]]</span>
          </p>
        </div>
      </div>
    </div>
  );
}
