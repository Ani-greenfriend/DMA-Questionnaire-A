# PROGRESS — Apus DMA — Participant Questionnaire

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 2
**Last updated:** 2026-09-11 — by Claude Code
**Live URL:** not yet confirmed — Netlify deploy fix pushed, needs a redeploy to verify

## Current state
Frontend and Supabase backend are both built (see session 1). This session fixed
a broken Netlify deploy: the repo had everything nested one level deeper than it
should be (under a `repo-tool-a/` folder), so Netlify couldn't find `package.json`
at the root it was pointed at — it published nothing, hence Netlify's own generic
"Page not found" 404 on the live URL. The repo has been flattened to match the
structure CLAUDE.md always described (root now directly contains this file,
`src/`, `docs/`, etc. — no wrapper folder), and a `netlify.toml` was added so
build command/publish directory don't depend on manual UI configuration. Also
hardened `src/lib/supabaseClient.js` so a missing `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY` shows a clear on-page message instead of a blank page
(the app crashed at module load before this fix).

## Last session
Session 2: builder reported the Netlify deploy wasn't working (build succeeded,
site blank, and separately Netlify's own 404 page on the live URL). Root-caused
to two issues: (1) the whole project lived under `repo-tool-a/` instead of the
repo root, so Netlify's zero-config build couldn't find `package.json` — fixed by
flattening the repo with `git mv`; (2) missing/invalid Supabase env vars crash
`createClient()` synchronously, blanking the whole page with no error shown —
fixed by making `supabaseClient.js` surface a config error as data instead of
throwing, and `App.jsx` renders it as a real on-screen message.

## Remaining work
- [ ] Builder: redeploy on Netlify (trigger a new deploy after this push) and
      confirm the site now loads instead of 404ing
- [ ] Builder: double check `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are
      set in Netlify's Site settings → Environment variables — if they're still
      missing, the site will now show a clear "Survey misconfigured" message
      instead of a blank page, which will confirm/rule this out immediately
- [ ] Once live, verify against the real Supabase connection (this session's
      sandbox still can't reach supabase.co directly — see Known issues)
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
      (1–7 verified against mock data in session 1)

## Build decisions
- Flattened the repo (moved everything out of `repo-tool-a/` to the repo root)
  to match CLAUDE.md's own documented Project Structure exactly, rather than
  papering over the mismatch with a Netlify base-directory setting — this way
  no future Netlify (or any other) config needs special-casing.
- Reused the existing Supabase project ("greenfriend Double Materiality
  Assessment", id `evwmxduudcujtibirmga`) instead of creating a new one named
  `greenfriend-dma` as the spec proposed — explicit builder instruction in
  session 1. Documented in docs/supabase-setup.md.
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
  direct load/refresh once deployed; `netlify.toml` pins build command/publish
  directory explicitly.
- Dropped `papaparse` from dependencies (present in the reference prototype's
  package.json for Tool B's CSV import) since Tool A never imports CSV.

## Known issues
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
Confirm the Netlify redeploy actually loads the site (not the 404 page and not a
"Survey misconfigured" message), then do a real end-to-end pass against the live
Supabase project. Then confirm all of Section 13's acceptance criteria, including
8 (Supabase writes) and 9 (Netlify URL reachable).
