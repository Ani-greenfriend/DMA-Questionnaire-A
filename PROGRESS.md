# PROGRESS — Apus DMA — Expert Survey

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 5
**Last updated:** 2026-09-20 — shared v2.0 database migration complete
**Live URL:** production is `questionnaire-dma.netlify.app`, deploying from
`main`, still running v1.1 frontend code. **That frontend now queries a
schema that no longer exists** (see Known issues) — the production demo page
is expected to be broken until the frontend rework below ships. No real
experts have been invited yet (GDPR section explicitly gates that on this
work being done first), so this is an accepted transitional state, not a
live incident.

## Current state
The v2.0 shared database migration (product-spec.md Section 5) is complete
and verified. The frontend has **not** been reworked yet — that's the
immediate next task, tracked below.

Done this session:
- Session Protocol run: pulled `main` (already current), confirmed
  `docs/product-spec.md` is at v2.0 matching CLAUDE.md's governed version, read
  this file, incremented to session 5
- Took a full manual export of the pre-migration database (schema, RLS
  policies, function definitions, all row data) to
  `docs/backups/pre-v2.0-migration-2026-09-20.md` — confirmed by inspection
  that all pre-existing data was demo/test only (no real expert responses)
- Ran the whole shared migration via Supabase MCP, in this order:
  1. `v2_retire_old_objects` — unscheduled the `assessor_ratings` sync cron
     job, dropped that function + table, dropped `increment_respondents`,
     dropped `session_comments` and the old `participants` table, cleared the
     v1.1-shaped `ratings`/`iros`/`assessments` rows
  2. `v2_new_tables` — `clients`, `practice_settings`, `cycles`,
     `threshold_changes`, `invitations`, `live_sessions`,
     `live_session_participants`, `attendance_edit_log`, `submissions`,
     `topic_justifications`, RLS enabled on all
  3. `v2_alter_existing_tables` — changed `assessments`, `iros`, `ratings`,
     `topic_library`, `calibrations`, `stakeholder_groups`
  4. `v2_drop_old_policies` + `v2_drop_old_calibration_policies` — cleared
     v1.1 RLS policy names (two migrations attempted the new policies first
     and got clean `already exists` rollbacks — verified via `pg_policies`
     that nothing partial landed before retrying)
  5. `v2_rls_policies_and_views` — full anon + authenticated RLS matrix
     across every table, plus the `combined_ratings` view
  6. `v2_fix_cycle_anon_access` — the security advisor flagged a
     `SECURITY DEFINER`-style view (`cycle_public_info`) at ERROR level;
     replaced it with the same column-grant + RLS pattern already used for
     `invitations`. Re-ran `get_advisors` after — clean except the
     pre-existing, unrelated "leaked password protection disabled" Auth
     warning
  7. `v2_seed_demo_assessment` — re-created `acme-2026` (client, cycle,
     assessment, 10 IROs snapshotted from `topic_library`, one demo
     invitation) in the new structure
- Rewrote `docs/supabase-setup.md` end to end for the new schema, full RLS
  matrix, retired objects, and the demo data shape
- Verified with `list_tables` (RLS enabled on all 18 public tables) and
  `get_advisors` (security: clean)
- Confirmed this sandbox cannot reach `*.supabase.co` directly (proxy policy
  blocks it, `CONNECT tunnel failed, response 403`) — RLS/grants were
  verified via Supabase MCP `execute_sql` instead of a live REST call

## Last session
Session 5 (this one): ran the v2.0 shared migration end to end — see Current
state above for the full list. Frontend rework has not started yet.

Previous session (4): extended the participant flow with a one-submission-
per-browser guard and a respondent counter RPC — **both retired by this
session's migration** (`increment_respondents` and
`assessments.respondents_done`/`respondents_total` no longer exist; the
`localStorage` guard in `App.jsx` still references a flow that's about to be
rebuilt entirely).

## Remaining work

### v2.0 revision — database (this session, done)
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

### v2.0 revision — frontend (next, urgent — production is broken until this ships)
- [ ] Rewrite `src/lib/supabaseClient.js` / `src/lib/data.js`: drop every
      v1.1-shaped query (old `assessments.mode`, `ratings.session_id`,
      `session_comments`, `increment_respondents`, the `localStorage`
      one-submission guard); build against the new tables — link-code lookup
      (narrow columns only, per the new `invitations` grants), draft
      save/resume via `submissions`/`ratings`/`topic_justifications`,
      all-or-nothing submit
