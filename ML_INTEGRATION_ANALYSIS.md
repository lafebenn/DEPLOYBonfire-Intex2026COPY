# ML Pipeline Integration Analysis
**Prepared:** April 8, 2026  
**Scope:** Social Media Pipeline, Reintegration Pipeline, Resident Risk Pipeline — integration into the Bonfire site

---

## What Each Pipeline Does

### 1. Social Media Pipeline (`social-media-pipeline.ipynb`)
A **true trained ML model** (ensemble regression). Given features known *before* a post is published (platform, content type, timing, hashtag count, sentiment tone, whether it's boosted, follower count), it predicts how many **donation referrals** that post will generate.

- **Output function:** `predict_donations(df)` → returns `predicted_donation_referrals` (integer) per row
- **Saved artifacts:** `models/social_media_donation_model.joblib`, `models/model_metadata.joblib`
- **Target:** `donation_referrals`
- **Key insight:** Post-publish engagement data (likes, shares, reach) is intentionally excluded to prevent data leakage — the model only uses what you know before hitting "post"

### 2. Reintegration Pipeline (`reintegration_pipeline.ipynb`)
**Not an AI model.** It is a rule-based weighted scoring system that computes a **0–100 Reintegration Progress Score** for each resident from 7 tables already in the database.

- **Output function:** `score_resident(resident_id, ...)` → returns composite score, progress band, 6 domain sub-scores, available domains
- **Saved artifacts:** `models/reintegration_scores.csv`, `models/reintegration_flags.csv`, `models/reintegration_monthly_trend.csv`, `models/reintegration_score_config.joblib`
- **6 domains and weights:**
  - Psychological (counseling sessions): 25%
  - Family Environment (home visits): 25%
  - Education: 20%
  - Physical Wellbeing: 15%
  - Intervention Progress: 10%
  - Behavioral Stability (incidents): 5%
- **Progress bands:** Positive Pattern (75–100), Mixed Pattern (50–74), Developing Pattern (25–49), Early Pattern (0–24)
- **Trend labels:** Progressing, Stable, Stalling, Regressing (computed month-over-month)
- **Run time:** < 1 second per resident; 2–5 seconds for all 60; no GPU, no AI credits, no external APIs

### 3. Resident Risk Detection (`resident-risk-retention-detection.ipynb`)
A **true trained ML binary classifier**. Classifies residents as Standard Risk (Low/Medium) or Elevated Risk (High/Critical). Also has a hard rule-based safety layer (e.g., any self-harm event independently flags Elevated Risk).

- **Output function:** `predict_risk(df_residents, df_incidents, df_process, df_visitations)` → returns `predicted_risk_label`, `rule_flag`, `combined_alert`, `rules_triggered`
- **Saved artifacts:** `models/resident_risk_pipeline.joblib`, `models/resident_risk_metadata.joblib`

---

## What the Site Already Has

The backend is **already architected for Railway ML integration**. The following is already built and wired:

| Component | File | Purpose |
|---|---|---|
| `MlService` | `Services/MlService.cs` | Calls Railway ML endpoints, caches results in DB with 24-hour expiry |
| `MlPredictionsController` | `Controllers/MlPredictionsController.cs` | CRUD for `ml_predictions` table; auto-refreshes on cache miss |
| `MlRefreshController` | `Controllers/MlRefreshController.cs` | Background refresh endpoint for all supporters |
| `MlRefreshBackgroundService` | `Services/MlRefreshBackgroundService.cs` | Scheduled background refresh |
| `SocialMediaPostsController` | `Controllers/SocialMediaPostsController.cs` | Full CRUD for social media posts table |

The `MlService` is already calling these Railway endpoints (currently returning zero because `RailwayMl:BaseUrl` is not set):
- `POST /predict/donor-lapse`
- `POST /predict/resident-risk`
- `POST /predict/social-media-score`
- `POST /predict/donor-upgrade`

**The Railway ML microservice is the missing piece.** Everything else — caching, background refresh, DB storage, C# wiring — is already done.

### Frontend Status

| Page | Route | ML Status |
|---|---|---|
| `SocialMediaInsightsPage` | `/app/social` | **100% mock data** — `socialMediaMock.ts` hardcoded; real `socialMediaApi` in `api.ts` is defined but never called |
| `ResidentDetailPage` | `/app/caseload/:id` | No reintegration score shown yet |
| `AdminDashboard` | `/app` | Shows composite attention scores (already live via `ResidentAttentionScoreComputer.cs`) and lapse risk scores for donors |
| `CaseloadPage` | `/app/caseload` | Shows residents list; no ML scores displayed |
| `DonorsPage` | `/app/donors` | Already shows `lapseRiskScore` from ML predictions table |

---

## Question 1: Is Integration Possible?

**Yes, absolutely — and the hardest work is already done.**

The C# backend already has a complete ML prediction caching layer, refresh service, DB table, and HTTP client wired to call Railway. The only missing component is the Python microservice that serves the models. Once that microservice is deployed and `RailwayMl:BaseUrl` is set in `appsettings.json`, the entire system activates.

Specific integration targets:

**Social Media Insights Page (`/app/social`)**
- Replace `socialMediaMock.ts` with real calls to `GET /api/social-media-posts`
- Add a "predicted donation referrals" column/card for each post by calling `GET /api/ml/predictions/SocialMediaPost/{id}`
- Add aggregate stats (top performing platform, best posting time, best content type) computed from real post data

**Resident Detail Page (`/app/caseload/:id`)**
- Add a Reintegration Score card showing: composite score (0–100), progress band, 6 domain sub-scores, trend label
- The reintegration pipeline is not yet wired in `MlService.cs` — a new `GetReintegrationScoreAsync` method and Railway endpoint (`POST /predict/reintegration-score`) need to be added

**Caseload Page (`/app/caseload`)**
- Show a small reintegration score badge or risk label next to each resident row (data already available from ML predictions table once the service runs)

---

## Question 2: Is Railway a Good Option?

**Yes — it is the right choice for this project's scale.** The backend already assumes Railway (`RailwayMl:BaseUrl`, `RailwayMl:ApiKey` in `appsettings.json`). Reasons it works well:

- The ML models require only `pandas`, `numpy`, `joblib` — no GPU, no heavy inference stack
- All three pipelines score in under 1 second per entity and under 15 seconds for a full refresh
- Railway supports Python + FastAPI/Flask deployments natively with auto-deploy from git
- Railway provides persistent storage volumes (needed for `.joblib` model files)
- The free/hobby tier is sufficient for this scale (60 residents, small social media dataset)

**One important caveat:** Railway's free tier spins down containers after inactivity. For the first request after a cold start, there may be a 5–15 second delay while the container wakes up and loads the `.joblib` files. The backend's caching layer (`ml_predictions` table, 24-hour TTL) mitigates this — most requests will be served from cache, not from Railway.

---

## Question 3: Other Deployment Options

Listed from most to least recommended for this project:

### Option A: Railway (recommended — already designed for this)
Already wired in the backend. Deploy a FastAPI app serving `/predict/*` endpoints. Load `.joblib` files at startup.

### Option B: Render.com
Nearly identical to Railway. Free tier has the same cold-start limitation. A valid alternative if Railway pricing becomes a concern. No code changes needed (just update `RailwayMl:BaseUrl`).

### Option C: Azure Container Apps
If the project is already on Azure (the `.csproj` targets and Google Auth suggest possible Azure deployment), Container Apps can host the Python microservice alongside the .NET API. Scales to zero like Railway but with Azure's SLA. Slightly more configuration overhead.

### Option D: Self-host on the same server as the .NET API
Since the pipelines use no GPU and run in milliseconds, the Python microservice could run on the same VM/container as the .NET backend. This eliminates network latency between the API and the ML service entirely. Works well if you're deploying to a single VPS or Azure VM.

### Option E: Inline computation (no separate service)
The Reintegration Pipeline (not the social media or risk models) could be ported directly to C# since it is just weighted arithmetic — no trained model file needed. This would eliminate Railway entirely for that pipeline. The social media and risk pipelines require `scikit-learn` and SMOTE (not trivially portable to C#), so they still benefit from a Python service.

### Option F: Azure Functions (serverless)
Each `/predict/*` endpoint becomes an Azure Function. Cold starts are the same problem as Railway but Functions can be "always warm" at additional cost. More operational complexity than Railway for this use case.

---

## Question 4: Additional Functionality Within Existing Pages

All of the following can be surfaced within pages that already exist — no new pages or sections needed:

### AdminDashboard (`/app`)
- **Reintegration score distribution** — a small bar showing how many residents fall in each progress band (Positive / Mixed / Developing / Early). The dashboard already queries all active residents; adding band counts is a trivial aggregation.
- **Trending down alert** — residents whose monthly trend is "Stalling" or "Regressing" could appear in the "needs attention" list alongside the existing composite attention score.

### ResidentDetailPage (`/app/caseload/:id`)
- **Full reintegration score breakdown** — composite score + all 6 domain sub-scores as a visual bar/gauge. The pipeline already outputs each domain separately.
- **Monthly trend sparkline** — the pipeline produces a per-month history; a small line chart showing score trajectory over the resident's stay would be very meaningful for staff.
- **Trend label badge** — Progressing / Stable / Stalling / Regressing shown prominently next to the score.

### CaseloadPage (`/app/caseload`)
- **Progress band column** — add a sortable column showing each resident's progress band (Positive / Mixed / Developing / Early). Staff could filter/sort to find residents in the "Developing" or "Early" stages.
- The resident risk classification (Standard / Elevated) from the risk model could also show here as a badge.

### SocialMediaInsightsPage (`/app/social`)
- **Real data in all existing cards** — all KPI cards (PHP attributed, engagement %, reach, posts/week) are currently hardcoded mock values. Replacing them with aggregations from the real `social_media_posts` table requires no UI changes.
- **Predicted vs. actual donation referrals** — the social media model predicts pre-publish. After posts go live, comparing predicted vs. actual referrals would show how accurate the model has been. This fits naturally into the existing content-type or platform breakdown tables already on the page.
- **"Best time to post" recommendation** — the model's feature importance data (day + hour) can be surfaced as a recommendation card: "Posts on Tuesday at 7pm have historically predicted the highest donation referrals." No new UI section — this replaces the current hardcoded "scoring" mock bars.

---

## Summary Table

| Pipeline | Integration Feasibility | What's Missing | Recommended Deployment |
|---|---|---|---|
| Social Media | High — backend plumbing exists | Python microservice + `RailwayMl:BaseUrl` config + frontend real data swap | Railway |
| Reintegration | High — only needs new Railway endpoint + `GetReintegrationScoreAsync` in `MlService.cs` | Python endpoint + C# wiring + frontend score card on ResidentDetailPage | Railway (or inline C# port) |
| Resident Risk | Already partially wired (`GetResidentRiskScoreAsync` exists) | Python microservice + `RailwayMl:BaseUrl` config | Railway |

**The single highest-leverage action is deploying the Python ML microservice to Railway and setting `RailwayMl:BaseUrl`.** That one step activates three prediction types across the entire site simultaneously, because all the C# caching, refresh, and serving logic is already written.
