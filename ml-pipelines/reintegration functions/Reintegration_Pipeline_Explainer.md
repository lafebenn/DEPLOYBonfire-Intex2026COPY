# Reintegration Pipeline — Logic & Resource Explainer

> Use this document to study and present the reintegration tracking pipeline.
> All weights and thresholds referenced below are editable in the **Config cell**
> at the top of `reintegration_pipeline.ipynb`.

---

## Part 1 — How the Model Works

This is **not a machine-learning model** in the traditional sense.
There is no training phase, no neural network, and no AI inference.
It is a **rule-based weighted averaging system** built entirely on the data
already stored in Lighthouse Sanctuary's database.

The pipeline runs in four sequential steps:

---

### Step 1 — Text Values Are Converted to Numbers

The database stores many fields as human-readable text
(e.g., "Cooperative", "Favorable", "In Progress").
Before any math can happen, those text values are translated into numbers
using fixed lookup tables defined in the config cell.

| Field | Text Value | Number |
|---|---|---|
| Emotional state | Happy | 5 |
| | Hopeful | 4 |
| | Calm | 3 |
| | Anxious | 2 |
| | Sad | 2 |
| | Withdrawn | 1 |
| | Angry | 1 |
| | Distressed | 1 |
| Family cooperation | Highly Cooperative | 1.00 |
| | Cooperative | 0.75 |
| | Neutral | 0.50 |
| | Uncooperative | 0.00 |
| Visit outcome | Favorable | 1.00 |
| | Needs Improvement | 0.50 |
| | Inconclusive | 0.25 |
| | Unfavorable | 0.00 |
| Plan status | Achieved | 1.00 |
| | In Progress | 0.60 |
| | Open | 0.30 |
| | Abandoned | 0.00 |
| Completion status | Completed | 1.00 |
| | InProgress | 0.50 |
| | NotStarted | 0.00 |

---

### Step 2 — Six Domain Snapshots Are Computed (each 0–100)

Each domain reads from a specific database table, averages the resident's
records into a handful of numbers, then combines them into one 0–100 snapshot.
**Higher always means more positive signals.**

---

#### Domain 1 — Psychological Snapshot
**Source table:** `process_recordings` (counseling sessions)

| Component Weight | Field | What It Captures |
|---|---|---|
| 40% | `progress_noted` | Were sessions productive? |
| 30% | `concerns_flagged` (inverted) | How often did no concerns arise? |
| 30% | Emotional delta (end mood − start mood) | Did the resident's mood improve within the session? |

The emotional delta is mapped from its raw range (−5 to +5) onto a 0–100 scale
before being included in the formula.

---

#### Domain 2 — Family Environment Snapshot
**Source table:** `home_visitations`

| Component Weight | Field | What It Captures |
|---|---|---|
| 40% | `family_cooperation_level` (encoded) | Is the family actively supportive? |
| 40% | `visit_outcome` (encoded) | Did home visits go well overall? |
| 20% | `safety_concerns_noted` (inverted) | Were visits deemed safe for reintegration? |

---

#### Domain 3 — Education Snapshot
**Source table:** `education_records`

| Component Weight | Field | What It Captures |
|---|---|---|
| 35% | `attendance_rate` | Is the resident showing up consistently? |
| 35% | `progress_percent` | How far along is she in the program? |
| 30% | `completion_status` (encoded 0 / 0.5 / 1.0) | Has she finished any programs? |

---

#### Domain 4 — Physical Wellbeing Snapshot
**Source table:** `health_wellbeing_records`

All four health fields are equally weighted (25% each), each converted from
a 1–5 scale to a 0–100 range:

| Field | What It Captures |
|---|---|
| `general_health_score` | Overall physical health |
| `nutrition_score` | Diet quality |
| `sleep_quality_score` | Sleep quality |
| `energy_level_score` | Daytime energy and engagement |

---

#### Domain 5 — Intervention Progress Snapshot
**Source table:** `intervention_plans`

The average plan status score across all active plans is used (0–100).
When **Reintegration-category plans** exist for a resident, those are
prioritized over general plans, since they are most directly relevant
to the outcome being tracked.

| Plan Status | Encoded Value |
|---|---|
| Achieved | 1.00 → 100 |
| In Progress | 0.60 → 60 |
| Open | 0.30 → 30 |
| Abandoned | 0.00 → 0 |

---

#### Domain 6 — Behavioral Stability Snapshot
**Source table:** `incident_reports`

This snapshot starts at **100** and applies deductions for incidents:

| Incident Type | Deduction | Cap |
|---|---|---|
| Any incident | −4 points each | Max −40 |
| Serious (self-harm or runaway) | −12 points each | Max −36 |

Residents with **zero incidents on record always score 100**.
The maximum total deduction is 76 points, so the floor is 24 (unless both
caps are hit simultaneously, which is unusual in practice).

---

### Step 3 — Weighted Composite Snapshot (0–100)

The six domain snapshots are combined into a single number using
the following weights (all adjustable in the config cell):

| Domain | Weight | Why This Weight |
|---|---|---|
| Psychological | **25%** | Emotional readiness is central to successful reintegration |
| Family Environment | **25%** | A safe, cooperative home is a prerequisite for return |
| Education | **20%** | Academic/vocational progress supports long-term stability |
| Physical Wellbeing | **15%** | Health affects all other areas of functioning |
| Intervention Progress | **10%** | Goal-tracking reflects structured case plan progress |
| Behavioral Stability | **5%** | Incidents matter but should not dominate the picture |
| **Total** | **100%** | |

#### Sparse Data Handling
If a resident has **no records in a domain** (e.g., no home visits yet),
that domain is **excluded** from the calculation entirely.
The remaining weights are rescaled so they still add up to 100%.
This means a new resident is never unfairly penalized for having a short history.

#### Risk Trajectory Adjustment
After the weighted composite is calculated, a small **±3 point adjustment**
is applied based on whether the resident's risk level has changed since intake
(pulled from the `residents` table):

| Risk Change Since Intake | Adjustment |
|---|---|
| Risk level improved (e.g., Critical → Low) | +3 points |
| Risk level unchanged | 0 points |
| Risk level worsened | −3 points |

#### Progress Pattern Categories
The final composite snapshot is placed into one of four plain-language categories
for staff display:

| Category | Composite Range |
|---|---|
| Positive Pattern | 75–100 |
| Mixed Pattern | 50–74 |
| Developing Pattern | 25–49 |
| Early Pattern | 0–24 |

---

### Step 4 — Monthly Trend Analysis

A single snapshot tells staff where a resident stands **right now**.
The trend analysis tells them **whether things are getting better or worse over time**.

For every resident, the composite snapshot is re-computed at each calendar month
where records exist, creating a personal timeline. Each month is then labeled
with one of four trend statuses:

| Trend Status | Condition | What It Means for Staff |
|---|---|---|
| **Progressing** | Snapshot rose by more than 2 points | Current care plan is working |
| **Stable** | Change is within ±2 points | Maintaining — monitor and continue |
| **Stalling** | Flat or declining for 2+ consecutive months | Review care plan — change may be needed |
| **Regressing** | Dropped 5+ points in a single month | Urgent attention recommended |

The thresholds (2 months, −5 points) are adjustable in the config cell.

---

## Part 2 — Resource Cost

### Short Answer: This Pipeline Uses Zero AI Credits

The pipeline runs as **plain Python code** on your server.
It reads database records, does arithmetic, and writes output files.
There are no AI API calls, no model training, and no cloud inference.

### Detailed Comparison

| Resource | This Pipeline | A Typical AI/ML Model |
|---|---|---|
| AI API calls | **None** | Hundreds per run |
| GPU compute | **None** | Required for training |
| Azure AI credits | **$0** | Billed per token / per run |
| Cloud inference endpoint | **None** | Required and billed |
| External dependencies | pandas, numpy, joblib | Many, often licensed |

### How Fast Does It Run?

| Operation | Estimated Time | When It Runs |
|---|---|---|
| Score a single resident on demand | < 1 second | When staff views a resident's page |
| Refresh all 60 residents | 2–5 seconds | Nightly batch job or manual trigger |
| Rebuild full monthly trend history (534 data points) | 5–15 seconds | Weekly or on-demand |

### What Infrastructure Do You Need?

Only a standard Python environment with:
- `pandas` — data manipulation
- `numpy` — math
- `joblib` — saving/loading the config weights
- `matplotlib` / `seaborn` — charts (pipeline only, not needed on the site)

All of these are already listed in your `requirements.txt` and are **free and open-source**.

---

## Key Takeaways for Presentation

1. **It reads your own data** — no external data sources, no third-party models.
2. **The weights are tunable** — if staff believe family environment deserves more emphasis, change one number in the config cell and re-run.
3. **Missing data is handled gracefully** — a resident is never penalized for a short record history.
4. **The output is a guide, not a verdict** — the pattern categories and trend labels are designed to prompt conversations, not replace professional judgment.
5. **It costs nothing extra to run** — no credits consumed, no API calls, just Python doing math on your existing records.