- [ ] Build Welcome — consent checkbox, the Section 7 data statement, the
      three fixed bullets, resume-link note; drop any "fully anonymous"
      language (GDPR outcome is now "applies")
- [ ] Build About you — expertise multi-select (E1–G1 + Other), expertise
      explanation, optional title, impact/financial/silent group grids from
      `stakeholder_groups`, the "basis for representation" field for silent
      groups; replaces the old single-select Stakeholder Group screen
- [ ] Update Rating Criteria — reflect the new criteria display rules
      (Section 9: potential vs. actual vs. human-rights-flagged negative
      impacts each show a different criterion set)
- [ ] Update Topic rating — per-criterion or per-topic justification
      depending on `assessments.justification_mode`, per-criterion skip,
      "Save and continue later" on every page
- [ ] Build the Save and continue later confirmation screen with a copyable
      personal link
- [ ] Update Submit — `overall_comment` into `submissions` (replaces
      `session_comments`); one all-or-nothing write across
      `submissions`+`ratings`+`topic_justifications`
- [ ] Build already-submitted, invalid-link and survey-closed screens
- [ ] Local test pass with the demo personal link
      (`link_code = 33168bb608ca541d0a44a623`, `acme-2026`), including save,
      resume and submit — needs a Netlify deploy preview or a browser outside
      this sandbox (see Known issues on the network restriction)
- [ ] Acceptance criteria pass — all 18 criteria in spec v2.0 Section 13
- [ ] Deploy to Netlify via MCP; confirm env vars still point at the
      publishable key (unchanged this session)
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
  `cycles` to `(id, esrs_version)`, `invitations` to
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
  topics) so the frontend rework has good coverage of the Section 9 criteria
  display rules to test against.

## Known issues
- **Frontend/database mismatch (expected, not a regression):** production's
  deployed frontend (`main`) is still v1.1 code querying a schema this
  session retired. Fixing this is the entire "v2.0 revision — frontend"
  section above; until it ships, `questionnaire-dma.netlify.app` will error
  or show stale/empty content when it queries the old shapes. No real expert
  data exists yet, and CLAUDE.md gates real invitations on the build being
  finished, so this is an accepted transitional state for the duration of
  the frontend rework, not an incident to roll back from.
- This sandbox cannot reach `*.supabase.co` directly — outbound HTTPS to it is
  blocked by the environment's proxy policy (confirmed via verbose curl:
  `CONNECT tunnel failed, response 403`). Schema/RLS work this session was
  verified via Supabase MCP (`execute_sql`, `list_tables`, `get_advisors`),
  which runs server-side rather than through this sandbox's network. A real
  browser click-through of the survey will still need a Netlify deploy
  preview or a browser outside this sandbox — same restriction noted in
  session 3/4 for the v1.1 flow.
- Supabase project still on the Free plan — builder's accepted risk (personal
  and resume links break while the project auto-pauses after ~1 week without
  traffic). Not a blocker; revisit before real client use.
- The v1.1 respondent-count / one-submission-per-browser work from session 4
  is fully retired by this migration (`increment_respondents`,
  `respondents_done`/`respondents_total` all dropped) — the corresponding
  `App.jsx`/`data.js` code is dead and will be removed as part of the
  frontend rework, not before.
- Before inviting any real expert, the builder gets a short GDPR check
  (business reason: audit traceability; anonymise-on-request approach). Does
  not block the build.

## Notes for next session
Start with `src/lib/supabaseClient.js` and `src/lib/data.js` — the data layer
has to be rebuilt against the new schema before any screen work is testable.
Suggested order: (1) link-code lookup + survey context (assessment + client +
cycle esrs_version, using the new narrow-grant columns), (2) draft
create/resume (submissions + ratings + topic_justifications), (3) all-or-
nothing submit. Then work through the screen list in the Remaining work
section above in order (Welcome → About you → Rating Criteria → Topic rating
→ Save-and-continue → Submit → Thank you → already-submitted/invalid/closed),
reusing `reference-prototype/` styling per CLAUDE.md's brand rules wherever a
screen already has a visual precedent there. Test against the demo link
(`acme-2026`, `link_code = 33168bb608ca541d0a44a623`) on a Netlify deploy
preview, since this sandbox can't reach Supabase directly.
