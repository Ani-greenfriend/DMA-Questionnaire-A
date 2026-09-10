# Apus DMA — Participant Questionnaire

## Identity
A public, no-login web page where one external stakeholder rates a set of ESRS double-materiality IROs for one assessment, one topic per page.
Tier: 2 — persists to Supabase, no login required (D3+A1)
Spec version governed: v1.0 — the version of docs/product-spec.md these rules were derived from.
Position: Tool A of 2 in the greenfriend-dma stack — shares the Supabase project with Apus DMA — Consultant Console; this tool creates the schema.

## Session Protocol
At the start of every session:
1. Pull the latest from main before reading anything else.
2. Check docs/product-spec.md: if its version is newer than the "Spec version governed" line in this file, STOP. Tell the builder: "The spec has changed since this CLAUDE.md was written — re-run the Project Governor on the revised spec before building, or these rules may contradict it." Do not build against a stale CLAUDE.md.
3. Read PROGRESS.md in the project root — it is the current state of this build. If it is missing, recreate it with the structure described there, then continue.
4. Increment the session number and update the date in PROGRESS.md.
5. If "Notes for next session" has content: repeat the notes back to the builder, treat them as this session's priorities, then clear the section.
6. If this is session 1, run First Session Setup below before any build work.

Save point — after completing any module, feature, fix, or schema change:
1. Update PROGRESS.md: current state, remaining work, build decisions, known issues.
2. If the database was touched (any table, policy, bucket, or auth change), update docs/supabase-setup.md in the same save point.
3. Commit and push to main.
4. Tell the builder in one line: "Save point committed: [what changed]."
Do not start the next piece of work before the save point is pushed. Never end a session without one — an ending session is a save point.

First Session Setup (session 1 only):
1. Create docs/ and move product-spec.md into it.
2. Announce what moved, then commit and push before building anything.

PROGRESS.md structure (for the recreate rule): status header (Session / Last updated / Live URL), Current state, Last session (3–5 lines, replace each session), Remaining work (shrinking checklist), Build decisions (one line each), Known issues, Notes for next session.

## Commands
```
npm install
npm run dev
npm run build
```

## Tech Stack
React · Vite · Tailwind CSS · Netlify · Supabase
Deployment: GitHub → Netlify, auto-deploys from main. Netlify MCP status is unconfirmed — if not active, the builder connects the repo and enters environment variables in the Netlify dashboard; remind them before the first deploy.

## Environment Variables
VITE_SUPABASE_URL — Supabase: Project Settings → API → Project URL — Netlify env var
VITE_SUPABASE_ANON_KEY — Supabase: Project Settings → API → anon / public key — Netlify env var

Key storage follows function placement: this tool has no server functions — both variables above are browser-exposed (VITE_ prefix) and read directly by the frontend. No value ever appears in code or in any file committed to GitHub.

## Supabase
Project: "greenfriend-dma" — does not exist yet. At the start of session 1, confirm this name with the builder, then create the project via Supabase MCP before building anything. Region: nearest to users (no GDPR trigger on this tool — see Hard Rules). Plan: Pro — required before real client use; the upgrade is a manual billing step in the Supabase dashboard, flag until done.

Build this schema — authoritative until docs/supabase-setup.md exists:
assessments: id, name, description, mode (text: 'quantitative'|'qualitative'), perspective_filter (text: 'full'|'impact'|'financial'), status, start_date, end_date, slug, logo_url, welcome_text, task_text, mandatory (bool), created_at
iros: id, assessment_id (FK → assessments), esrs_topic_id, subtopic_raw, name, description, iro_type (text: 'neg_impact'|'pos_impact'|'risk'|'opportunity'), actual (bool), impact_threshold, financial_threshold, order, created_at
ratings: id, assessment_id (FK → assessments), iro_id (FK → iros), criterion_key (text: 'scale'|'scope'|'irreversibility'|'likelihood'|'magnitude'|'financialLikelihood'), value (int, nullable — null means skipped), stakeholder_group, session_id, submitted_at

