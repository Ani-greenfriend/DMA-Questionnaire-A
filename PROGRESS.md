# PROGRESS — Apus DMA — Expert Survey

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 5
**Last updated:** 2026-09-20 — v2.0 database migration + frontend rework both complete, not yet deployed
**Live URL:** production is `questionnaire-dma.netlify.app`, deploying from
`main`. Still on the pre-session-5 commit (v1.1 frontend code) — this
session's work lives on `claude/amazing-clarke-fxrzeo` and has not been
merged/deployed yet. Production is broken in the meantime (queries a schema
this session retired); no real experts have been invited (GDPR section gates
that on the build being finished), so this is an accepted transitional
state, not a live incident. Deploying this branch's work is the next step.

## Current state
Both the v2.0 shared database migration (product-spec.md Section 5) and the
full frontend rework against the new schema are done — every v2.0 screen is
built. Not yet deployed or click-tested in a live browser (this sandbox
can't reach Supabase directly, see Known issues) and no acceptance-criteria
pass has been run yet.

Done this session:
- Session Protocol run: pulled `main` (already current), confirmed
  `docs/product-spec.md` is at v2.0 matching CLAUDE.md's governed version,
  read this file, incremented to session 5
- Took a full manual export of the pre-migration database (schema, RLS
  policies, function definitions, all row data) to
  `docs/backups/pre-v2.0-migration-2026-09-20.md` — confirmed by inspection
  that all pre-existing data was demo/test only (no real expert responses)
- Ran the whole shared migration via Supabase MCP (9 migrations — see
  `docs/supabase-setup.md`'s "Migrations applied this session" for the full
  list and what each one did): retired v1.1 objects, created every new
  table from the shared migration's list, altered every changed table, built
  the full anon + authenticated RLS matrix, fixed a security-linter-flagged
  view, re-seeded the `acme-2026` demo assessment, then added the frontend
  support the rework below needed (a wider anon column grant on `cycles`,
  a uniqueness constraint for draft upserts, and an atomic
  `submit_survey_response` RPC — which had one bug, found and fixed the same
  session: see Build decisions)
- Rewrote `docs/supabase-setup.md` end to end for the new schema, full RLS
  matrix, retired objects, and functions added
- Verified with `list_tables` (RLS enabled on all 18 public tables) and
  `get_advisors` (security: clean except the pre-existing, unrelated
  "leaked password protection disabled" Auth warning)
- Rebuilt the entire frontend against the new schema:
  - `src/lib/data.js` — rewritten from scratch: narrow invitation lookup by
    link code, `fetchSurveyContext` (assessment + client + cycle + IROs +
    stakeholder groups), `isSurveyClosed`, draft fetch/create/save, and
    `submitFinal` (calls the atomic RPC)
  - `src/lib/criteria.js` — new: the Section 9 criteria-display rules
    (which criteria a topic shows, based on IRO type/actual/human-rights
    flag) and the anchor label arrays. Deliberately does **not** import the
    old `src/lib/calc.js` (Tool B's scoring/materiality functions) — Tool A
    never calculates, so that file was deleted from `src/` (it stays
    findable in `reference-prototype/`, which this session didn't touch)
  - `src/components/ExpertSurvey.jsx` — new, replaces
    `ParticipantExperience.jsx` (deleted): every v2.0 screen — Welcome
    (consent + data statement), About you (expertise multi-select, group
    grids incl. silent stakeholders, basis-for-representation), Rating
    Criteria explainer, Topic rating (per-criterion or per-topic
    justification per `justification_mode`, Save-and-continue-later on every
    page), the Save-and-continue confirmation screen, Submit, Thank you
  - `src/App.jsx` — rewritten: parses `/survey/:slug/:linkCode`, looks up
    the invitation, branches to invalid-link / already-submitted / closed /
    the live survey
  - `src/lib/topics.js` — added `EXPERTISE_OPTIONS` (E1–G1 + Other)
  - `npm run build` and `npm run lint` both clean (lint's only warnings are
    pre-existing ones in `reference-prototype/`, untouched this session)

## Last session
Session 5 (this one): ran the full v2.0 shared migration, then rebuilt the
entire frontend against it — see Current state above for the full list.

Previous session (4): extended the participant flow with a one-submission-
per-browser guard and a respondent counter RPC — **both retired by this
session's migration and removed from the frontend** (`increment_respondents`
and `assessments.respondents_done`/`respondents_total` no longer exist; the
`localStorage` guard is gone from `App.jsx`, superseded by the real
per-invitation `submitted` status).

## Remaining work

### v2.0 revision — database (session 5, done)
- [x] Add `product-spec-tool-b-consultant-console.md` and `supabase-setup.md`
      to the repo (already present at session start, in `docs/`)
- [x] Connect to the existing Supabase project, inspect the live database via
      MCP and reconcile `docs/supabase-setup.md`
- [x] Take a manual export of existing data
- [x] Run the shared migration per spec Section 5 with RLS on every table;
      retire `session_comments`, `assessor_ratings` + its cron job,
      `increment_respondents` and respondent counters, old `participants` table
- [x] Re-create the `acme-2026` demo assessment and a demo invitation in the
      new structure; update `docs/supabase-setup.md`

### v2.0 revision — frontend (session 5, done)
- [x] Rewrite `src/lib/data.js` against the new schema
- [x] Build Welcome — consent checkbox, Section 7 data statement, three
      fixed bullets, personal-link note
- [x] Build About you
- [x] Update Rating Criteria explainer
- [x] Update Topic rating — per-criterion/per-topic justification, skip,
      Save-and-continue-later
- [x] Build the Save and continue later confirmation screen
- [x] Update Submit — `overall_comment`, all-or-nothing write via RPC
- [x] Build already-submitted, invalid-link and survey-closed screens

### v2.0 revision — verification and deploy (next)
- [ ] Local/preview test pass with the demo personal link
      (`slug = acme-2026`, `link_code = 33168bb608ca541d0a44a623` →
      `/survey/acme-2026/33168bb608ca541d0a44a623`), including save, resume
      and submit — needs a Netlify deploy preview or a browser outside this
      sandbox (see Known issues on the network restriction); nothing beyond
      `npm run build`/`lint` has verified this code actually runs correctly
      in a browser yet
- [ ] Acceptance criteria pass — all 18 criteria in spec v2.0 Section 13
- [ ] Deploy to Netlify via MCP; confirm env vars still point at the
      publishable key (unchanged this session)
- [ ] Merge this branch to `main` once the above is confirmed working
- [ ] Builder, before inviting any real expert: short GDPR check (legal
      basis, anonymise-on-request approach) — flagged, not blocking

## Build decisions
- Reused an existing Supabase project (`greenfriend Double Materiality
  Assessment`, ID `evwmxduudcujtibirmga`) rather than creating a new
  `greenfriend-dma` project, per the builder's instruction in an earlier
  session — see docs/supabase-setup.md.
- `ratings.criterion_key` check constraint is 5 values (`scale`, `scope`,
  `irreversibility`, `likelihood`, `magnitude`) — dropped the v1.1
  `financialLikelihood` key. CLAUDE.md's Business Rules ("risk or
  opportunity = magnitude, likelihood") and product-spec.md Section 9 both
  confirm `likelihood` is reused for risk/opportunity rather than a separate
  key; product-spec.md Section 5's field-description row still lists
  `financialLikelihood` as an example value, which reads as a leftover from
  the v1.1 schema this migration replaces, not a v2.0 requirement.
- `assessments`/`iros`/`clients`/`stakeholder_groups` keep the v1.1 pattern of
  unscoped anon `SELECT` (all rows, `using (true)`) — true per-link row-level
  scoping isn't possible for an unauthenticated visitor without a session
  identity, and this content isn't sensitive (survey display copy, topic
  names, client name/logo, stakeholder group names). `cycles` and
  `invitations` get a stricter treatment (see below) because they hold
  materially more sensitive fields (thresholds/stage/sign-off/approver name;
  name/email) alongside the couple of fields the survey actually needs.
- `cycles` and `invitations`: anon gets a `using (true)` RLS policy but a
  **column-level grant** restricting what that policy can actually expose —
  `cycles` to `(id, esrs_version, stage, client_id)`, `invitations` to
  `(id, assessment_id, link_code, status, submitted_at)` (never `name`/
  `email`). This is the same mechanism Postgres/PostgREST uses together
  (RLS decides *which rows*, column grants decide *which columns*), and it's
  why the migration first tried a `SECURITY DEFINER`-style view for
  `cycles.esrs_version` and then replaced it — the view achieved the same
  narrow exposure but tripped the Supabase security linter's
  `security_definer_view` ERROR; the column-grant approach doesn't.
- `stakeholder_members` anon access from v1.1 was **not** carried forward —
  Tool A's own CLAUDE.md read list never included this table (only
  `stakeholder_groups`), and the table holds named contacts with emails.
  Treated as a v1.1 leftover exposure, not a deliberate design the migration
  needed to preserve.
