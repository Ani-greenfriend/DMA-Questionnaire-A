# PROGRESS — Apus DMA — Participant Questionnaire

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 4
**Last updated:** 2026-09-20 — by Project Governor, spec revised to v2.0 (session state below preserved; no v2.0 code built yet)
**Live URL:** production is `questionnaire-dma.netlify.app`, deploying from `main`. PR #4 merged since the last update (confirmed via `git log` — `main` is current, includes all v1.1 work).

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
Session 4: this tool's participant flow was extended from Tool B's own build
session (Consultant Console), since respondent counting genuinely spans both
tools. Added: a one-submission-per-browser guard (`localStorage` flag,
`hasAlreadySubmitted`/`markSubmitted` in `App.jsx` — shows a "you've already
submitted" screen instead of the form on a repeat visit) and
`incrementRespondents()` in `src/lib/data.js`, which calls a new
`increment_respondents` Postgres RPC (Tool B created it — narrow
`SECURITY DEFINER`, only ever increments `assessments.respondents_done`,
grantable to `anon` without opening a general write on the table). Called
right after a successful submit in `handleSubmit`. `npm run build` verified
clean. Documented in `docs/supabase-setup.md`. Not yet click-tested in a real
browser (same sandbox network restriction as session 3 — see Known issues).

Previous session (3): corrected this file's stale "Session 0" status (two real sessions of build
work predated it and had gone unrecorded), then closed the three open v1.1
items: created the `session_comments` table + RLS policy in Supabase,
re-ported `ParticipantExperience.jsx` from the reference prototype (which
fixed both the logo hierarchy and added the comments field in one move,
since the reference already had both correct), and wired `App.jsx`/`data.js`
around it — including fixing a `stakeholder`-dropping regression in the
reference file's own `Submit` wiring, and fixing the same prominent-Apus-logo
issue on `App.jsx`'s own error screens. PR #3 merged mid-session (docs-only
correction); opened PR #4 for the v1.1 work and subscribed to it.

Then spent most of the session debugging why PR #4's Netlify deploy preview
wouldn't load `acme-2026` at all — see the Known issues incident note. Root
cause: the legacy anon JWT in Netlify's `VITE_SUPABASE_ANON_KEY` had a
corrupted (non-ISO-8859-1) character from a copy/paste chain, which made
`supabase-js` throw when setting the `apikey` HTTP header. Fixed by
switching to Supabase's newer plain-ASCII publishable key. Along the way,
added better error diagnostics to `supabaseClient.js`/`data.js` (worth
keeping) and discovered Netlify only re-reads env vars on a fresh
"Clear cache and deploy site," not a plain retry. The PR #4 deploy preview
is now confirmed loading real data from Supabase. Still no full manual
click-through of the 6-screen flow.

## Remaining work
- [ ] *(superseded by v2.0 revision — the localStorage guard and respondent counter are retired)* Click-test the one-submission-per-browser guard and respondent count
      in a real browser: submit once, confirm the "already submitted" screen
      appears on a second visit from the same browser, and confirm
      `assessments.respondents_done` actually increments (Tool B's dashboard
      can show this once its own wizard writes real assessments)
- [x] First Session Setup: docs/ present, product-spec.md in place
- [ ] Builder: upgrade the Supabase project to Pro in the dashboard (manual
      billing step) before real client use — still Free per
      docs/supabase-setup.md
      *(superseded 2026-09-20 — builder decided to stay on Free; accepted risk, see Known issues)*
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
- [x] Netlify connected and deploying from GitHub (`questionnaire-dma.netlify.app`)
      — was already done in an earlier session, just unconfirmed until now
- [x] Env vars correctly set in Netlify (`VITE_SUPABASE_URL` +
      `VITE_SUPABASE_ANON_KEY` using the publishable key) — PR #4's deploy
      preview confirmed loading live `acme-2026` data from Supabase
- [ ] Local test pass — full click-through of every screen (welcome through
      thank-you, including skip/answer toggling and the comment field)
      against the `acme-2026` demo assessment — only confirmed it loads and
      reaches Welcome so far, not a full walkthrough
      *(v1.1 screens — superseded by the v2.0 acceptance pass below)*
- [ ] Acceptance criteria pass — verify every criterion in spec Section
      "Acceptance Criteria" before calling this tool done
      *(now the 18 criteria of spec v2.0 — see the v2.0 items below)*
