# PROGRESS — Apus DMA — Participant Questionnaire

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 3
**Last updated:** 2026-09-17 — by Claude Code, closed out v1.1 revisions
**Live URL:** not yet confirmed — no Netlify site URL recorded; builder to confirm after connecting the repo in the Netlify dashboard

## Current state
Core participant flow is built and working against real Supabase data, and
all three v1.1 spec revisions are now implemented.

Built:
- All 6 screens wired end-to-end in `src/components/ParticipantExperience.jsx`
  + `src/App.jsx`: Welcome → Rating Criteria (task) → Stakeholder Group →
  Topic rating → Submit → Thank you
- `ParticipantExperience.jsx` re-ported from `reference-prototype/` to match
  it exactly (it had drifted): client logo (or a dashed-border placeholder)
  is now the persistent header across every screen, and `ApusLogoLight` is
  a small "Hosted on" credit at the page bottom only — no header placement
  anywhere in the participant flow
- Submit screen has the optional "Any other comments?" textarea from the
  reference prototype, above the Submit button
- One deliberate deviation from the reference file: its `Submit` no longer
  passed the chosen `stakeholder` into `onSubmit(...)` — that would have
  broken the mandatory `stakeholder_group` tagging on `ratings` rows (a hard
  CLAUDE.md business rule, and the column is NOT NULL in Postgres). Restored
  it: `onSubmit(answers, relevantIros, stakeholder, comment)`. Also restored
  the `export` on `CRITERIA_FOR`, which `App.jsx` needs and the reference
  file (a different app) doesn't export. No layout/copy/style changed.
- `App.jsx`'s loading/config-error/not-found screens (states before an
  assessment loads, so no client logo is available yet) no longer show
  `ApusLogoLight` prominently — config-error and not-found now show the
  same small "Hosted on" footer credit instead; loading stays logo-free
- `session_comments` table + `anon insert` RLS policy created in Supabase
  (migration `create_session_comments`); `src/lib/data.js` gained
  `submitSessionComment`, and `App.jsx.handleSubmit` writes a row there
  when the comment field was filled in
- Supabase data layer (`src/lib/supabaseClient.js`, `src/lib/data.js`):
  reads `assessments`/`iros` by slug, writes `ratings` + `session_comments`
  on submit
- Supabase project provisioned (existing project reused, not a new
  `greenfriend-dma` project — see Build decisions): `assessments`, `iros`,
  `ratings`, `session_comments` tables + RLS policies live, documented in
  `docs/supabase-setup.md`
- Netlify build config present (`netlify.toml`); a deploy-blocking bug
  (repo-root/env-var guard) was already fixed in a prior session
- `npm install` / `npm run build` / `npm run lint` / `npm run dev` all
  verified working this session — build succeeds, dev server serves HTTP 200
  on the demo assessment route

## Last session
Corrected this file's stale "Session 0" status (two real sessions of build
work predated it and had gone unrecorded), then closed the three open v1.1
items: created the `session_comments` table + RLS policy in Supabase,
re-ported `ParticipantExperience.jsx` from the reference prototype (which
fixed both the logo hierarchy and added the comments field in one move,
since the reference already had both correct), and wired `App.jsx`/`data.js`
around it — including fixing a `stakeholder`-dropping regression in the
reference file's own `Submit` wiring, and fixing the same prominent-Apus-logo
issue on `App.jsx`'s own error screens. Subscribed to PR #3 for CI/review
follow-up. Build, lint, and dev-server smoke tests all pass; no full
click-through test yet.

## Remaining work
- [x] First Session Setup: docs/ present, product-spec.md in place
- [ ] Builder: upgrade the Supabase project to Pro in the dashboard (manual
      billing step) before real client use — still Free per
      docs/supabase-setup.md
- [x] Supabase project created (existing project reused per builder
      instruction, not a new `greenfriend-dma` project — see Build decisions)
- [x] Build `assessments`, `iros`, `ratings`, `session_comments` tables and
      RLS policies; docs/supabase-setup.md updated
- [x] Build Welcome — logo/name, welcome text
- [x] Build Rating Criteria (task) screen
- [x] Build Stakeholder Group — single-select
- [x] Build Topic rating — one topic per page, criteria stacked, per-criterion
      skip, progress bar, back navigation
- [x] Build Submit — final confirmation, optional comments field, before
      writing ratings + session_comments
- [x] Build Thank you — closing screen
- [x] Build the `session_comments` table and its RLS policy (v1.1 revision)
- [x] Logo hierarchy: client logo (or placeholder) prominent on every
      screen, `ApusLogoLight` demoted to a small bottom "Hosted on" credit
      everywhere, including `App.jsx`'s pre-load/error screens (v1.1 revision)
- [x] Submit screen: optional "Any other comments?" field wired to
      `session_comments` (v1.1 revision)
- [ ] Local test pass — full click-through of every screen (welcome through
      thank-you, including skip/answer toggling and the comment field)
      against the `acme-2026` demo assessment before deploying
- [ ] Acceptance criteria pass — verify every criterion in spec Section
      "Acceptance Criteria" before deploy
- [ ] Deploy to Netlify — no live URL confirmed yet; builder to connect repo
      and set env vars in the Netlify dashboard

## Build decisions
- Reused an existing Supabase project (`greenfriend Double Materiality
  Assessment`, ID `evwmxduudcujtibirmga`) rather than creating a new
  `greenfriend-dma` project, per the builder's instruction in an earlier
  session — see docs/supabase-setup.md.
- `ratings` stores one row per (topic × criterion) with `value` nullable for
  skipped criteria, matching the spec's storage rule.
- `session_comments.comment` is `not null` — the app only inserts a row when
  the field was filled in, rather than always inserting (possibly empty).
- When re-porting `ParticipantExperience.jsx` from the reference prototype,
  kept two data-wiring fixes on top of an otherwise byte-identical copy (see
  Current state above) rather than porting its `Submit`/`CRITERIA_FOR`
  behavior verbatim — those were data-model bugs in the reference file, not
  UI/UX choices, so CLAUDE.md's "port faithfully, don't redesign from prose"
  rule doesn't cover them.

## Known issues
- Netlify site not yet connected — no live URL to record.
- Supabase project still on the Free plan — must be upgraded to Pro before
  real client use (flagged in CLAUDE.md).
- The prototype's `ratings` shape vs. Tool B's `assessor_ratings` table
  reconciliation (product-spec.md Section 15, Open Questions) — status
  unconfirmed this session, re-check before finalizing schema further.
- No full click-through test yet — only build/lint/dev-server smoke tests.
  Do this before the acceptance-criteria pass.

## Notes for next session
Priority: do the local click-through test pass (all 6 screens, skip/answer
toggling, mandatory-gating behavior, the comments field, both with and
without a client logo set) against the `acme-2026` demo assessment, then the
acceptance-criteria pass from product-spec.md. After that, deploy to
Netlify — confirm Netlify MCP status with the builder first; if inactive,
remind them to connect the repo and set `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY` in the Netlify dashboard.
