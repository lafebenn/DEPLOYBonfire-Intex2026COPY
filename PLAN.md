# Bonfire — project plan (living document)

## Mission & client context (INTEX case)

- **Inspiration**: The case is modeled on organizations like **Lighthouse Sanctuary** (US 501(c)(3)) that fund **safe homes and rehabilitation** for girls who are survivors of abuse or trafficking (example geography in materials: Philippines). **Bonfire** represents a **new organization** expanding similar services to other regions.
- **Data**: Anonymized operational patterns from a real-style nonprofit — caseload inventory, **process recordings** (structured counseling notes), **home visitations**, accomplishment-style reporting — inform what the system should support.
- **Sensitivity**: Data involves **minors who are abuse survivors**. **Privacy and safety are non-negotiable**; design and security assumptions should reflect that (restricted fields, RBAC, least privilege, careful deletion).

## Business problems to solve (product north star)

1. **Fundraising & donors**: Donor retention and growth; understanding **which campaigns work** vs noise; **who may lapse** vs who could give more; **personalized outreach** without a marketing team; **connecting gifts to resident outcomes** for communication.
2. **Operations & case management**: Avoid girls “falling through the cracks”; track **who is progressing vs struggling**; which **interventions work**; readiness for **reintegration** vs **regression risk**. Full lifecycle: intake → assessment → counseling → education → health → **reintegration/placement**, plus process recordings, home visits, **case conferences**, intervention plans.
3. **Social / outreach**: Social media is the main donor channel, but the org lacks expertise; they need help deciding **what, where, when, and what content drives donations** vs vanity metrics.
4. **Administration**: **Small staff** — CRUD must be straightforward, with **safe delete** patterns and clear maintenance paths.

## Dataset (IS course materials)

- **Source (17 CSVs + data dictionary)**: https://drive.google.com/file/d/1Dl8AcS1ydbHKL6PU0gP6tbUPqhPsUeXZ/view?usp=sharing  
- **Domains** (organize schema and features around these):
  - **Donor & support**: safehouses, partners, supporters, donations (monetary, in-kind, time, skills, advocacy), allocations, etc.
  - **Case management**: residents, process recordings, home visitations, education, health/wellbeing, intervention plans, incidents, etc.
  - **Outreach & communication**: social media posts/metrics, public impact snapshots, etc.
- **Flexibility**: Teams may **add tables/fields**, **subset** the provided tables, and **modify** data to fit the product — use what supports the UX and rubric; don’t surface every column on every screen.

## Stack (target)

- **Frontend**: React + TypeScript + Vite  
- **Backend**: **.NET 10 / C#** (ASP.NET Core API) per IS413  
- **Database**: Azure SQL, MySQL, or PostgreSQL — **operational DB deployed**; **identity DB** may be separate; **both** should be real DBMS in production (not SQLite) for full IS414 credit on that item.  
- **Hosting**: Azure recommended (class practice/credits); other clouds allowed if team accepts extra friction.

## IS 413 — required application surface (checklist)

**Public (non-authenticated)**  
- Home / landing (mission, CTAs)  
- **Impact** — aggregated, anonymized impact dashboard  
- **Login** — username/password, validation, errors  
- **Privacy + cookie consent** (GDPR-oriented; see IS414)

**Authenticated — staff/admin portal**  
- **Admin dashboard** — command center (residents, donations, conferences, progress summaries)  
- **Donors & contributions** — supporter profiles (types/status), all contribution types, allocations across safehouses/programs  
- **Caseload inventory** — resident records aligned with **Philippine social-welfare-style** fields; filter/search (status, safehouse, category, etc.)  
- **Process recording** — session notes; full **chronological** history per resident  
- **Home visitation & case conferences** — visits (types, observations, safety, follow-up) + conference history/upcoming  
- **Reports & analytics** — trends (donations, resident outcomes, safehouse comparison, reintegration); align where useful with **annual accomplishment** style reporting (caring/healing/teaching, beneficiary counts)

**Misc**  
- Extra pages needed for IS414 (security), IS455 (ML), accessibility, partners, etc.

