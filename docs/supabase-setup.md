# Supabase Setup — Apus DMA — Participant Questionnaire

**Last updated:** 2026-09-10 — Session 1

## Project
- Name: `greenfriend Double Materiality Assessment` (existing project — reused per
  the builder's instruction; does **not** match the spec's originally proposed
  `greenfriend-dma` name, kept as-is rather than renaming/recreating)
- Project ID: `evwmxduudcujtibirmga`
- Project URL: `https://evwmxduudcujtibirmga.supabase.co`
- Region: `eu-west-1`
- Plan: Free at time of writing — **builder must upgrade to Pro** before real
  client use (CLAUDE.md requirement, to avoid auto-pause during a quiet stretch
  of a multi-week questionnaire window)

## Tables

### assessments
Owned/written by the Consultant Console (Tool B). This tool only reads it.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | default `gen_random_uuid()` |
| name | text | used as the "company name" in the Welcome screen title |
| description | text | nullable |
| mode | text | `quantitative` \| `qualitative` |
| perspective_filter | text | `full` \| `impact` \| `financial` |
| status | text | default `'draft'` |
| start_date | date | nullable |
| end_date | date | nullable |
| slug | text | unique — this is the public link identifier (`/survey/:slug`) |
| logo_url | text | nullable |
| welcome_text | text | nullable |
| task_text | text | nullable — **not currently read** by the ported `ParticipantExperience.jsx` (see PROGRESS.md Build decisions) |
| mandatory | bool | default `false` |
| created_at | timestamptz | default `now()` |

### iros
Owned/written by the Consultant Console (Tool B). This tool only reads it.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | default `gen_random_uuid()` |
| assessment_id | uuid, FK → assessments.id | `on delete cascade` |
| esrs_topic_id | text | e.g. `E1`, `S2`, `G1` |
| subtopic_raw | text | nullable |
| name | text | |
| description | text | nullable |
| iro_type | text | `neg_impact` \| `pos_impact` \| `risk` \| `opportunity` |
| actual | bool | default `false` — actual vs. potential |
| impact_threshold | numeric | nullable — unused by this tool (Tool B's scoring input) |
| financial_threshold | numeric | nullable — unused by this tool |
| order | integer | default `0` — display order on the participant side |
| created_at | timestamptz | default `now()` |

### ratings
Owned/written by this tool (Participant Questionnaire). Tool B reads it.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | default `gen_random_uuid()` |
| assessment_id | uuid, FK → assessments.id | `on delete cascade` |
| iro_id | uuid, FK → iros.id | `on delete cascade` |
| criterion_key | text | `scale` \| `scope` \| `irreversibility` \| `likelihood` \| `magnitude` \| `financialLikelihood` |
| value | integer, nullable | 0–5, `null` means skipped |
| stakeholder_group | text | free text label chosen on the Stakeholder Group screen |
| session_id | uuid | generated client-side once per participant visit |
| submitted_at | timestamptz | default `now()` |

Indexes: `iros(assessment_id)`, `ratings(assessment_id)`, `ratings(iro_id)`,
`assessments(slug)`.

## RLS Policies

| Table | Policy | Effect |
|---|---|---|
| assessments | `anon select assessments` | `anon` role can `select` — the app always filters by exact `slug`, so this is a point-lookup in practice, not a public listing |
| iros | `anon select iros` | `anon` role can `select` — the app always filters by exact `assessment_id` obtained from the assessments lookup |
| ratings | `anon insert ratings` | `anon` role can `insert` only — no select/update/delete from the anon role |

No insert/update/delete policy exists on `assessments` or `iros` for `anon` — those
tables are read-only from this tool's side, matching CLAUDE.md.

## Protected tables (not created by this tool)
`assessor_ratings`, `calibrations`, `participants`, `stakeholder_options` belong
to the Consultant Console (Tool B) and do not exist yet. This tool's data layer
(`src/lib/data.js`) attempts a best-effort read of `stakeholder_options` for the
Stakeholder Group screen and falls back to the spec's default option lists when
the table doesn't exist or returns no rows — see PROGRESS.md.

## Environment variables
- `VITE_SUPABASE_URL` = `https://evwmxduudcujtibirmga.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = the legacy anon key (JWT) from Project Settings →
  API. Set both as Netlify environment variables at deploy time; never commit
  real values (`.env` is gitignored, `.env.example` has empty placeholders).

## Notes for future sessions
- This session's sandbox could not reach `*.supabase.co` directly (organization
  egress policy blocks it for direct HTTPS/browser traffic) — schema changes went
  through fine via the Supabase MCP tool, but a live browser test of the deployed
  frontend against this project could not be done from within this session. Test
  on Netlify (or the builder's own machine) once deployed.
- A demo assessment (`slug = 'acme-2026'`, 5 IROs covering all four `iro_type`
  values) was inserted for testing — safe to delete once Tool B exists and real
  assessments are created there.
- When Tool B is built and creates `stakeholder_options`, no change should be
  needed here — `fetchStakeholderOptions` in `src/lib/data.js` already queries it
  and only needs the table to start existing.