- [ ] Merge PR #4, which will deploy the v1.1 work + these fixes to
      production (`questionnaire-dma.netlify.app` is still on the pre-PR-4
      commit)
      *(the header says PR #4 is merged — verify with `git log` and tick)*

### v2.0 revision items (spec v2.0, 2026-09-20)
- [ ] (v2.0 revision) Builder: add `product-spec-tool-b-consultant-console.md` and the newer `supabase-setup.md` (Tool B's copy) to the repo before starting
- [ ] (v2.0 revision) Connect to the existing Supabase project, inspect the live database via MCP and reconcile docs/supabase-setup.md
- [ ] (v2.0 revision) Take a manual export of existing data (Free plan has no automatic backups)
- [ ] (v2.0 revision) Run the shared migration per spec Section 5 with RLS on every table; retire session_comments, assessor_ratings + its pg_cron job, increment_respondents and respondent counters, old participants table
- [ ] (v2.0 revision) Re-create the `acme-2026` demo assessment and a demo invitation in the new structure; update docs/supabase-setup.md
- [ ] (v2.0 revision) Rework the data layer: link-code lookup, draft save and resume, all-or-nothing submit; remove the localStorage guard and `incrementRespondents`
- [ ] (v2.0 revision) Build Welcome with consent checkbox, data statement (contact anikalerch@greenfriend.org) and resume-link note; drop "fully anonymous"
- [ ] (v2.0 revision) Build About you — expertise E1–G1, explanation, optional title, group and perspective, silent stakeholder groups; replaces the Stakeholder Group screen
- [ ] (v2.0 revision) Update Rating Criteria and Topic rating — criteria per IRO type, justification per criterion or per topic, Save and continue later on every page
- [ ] (v2.0 revision) Build the Save and continue later confirmation screen with copyable personal link
- [ ] (v2.0 revision) Update Submit — overall comment into the submission; all-or-nothing write
- [ ] (v2.0 revision) Build the already-submitted, invalid-link and survey-closed screens
- [ ] (v2.0 revision) Local test pass with a demo personal link, including save, resume and submit
- [ ] (v2.0 revision) Acceptance criteria pass — all 18 criteria in spec v2.0 Section 13
- [ ] (v2.0 revision) Builder, before inviting any real expert: short GDPR check (legal basis, anonymise-on-request approach)
- [ ] (v2.0 revision) Deploy to Netlify via MCP and set environment variables

## Build decisions
- Reused an existing Supabase project (`greenfriend Double Materiality
  Assessment`, ID `evwmxduudcujtibirmga`) rather than creating a new
  `greenfriend-dma` project, per the builder's instruction in an earlier
  session — see docs/supabase-setup.md.
- `ratings` stores one row per (topic × criterion) with `value` nullable for
  skipped criteria, matching the spec's storage rule.
- `session_comments.comment` is `not null` — the app only inserts a row when
  the field was filled in, rather than always inserting (possibly empty).
- Respondent counting: a narrow SECURITY DEFINER RPC
  (`increment_respondents`) rather than an anon UPDATE policy on
  `assessments` — keeps every other column on that row unreachable from the
  public survey. Dedup is a client-side `localStorage` flag, not an IP check
  — simpler, no personal data stored, matches typical lightweight survey
  tools; a courtesy, not a hard security boundary.
- When re-porting `ParticipantExperience.jsx` from the reference prototype,
  kept two data-wiring fixes on top of an otherwise byte-identical copy (see
  Current state above) rather than porting its `Submit`/`CRITERIA_FOR`
  behavior verbatim — those were data-model bugs in the reference file, not
  UI/UX choices, so CLAUDE.md's "port faithfully, don't redesign from prose"
  rule doesn't cover them.

## Known issues
- **Incident, resolved this session:** Netlify's `VITE_SUPABASE_ANON_KEY` had
  a corrupted character (non-ISO-8859-1) from a copy/paste chain, causing
  `supabase-js` to throw `TypeError: Failed to execute 'set' on 'Headers'`
  on every page load. Fixed by using Supabase's newer publishable key
  (`sb_publishable_...`) instead of the legacy anon JWT — see
  docs/supabase-setup.md's Notes section for the full writeup, including
  the Netlify gotcha that changing an env var does nothing until you
  specifically "Clear cache and deploy site" (a plain retry reuses the old
  value).
- Netlify production (`questionnaire-dma.netlify.app`) is connected and
  auto-deploying from `main`, but is still on the pre-PR-4 commit — merge
  PR #4 to bring it current.
- Supabase project still on the Free plan — must be upgraded to Pro before
  real client use (flagged in CLAUDE.md). Netlify's build-minute credit
  limit was also hit earlier this session (production deploys were being
  skipped) but appears to have reset on its own.
  **Update 2026-09-20:** builder decided to stay on the Free plan — accepted risk: personal and resume links break while the project is paused; open a survey link weekly during a survey window.
- The prototype's `ratings` shape vs. Tool B's `assessor_ratings` table
  reconciliation (product-spec.md Section 15, Open Questions) — status
  unconfirmed this session, re-check before finalizing schema further.
  **Update 2026-09-20:** resolved by spec v2.0 — the combined ratings view replaces `assessor_ratings` and the sync job.
- No full click-through test yet — confirmed the deploy preview loads real
  Supabase data and reaches the Welcome screen, but haven't walked through
  Task → Stakeholder → Questions → Submit → Thank you end-to-end.
- Spec revised to v2.0 on 2026-09-20 — CLAUDE.md regenerated by Project Governor
- docs/supabase-setup.md exists in two copies (Tool A and Tool B repos) that had drifted; the Tool B copy is more current — use it as the base and verify against the live database before migrating
- Before inviting any real expert, the builder gets a short GDPR check (business reason: audit traceability; anonymise-on-request approach). Does not block the build
- Open non-blocking spec questions (spec Section 15): link-to-route design, prototype coverage of the new screens, Welcome time-needed wording

## Notes for next session
PRIORITY (v2.0 revision): spec v2.0 supersedes the plan below. Start with the shared
migration: add the Tool B spec and newer supabase-setup.md to the repo, inspect
the live database, take a manual export, migrate, then build the new screens.
Earlier note (v1.1 plan, now mostly superseded): do the local click-through test pass (all 6 screens, skip/answer
toggling, mandatory-gating behavior, the comments field, both with and
without a client logo set) against the `acme-2026` demo assessment on PR
#4's deploy preview, then the acceptance-criteria pass from product-spec.md.
Then merge PR #4 so production picks up the v1.1 work and the env var fix.
