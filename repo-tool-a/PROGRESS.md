# PROGRESS — Apus DMA — Participant Questionnaire

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 1
**Last updated:** 2026-09-10 — by Claude Code
**Live URL:** none yet — not deployed to Netlify

## Current state
Frontend and Supabase backend are both built. `assessments`, `iros`, and `ratings`
tables exist with RLS in the existing Supabase project (reused per the builder's
instruction — see Build decisions), and `src/lib/data.js` now queries them for
real instead of using mock data. `npm run build` succeeds. The full participant
flow was verified against mock data in a real browser (gating, skip/answer-instead,
back navigation preserving answers, submit) before the Supabase swap; the swap
itself could not be re-verified live in this session because this session's
sandbox cannot reach `*.supabase.co` directly (confirmed via the egress proxy
status — an organization policy block, not a code issue). Needs a real
browser check once deployed, or from the builder's own machine.

## Last session
Session 1: built the whole tool in two passes per the builder's direction
("frontend first, Supabase later"). Pass 1 — scaffolded Vite/React/Tailwind,
ported `ParticipantExperience.jsx`/`ApusLogoLight.jsx` faithfully, mock data
layer, verified full flow in-browser. Pass 2 — built the `assessments`/`iros`/
`ratings` schema + RLS on the existing Supabase project (`evwmxduudcujtibirmga`,
not the spec's proposed `greenfriend-dma` name — builder confirmed reuse), wrote
docs/supabase-setup.md, swapped `src/lib/data.js` to real Supabase queries,
seeded a demo assessment (`slug=acme-2026`) for testing.

## Remaining work
- [ ] Verify the live Supabase connection in a real browser once deployed (this
      session's sandbox can't reach supabase.co directly — see Known issues)
- [ ] Builder: upgrade the Supabase project to Pro in the dashboard before real
      client use
- [ ] Decide whether to keep or delete the seeded demo assessment
      (`slug='acme-2026'`) before real client use
- [ ] When Tool B is built and creates `stakeholder_options`, confirm the
      Stakeholder Group screen picks it up automatically (code already queries
      it with a fallback to defaults — see docs/supabase-setup.md)
- [ ] Mobile-responsive pass (out of scope for v1 per spec Section 12, but worth
      a look — the layout is already fairly narrow/centered)
- [ ] Acceptance criteria 8–9 (Section 13) need a live deploy to fully verify
      (1–7 verified against mock data this session)
- [ ] Deploy to Netlify — connect repo, add `VITE_SUPABASE_URL` /
      `VITE_SUPABASE_ANON_KEY` env vars (Netlify MCP not available in this
      session, so this is a manual step)

## Build decisions
- Reused the existing Supabase project ("greenfriend Double Materiality
  Assessment", id `evwmxduudcujtibirmga`) instead of creating a new one named
  `greenfriend-dma` as the spec proposed — explicit builder instruction this
  session. Documented in docs/supabase-setup.md.
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
- `assessments`/`iros` RLS policies grant `anon` a blanket `select` (`using (true)`)
  rather than a slug-scoped policy, since RLS can't see the app's query filter —
  the app itself always queries by exact `slug`/`assessment_id`, so in practice
  this behaves as "the assessment being viewed," matching the spec's intent, but
  technically anon could enumerate all assessments/IROs by ID. Acceptable for a
  no-login public survey tool with no sensitive data in these tables; flagging in
  case the builder wants a stricter policy later (e.g. only exposing `status =
  'active'` assessments).
- Netlify `_redirects` (`/* /index.html 200`) added so `/survey/:slug` survives a
  direct load/refresh once deployed.
- Dropped `papaparse` from dependencies (present in the reference prototype's
  package.json for Tool B's CSV import) since Tool A never imports CSV.

## Known issues
- Netlify MCP connector is not available in this session — deploy step will need
  the builder to connect the repo and set env vars manually in the Netlify
  dashboard.
- This session's sandbox cannot reach `*.supabase.co` directly (confirmed via
  the egress proxy's status endpoint — `connect_rejected`/403 on every attempt).
  Schema changes went through fine via the Supabase MCP tool (a different path),
  but the frontend's live Supabase calls could not be exercised in a browser
  here. Re-test after deploying, or run `npm run dev` on a machine without this
  restriction.
- The existing Supabase project's name doesn't exactly match the spec's proposed
  `greenfriend-dma` — reused as-is per builder instruction (see Build decisions).
- The prototype's `ratings` shape (one row per criterion, supporting a null
  "skipped" value) still needs to be reconciled against Tool B's
  `assessor_ratings` table per product-spec.md Section 15 — unchanged from
  session 0's note, still open.

## Notes for next session
Deploy to Netlify and do a real end-to-end pass against the live Supabase project
(the sandbox in this session couldn't reach it directly). Then confirm all of
Section 13's acceptance criteria, including 8 (Supabase writes) and 9 (Netlify
URL reachable).
