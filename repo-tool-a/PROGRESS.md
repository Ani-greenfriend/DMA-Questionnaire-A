# PROGRESS — Apus DMA — Participant Questionnaire

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 1
**Last updated:** 2026-09-10 — by Claude Code
**Live URL:** none yet — not deployed to Netlify

## Current state
Frontend is built and working end-to-end against mock, in-memory data (no Supabase
connection yet — deliberately deferred per the builder's request this session).
`npm run build` succeeds; the full participant flow (Welcome → Rating Criteria →
Stakeholder Group → one-topic-per-page rating → Submit → Thank you) was exercised
in a real browser via Playwright and matches the reference prototype pixel-for-pixel.

A Supabase project ("greenfriend Double Materiality Assessment", id
`evwmxduudcujtibirmga`, region eu-west-1) already exists in the linked
organization but has no tables yet — schema/RLS work has not started.

## Last session
Session 1: scaffolded the Vite/React/Tailwind app, ported `ParticipantExperience.jsx`
and `ApusLogoLight.jsx` faithfully from `reference-prototype/`, built a mock data
layer (`src/lib/data.js`) standing in for Supabase, wired slug-based routing
(`/survey/:slug`), and verified the whole flow (gating, skip/answer-instead, back
navigation preserving answers, submit) in a headless browser.

## Remaining work
- [ ] Confirm Supabase project name/org with the builder (existing project is
      named "greenfriend Double Materiality Assessment", not exactly
      `greenfriend-dma` as proposed in the spec — reuse it or rename/recreate?)
- [ ] Build `assessments`, `iros`, `ratings` tables + RLS policies via Supabase MCP
- [ ] Write docs/supabase-setup.md
- [ ] Replace `src/lib/data.js` mock functions with real Supabase queries
      (`fetchAssessmentBySlug`, `submitRatings`) using `@supabase/supabase-js`
      (already added to package.json but not yet used)
- [ ] Add `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` handling (`.env.example`,
      Netlify env vars)
- [ ] Decide how to source Stakeholder Group options: `stakeholder_options` is a
      Tool B–owned table that doesn't exist yet (Tool B not built). Current build
      uses the spec's default option lists as a hardcoded fallback in
      `src/lib/data.js`. When wiring Supabase, attempt to read `stakeholder_options`
      and fall back to these defaults if the table/row doesn't exist.
- [ ] Builder: upgrade the Supabase project to Pro in the dashboard before real
      client use
- [ ] Mobile-responsive pass (out of scope for v1 per spec Section 12, but worth
      a look — the layout is already fairly narrow/centered)
- [ ] Acceptance criteria pass against Section 13 once Supabase is wired up
      (criteria 1–7 already verified against mock data; 8–9 need the real backend
      and a live deploy)
- [ ] Deploy to Netlify — connect repo, add env vars (Netlify MCP not available
      in this session)

## Build decisions
- Route shape: `/survey/:slug` (per the spec's own suggested example in Section 15),
  parsed with a plain regex against `window.location.pathname` — no router
  library added, since this tool only ever renders one route shape.
- `assessments.name` is used as the "company name" shown in the Welcome title
  ("[name] sustainability survey") — the schema has no separate `company_name`
  field, and `name` is the closest match.
- `task_text` (in the CLAUDE.md schema) is not used by the ported
  `ParticipantExperience.jsx` — its Rating Criteria screen copy is hardcoded in
  the reference prototype. Left as-is per "port faithfully, don't redesign from
  prose"; flagging in case `task_text` was meant to feed that screen.
- Added one non-visual change to the ported `ParticipantExperience.jsx`: exported
  `CRITERIA_FOR` (was module-private) and passed the selected `stakeholder` group
  through the existing `onSubmit(answers, relevantIros)` callback as a third
  argument. Both are integration seams only — no layout/copy/interaction changed.
- Netlify `_redirects` (`/* /index.html 200`) added so `/survey/:slug` survives a
  direct load/refresh once deployed.
- Dropped `papaparse` from dependencies (present in the reference prototype's
  package.json for Tool B's CSV import) since Tool A never imports CSV.

## Known issues
- Netlify MCP connector is not available in this session — deploy step will need
  the builder to connect the repo and set env vars manually in the Netlify
  dashboard.
- Supabase connection is intentionally not wired up yet (see Remaining work).
- The existing Supabase project's name doesn't exactly match the spec's proposed
  `greenfriend-dma` — needs a decision before schema work starts.
- The prototype's `ratings` shape (one row per criterion, supporting a null
  "skipped" value) still needs to be reconciled against Tool B's
  `assessor_ratings` table per product-spec.md Section 15 — unchanged from
  session 0's note, still open.

## Notes for next session
Wire up Supabase: confirm/use the existing project, build the `assessments` /
`iros` / `ratings` schema + RLS from CLAUDE.md, write docs/supabase-setup.md,
then swap `src/lib/data.js`'s mock functions for real queries.