- The old demo assessment's `iros`/`ratings` (v1.1-shaped: bare `session_id`,
  no `submission_id`/`justification`) were deleted rather than migrated in
  place, per product-spec.md Section 5's explicit instruction ("no real data
  ... re-create the demo assessment in the new structure"). `topic_library`
  and `stakeholder_groups`/`stakeholder_members`, which the spec marks
  "Changed" rather than "New", were altered in place and kept.
- Demo IROs: snapshotted all 10 current `topic_library` rows into the new
  `acme-2026` assessment (a deliberately broader set than the old demo's 5 —
  covers `neg_impact`/`pos_impact`/`risk`/`opportunity` across six ESRS
  topics) so the frontend has good coverage of the Section 9 criteria
  display rules to test against.
- Submit is one Postgres function (`submit_survey_response`, `SECURITY
  INVOKER`) rather than several client-side writes, so it's genuinely
  atomic — matches "written as one complete, all-or-nothing submission ...
  or nothing at all." First version deleted existing draft rows before
  re-inserting; since anon has no DELETE policy on `ratings`/
  `topic_justifications` (correctly, per spec — never for anon) and the
  function runs as the caller (not `SECURITY DEFINER`), that delete
  silently affected 0 rows under RLS and the re-insert then hit the new
  `(submission_id, iro_id, criterion_key)` uniqueness constraint. Fixed by
  switching to `ON CONFLICT ... DO UPDATE` — no delete anywhere, works with
  the INSERT/UPDATE policies that already existed. Caught and fixed in
  review before any deploy, not by a failed test run.