Note: `assessments` and `iros` are written by the Consultant Console (Tool B) — this tool only reads them. This tool owns writes to `ratings`.

RLS — build these policies, never skip:
assessments: anon can select the single row matching the assessment being viewed (by slug), no insert/update/delete.
iros: anon can select rows where assessment_id matches the assessment being viewed, no insert/update/delete.
ratings: anon can insert rows scoped to the assessment being viewed, no select/update/delete from this side.

After setup, write docs/supabase-setup.md and update it at every save point that touches the database. It must contain: project name, project ID, project URL, plan, every table with field names and types, RLS policies per table, notes for future sessions, and a last-updated line with date and session number. From the moment it exists, that file is the schema source of truth.

## Hard Rules
- API keys never in any frontend file or GitHub commit. This tool only uses the browser-safe anon key.
- Netlify Identity: never. Supabase Auth is the only authentication system in this stack (not used directly by this tool, but the rule holds across the stack).
- RLS: never disabled on any table. If a query fails, fix the policy or the query — never disable RLS to work around it.
- This tool shares a Supabase project with Apus DMA — Consultant Console. Protected tables — assessor_ratings, calibrations, participants, stakeholder_options — must not be modified by this tool: no schema changes, no RLS changes, no writes. Read stakeholder_options only, as documented in docs/supabase-setup.md, to render the Stakeholder Group screen.
- Port `reference-prototype/src/components/ParticipantExperience.jsx` and `reference-prototype/src/components/ApusLogoLight.jsx` faithfully — that code is authoritative for layout, copy, spacing, colour, and interaction detail. Do not redesign from prose.

## Project Structure
```
/                     ← root: CLAUDE.md, PROGRESS.md only
/src
  /components
  /lib                ← Supabase client, utilities
/docs                 ← product-spec.md, supabase-setup.md
/reference-prototype  ← working prototype source — authoritative for UI/UX
/public/assets
```

## Brand
No brand skill yet. These inline rules apply until one is added to the repo:
- Background: #FAFAF8 (off-white) · Cards: #FFFFFF with a soft shadow and #EFEFEC border
- Primary text: #111318 · Secondary text: #5B5B66 / #6B6B76 / #8A8A94
- Accent: #1F9A63 (primary buttons, selected states, progress bar)
- Font: Inter (body), Jost (wordmark only)
- Rounded corners: 24px on cards, 16px on buttons/inputs. Soft shadows only, no hard borders except the 1px #EFEFEC card border.
- Logo: the Apus swift icon, dark-on-light variant, centered at the top of every screen.

## Business Rules
- One topic per page; every applicable criterion for that IRO's type is shown stacked on the same page (neg_impact: 4 criteria; pos_impact: 3; risk/opportunity: 2 each).
- Each criterion can be answered (0–5) or explicitly skipped — skipping is reversible ("Answer instead"). A skipped criterion is stored as `value = null`, never omitted as a row.
- "Next topic" stays disabled while `assessments.mandatory = true` and any criterion on the page is neither answered nor skipped.
- Stakeholder Group is a single-select, required before the first topic page.
- On Submit, write one `ratings` row per (topic × criterion) shown, tagged with the session's chosen `stakeholder_group` and a client-generated `session_id`.
- No calculation of any kind happens in this tool — severity, scores, and materiality are Tool B's job, reading this tool's `ratings` rows.

Out of scope — do not build:
- Emailed distribution of the link (link is copy/pasted manually by the consultant, in Tool B)
- PDF/CSV export of raw responses
- Multi-language support
- Autosave of in-progress answers before Submit

## Reference Docs
Read before building the related part:
- docs/product-spec.md — full module specs, UI sections, logic, arm detail
- docs/supabase-setup.md — schema source of truth (created in session 1)
- reference-prototype/ — working prototype source, authoritative for UI/UX (see its README.md)
PROGRESS.md in the root is read at every session start per the Session Protocol.
