# PROGRESS — Apus DMA — Participant Questionnaire

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 3
**Last updated:** 2026-09-17 — by Claude Code, correcting stale status
**Live URL:** not yet confirmed — no Netlify site URL recorded; builder to confirm after connecting the repo in the Netlify dashboard

## Current state
Core participant flow is built and working, against real Supabase data — this
was NOT reflected in the previous version of this file, which incorrectly
read "Session 0 — build not started" after the Project Governor regenerated
CLAUDE.md for the v1.1 spec revision without reconciling this file against
the code that already existed. Corrected here.

Built:
- All 6 screens wired end-to-end in `src/components/ParticipantExperience.jsx`
  + `src/App.jsx`: Welcome → Rating Criteria (task) → Stakeholder Group →
  Topic rating → Submit → Thank you
- Supabase data layer (`src/lib/supabaseClient.js`, `src/lib/data.js`):
  reads `assessments`/`iros` by slug, writes `ratings` on submit
- Supabase project provisioned (existing project reused, not a new
  `greenfriend-dma` project — see Build decisions): `assessments`, `iros`,
  `ratings` tables + RLS policies live, documented in `docs/supabase-setup.md`
- Netlify build config present (`netlify.toml`); a deploy-blocking bug
  (repo-root/env-var guard) was already fixed in a prior session
- `npm install` / `npm run build` / `npm run dev` all verified working this
  session — build succeeds, dev server serves HTTP 200

Not yet built (v1.1 spec revisions — still open):
- `session_comments` table + its RLS policy do not exist in Supabase at all
- No "Any other comments?" field on the Submit screen — not present in
  `ParticipantExperience.jsx`
- Logo hierarchy only partly flipped: the Welcome screen correctly shows the
  client logo prominently (`ParticipantExperience.jsx` `Welcome` component),
  but `App.jsx`'s loading/config-error/not-found screens still show
  `ApusLogoLight` as the prominent mark instead of a small bottom "Hosted on"
  credit

## Last session
This session: ran `npm install`/`build`/`dev` to verify the existing build is
healthy (it is), then audited the actual repo state against this file and
found the "Session 0" status was stale — real build work happened across two
earlier sessions (2026-09-10 frontend + Supabase wiring, 2026-09-11 Netlify
deploy fix) that this file never recorded. Corrected the status; no feature
code changed this session.

## Remaining work
- [x] First Session Setup: docs/ present, product-spec.md in place
- [ ] Builder: upgrade the Supabase project to Pro in the dashboard (manual
      billing step) before real client use — still Free per
      docs/supabase-setup.md
- [x] Supabase project created (existing project reused per builder
      instruction, not a new `greenfriend-dma` project — see Build decisions)
- [x] Build `assessments`, `iros`, `ratings` tables and RLS policies; wrote
      docs/supabase-setup.md
- [x] Build Welcome — logo/name, welcome text
- [x] Build Rating Criteria (task) screen
- [x] Build Stakeholder Group — single-select
- [x] Build Topic rating — one topic per page, criteria stacked, per-criterion
      skip, progress bar, back navigation
- [x] Build Submit — final confirmation before writing ratings
- [x] Build Thank you — closing screen
- [ ] Local test pass — full walkthrough of every view before deploying (only
      build/dev-server smoke test done so far, not a full click-through)
- [ ] Acceptance criteria pass — verify every criterion in spec Section
      "Acceptance Criteria" before deploy
- [ ] Deploy to Netlify — no live URL confirmed yet; builder to connect repo
      and set env vars in the Netlify dashboard
- [ ] Build the `session_comments` table and its RLS policy (v1.1 revision)
- [ ] Finish logo hierarchy: demote `ApusLogoLight` to a small "Hosted on"
      credit at the bottom of `App.jsx`'s loading/config-error/not-found
      screens too, not just the Welcome screen (v1.1 revision)
- [ ] Submit screen: add the optional "Any other comments?" free-text field
      above the Submit button, writing to `session_comments` on submit
      (v1.1 revision)

## Build decisions
- Reused an existing Supabase project (`greenfriend Double Materiality
  Assessment`, ID `evwmxduudcujtibirmga`) rather than creating a new
  `greenfriend-dma` project, per the builder's instruction in an earlier
  session — see docs/supabase-setup.md.
- `ratings` stores one row per (topic × criterion) with `value` nullable for
  skipped criteria, matching the spec's storage rule.

## Known issues
- Netlify site not yet connected — no live URL to record.
- Supabase project still on the Free plan — must be upgraded to Pro before
  real client use (flagged in CLAUDE.md).
- The prototype's `ratings` shape vs. Tool B's `assessor_ratings` table
  reconciliation (product-spec.md Section 15, Open Questions) — status
  unconfirmed this session, re-check before finalizing schema further.
- This file was out of sync with the actual repo state (read "Session 0")
  until this session's correction — if anything else in here looks stale
  against the code, trust the code and fix this file, not the reverse.

## Notes for next session
Priority: close the three open v1.1 items — `session_comments` table + RLS
policy, the Submit-screen comments field wired to it, and finishing the logo
hierarchy swap on `App.jsx`'s non-Welcome screens. Then do the local
click-through test pass and the acceptance-criteria pass before touching
deploy.