- Draft progress saves (`saveProgress` in `data.js`, called on every "Next
  topic"/"Previous topic"/"Save and continue later") are plain best-effort
  upserts, not wrapped in the atomic RPC — only the final Submit needs the
  all-or-nothing guarantee (drafts never count in results, so a partially-
  saved draft is harmless).
- Welcome re-shows the consent checkbox and requires re-ticking on every
  visit, including resuming a saved draft, per the spec's literal wording
  ("Get started →" disabled until ticked; a returning visitor just sees a
  different button label). `submissions.consent_given_at` is only written
  once, at draft creation — it records when consent was first given, not
  re-updated on every resume.
- URL shape for the personal link: `/survey/:slug/:linkCode` — resolved as
  an explicitly non-blocking open question in product-spec.md Section 15
  ("Builder + Claude Code, at build time"). The slug is cosmetic/readability
  only; every actual lookup is by `linkCode`, which alone is the unguessable
  key (matches CLAUDE.md: no anon access is ever gated on the slug).
- The "About you" group grids are populated by filtering
  `stakeholder_groups` on `type IN ('impact','silent')` and `type =
  'financial'` — this happens to reproduce exactly the two default option
  lists in product-spec.md Section 8 (6 impact-type groups, 5 financial-type
  groups, from the v1.1 stakeholder map backfilled with `type` this
  session), plus the 3 new silent presets in the impact grid.

## Known issues
- **Not yet deployed or click-tested.** `npm run build`/`lint` are clean and
  the code was reviewed carefully against the spec, but no one has clicked
  through the actual survey in a browser yet. This sandbox cannot reach
  `*.supabase.co` directly — outbound HTTPS to it is blocked by the
  environment's proxy policy (confirmed via verbose curl: `CONNECT tunnel
  failed, response 403`; same restriction noted in sessions 3/4 for the v1.1
  flow). Schema/RLS work was verified via Supabase MCP (`execute_sql`,
  `list_tables`, `get_advisors`), which runs server-side rather than through
  this sandbox's network — that doesn't cover frontend runtime behavior. A
  real click-through (Welcome → About you → topics → save/resume → Submit)
  still needs a Netlify deploy preview or a browser outside this sandbox.
- **Frontend/database mismatch on production, until this branch deploys:**
  `main`'s deployed frontend is still v1.1 code querying the schema this
  session retired. No real expert data exists yet and CLAUDE.md gates real
  invitations on the build being finished, so this remains an accepted
  transitional state, not an incident to roll back from.
- Supabase project still on the Free plan — builder's accepted risk (personal
  and resume links break while the project auto-pauses after ~1 week without
  traffic). Not a blocker; revisit before real client use.
- Before inviting any real expert, the builder gets a short GDPR check
  (business reason: audit traceability; anonymise-on-request approach). Does
  not block the build.

## Notes for next session
Get a real click-through: push this branch, open a Netlify deploy preview,
and walk the demo link end to end
(`/survey/acme-2026/33168bb608ca541d0a44a623`) — Welcome (consent), About
you, Rating Criteria, every topic (answer some, skip some, check the
per-criterion vs per-topic justification gating — the demo assessment's
`justification_mode` is `per_criterion`, so also spot-check the per-topic
path by flipping one assessment's `justification_mode` in Supabase and
retesting), Save-and-continue-later (copy the link, reopen it, confirm
resume lands on the right topic with earlier answers restored), Submit
(check the atomic RPC actually commits everything), Thank you, then reopen
the same link and confirm "already submitted" shows. Also test an invalid
link and (by flipping the demo cycle's `stage` to `signed_off` temporarily)
the closed-survey screen. Then run the full Section 13 acceptance criteria
list, fix anything that surfaces, and deploy via Netlify MCP.