**Quality bar (IS413)**: Validation, error handling, polish (titles, icons, pagination, performance, consistent UI).

## IS 414 — security expectations (condensed)

- **TLS**: HTTPS everywhere; **redirect HTTP → HTTPS**; **HSTS** for additional credit.  
- **Auth**: ASP.NET Identity (or equivalent); **stronger-than-default passwords** per **class/lab instructions** (not generic docs).  
- **APIs**: Public `/login` and `/auth/me`-style endpoints work without auth; **CUD and sensitive reads** locked down; default **restrictive**.  
- **RBAC**: Only **admin** (or as specified) may add/update/delete; **donors** see **their** history/impact only; visitors see allowed public pages.  
- **Integrity**: **Confirm before delete** for authorized roles.  
- **Credentials**: Not in repo — env / secrets manager / `.env` gitignored.  
- **Privacy**: Tailored **privacy policy** in footer; **functional** cookie consent (video must say if cosmetic vs real).  
- **CSP**: **`Content-Security-Policy` HTTP header** (not meta-only) — tight allowlists.  
- **Deployment**: Public URL.  
- **Extras** (partial points): OAuth, MFA, non-httpOnly preference cookie for UI, sanitization/encoding, Docker, etc.  
- **Video**: Security points require **demonstration in the IS414 video** — undocumented features don’t count.

## IS 455 — machine learning (condensed)

- Deliver **complete pipelines** (`ml-pipelines/*.ipynb`), each addressing a **different** business problem.  
- Each notebook: problem framing (predictive vs explanatory), data prep, exploration, modeling, evaluation, feature selection, **deployment notes** tied to the web app.  
- **Deploy** meaningful outputs (API, dashboard, UI) — notebooks-only are insufficient.  
- Quality over unchecked quantity (~1/5 of overall INTEX grade).

## IS 401 — process deliverables (FYI)

- Daily sprint artifacts (Figjam, MoSCoW, backlog, burndowns, wireframes, etc.) — follow course Learning Suite deadlines; not duplicated here.

## Authentication & INTEX grading accounts (IS414)

Per submission requirements, document **three** accounts for faculty/TAs:

1. **Admin — no MFA** — e.g. demo: `admin@bonfire.org` / `admin123`  
2. **Donor — no MFA + historical donations** — donors **must have accounts** to give and see **their** history; e.g. demo: `donor@bonfire.org` / `donor123`  
3. **MFA enabled** (admin or donor) — password succeeds then **MFA required**; graders verify enforcement only; e.g. demo: `mfa@bonfire.org` / `mfa123`

### Product rules aligned with INTEX

- **Donate / giving**: Sign-in before completing a donation (and donor-specific history). Public: landing, impact (aggregated), privacy, cookies.  
- **RBAC**: Admin / staff / fundraising / **donor** — donors **never** access case-management data; they see **their** gifts and impact.

### Implementation notes (demo vs production)

- **Current frontend**: mock auth in `AuthContext`; MFA shows a second step not completable in demo.  
- **Production**: ASP.NET Identity, policies, optional TOTP/app MFA, separate identity DB as appropriate.

## Submission & logistics (verify in course materials)

- **Final deliverable**: Due **Friday April 10, 2026, 10:00 AM** (presentations that day) — submit via course **Qualtrics** form (URL in syllabus; double-check each semester).  
- **Include**: Group info, **correct** live site URL, **public** GitHub branch link, pipeline notebook links or Azure ML screenshots, **per-class video links** (IS413 / IS414 / IS455 **separate** — graders for one class may not watch another’s video).  
- **Videos**: Public or unlisted; **show each requirement** clearly; missing from video = missing for grading.  
- **Credentials**: Submit the three account types above in the form — **do not** make graders hunt.  
- **Peer evaluation**: Required by deadline in syllabus — incomplete eval can block INTEX grade.  
- **Questions**: Use course **Slack `#questions`** for case/requirement clarifications; technical “do my homework” style help from faculty may be limited per syllabus.

## Deployment

- Target: **Azure App Service** (or containers) + managed SQL — align with HTTPS, secrets, and DB deployment requirements above.
