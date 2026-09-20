# PROGRESS — Apus DMA — Expert Survey

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 5
**Last updated:** 2026-09-20 — PR #7 (the security fix) merged; `main` and the database are back in sync
**Live URL:** production is `questionnaire-dma.netlify.app`, deploying from
`main`, now at `1e5cb18` (PR #7's merge commit) — the v2.0 frontend with the
link-code-keyed `SECURITY DEFINER` access pattern, matching the database.
[PR #6](https://github.com/Ani-greenfriend/DMA-Questionnaire-A/pull/6) and
[PR #7](https://github.com/Ani-greenfriend/DMA-Questionnaire-A/pull/7) are
both merged. No real experts have been invited, so no personal data was ever
actually exposed by the brief pre-fix window on `main`. Still not confirmed
working end-to-end in a real browser (the one browser test that happened was
against PR #6's deploy preview, before the security fix) — that's the next
step, along with the Section 13 acceptance-criteria pass.

## Current state
The v2.0 shared database migration, the full frontend rework, and a
same-session security fix to anon access on the new schema are all done and
pushed to PR #6. A manual browser test of the deploy preview confirmed the
survey works end to end (see Known issues on timing — that test ran before
the security fix, on the access pattern the fix replaced). The security
fix's own SQL logic was verified via Supabase MCP against a real test
invitation; the *frontend* changes that came with it (every anon call now
keyed by link code, routed through new RPC functions) have **not** been
re-verified in an actual browser yet.

Done this session:
- Session Protocol run: pulled `main`, confirmed `docs/product-spec.md` is at
  v2.0 matching CLAUDE.md's governed version, read this file, incremented to
  session 5
- Took a full manual export of the pre-migration database to
  `docs/backups/pre-v2.0-migration-2026-09-20.md` — confirmed all
  pre-existing data was demo/test only
- Ran the full v2.0 shared migration via Supabase MCP (9 migrations — see
  `docs/supabase-setup.md`'s "Migrations applied this session"): retired
  v1.1 objects, created every new table, altered every changed table, built
  the anon + authenticated RLS matrix, fixed a security-linter-flagged view,
  re-seeded the `acme-2026` demo assessment, added frontend support (wider
  `cycles` column grant, a uniqueness constraint, an atomic submit RPC —
  which had one bug, found and fixed the same session)
- Rebuilt the entire frontend against the new schema (`src/lib/data.js`,
  `src/lib/criteria.js`, `src/components/ExpertSurvey.jsx` replacing
  `ParticipantExperience.jsx`, `src/App.jsx`, `src/lib/topics.js`) — every
  v2.0 screen: Welcome/consent, About you, Rating Criteria, Topic rating,
  Save-and-continue-later, Submit, Thank you, invalid-link/already-submitted/
  closed. `npm run build`/`lint` clean.
- Opened [PR #6](https://github.com/Ani-greenfriend/DMA-Questionnaire-A/pull/6),
  subscribed to it. CI (Netlify deploy preview) went green immediately.
  Builder manually click-tested the deploy preview and confirmed it worked.
- **Security fix, found in review after the PR was open:** the RLS design
  from the migration above gave anon `using (true)` (every row) SELECT
  access to `invitations` (narrowed only by a column grant),
  `submissions`, `ratings` and `topic_justifications` (not narrowed at
  all). That meant `link_code` — meant to be unguessable — was fully
  listable via the REST API, and every expert's personal data was readable
  platform-wide, violating spec Section 6 and acceptance criterion 16.
  Fixed via a 10th migration (`v2_security_lockdown_anon_link_access`):
  revoked **all** anon table-level access and RLS policies on those 4
  tables, replaced every anon interaction with 6 new `SECURITY DEFINER`
  functions keyed by `link_code` itself (`lookup_invitation`,
  `mark_invitation_opened`, `get_draft`, `create_draft`, `save_progress`,
  `submit_survey_response` — the last renamed from taking
  `p_invitation_id uuid` to `p_link_code text`). Verified via
  `execute_sql`: zero anon grants remain on the 4 tables, anon can execute
  exactly these 6 functions, and all 6 work correctly end to end against a
  fresh test invitation (created for this test, then reset to a clean
  `invited` state afterward — see `docs/supabase-setup.md`'s demo data
  section for its `link_code`). Rewrote `src/lib/data.js`/`ExpertSurvey.jsx`/
  `App.jsx` to call the new functions (every call now keyed by `linkCode`,
  not `invitationId`/`submissionId` — those React state values were removed
  entirely, they're no longer needed). `npm run build`/`lint` clean.
  `docs/supabase-setup.md` rewritten for the new access model; not yet
  pushed as a commit (next step).

## Last session
Session 5 (this one): ran the full v2.0 shared migration, rebuilt the
frontend, opened PR #6, then fixed a real anon-access security hole found in
review — see Current state above.

Previous session (4): extended the participant flow with a one-submission-
per-browser guard and a respondent counter RPC — both retired by this
session's migration and removed from the frontend.

## Remaining work

### v2.0 revision — database + frontend + security fix (session 5, done)
All of it — see Current state above. Nothing left undone in the build
itself; what remains is verification.

### v2.0 revision — verification (next)
- [x] Commit and push the security-fix changes — on PR #7
- [x] Merge PR #7 — merged, `main` is now at `1e5cb18`, back in sync with
      the database
- [ ] Real browser test against production or a fresh deploy preview, using
      the link-code-keyed access pattern (the only confirmed-working browser
      test so far ran on PR #6's preview, before the security fix). Use the
      fresh test invitation (`link_code = a1b2c3d4e5f6a1b2c3d4e5f6`,
      "Demo Expert 2") for a clean save/resume/submit pass, since the
      original demo link (`33168bb608ca541d0a44a623`) is now `submitted`
- [ ] Confirm anon lockdown from an actual browser/REST call (not just
      `execute_sql`'s role-privilege introspection): `GET /invitations`,
      `/submissions`, `/ratings`, `/topic_justifications` with the anon key
      should each return nothing
- [ ] Acceptance criteria pass — all 18 criteria in spec v2.0 Section 13,
      including #16 (public-side security) which this fix directly targets
- [ ] Builder, before inviting any real expert: short GDPR check (legal
      basis, anonymise-on-request approach) — flagged, not blocking

## Build decisions
- Reused an existing Supabase project (`greenfriend Double Materiality
  Assessment`, ID `evwmxduudcujtibirmga`) rather than creating a new
  `greenfriend-dma` project, per the builder's instruction in an earlier
  session — see docs/supabase-setup.md.
- `ratings.criterion_key` check constraint is 5 values (`scale`, `scope`,
  `irreversibility`, `likelihood`, `magnitude`) — dropped the v1.1
  `financialLikelihood` key. CLAUDE.md's Business Rules and product-spec.md
  Section 9 both confirm `likelihood` is reused for risk/opportunity rather
  than a separate key.
- `assessments`/`iros`/`clients`/`stakeholder_groups` keep the v1.1 pattern of
  unscoped anon `SELECT` (all rows, `using (true)`) — true per-link row-level
  scoping isn't possible for an unauthenticated visitor without a session
  identity, and this content isn't sensitive (survey display copy, topic
  names, client name/logo, stakeholder group names) or a secret. This is
  deliberately different from the tables below, which hold either a secret
  credential (`invitations.link_code`) or personal data
  (`submissions`/`ratings`/`topic_justifications`) — a blanket `using (true)`
  policy is a real hole for those, not an acceptable tradeoff, which is
  exactly the bug the security fix corrects (see below).
- `cycles`: anon gets a `using (true)` RLS policy but a **column-level
  grant** restricting exposure to `(id, esrs_version, stage, client_id)` —
  thresholds/sign-off/approver name stay internal. This part of the original
  design held up under review (cycles carry no secret and no personal data,
  only business-internal workflow metadata) — only `invitations` and the 3
  submission-data tables needed the stronger fix.
- **`invitations`, `submissions`, `ratings`, `topic_justifications` have
  zero anon table-level access** (fixed this session — see Current state).
  The original design used a `using (true)` RLS policy on all four
  (narrowed only on `invitations`, via a column grant excluding
  `name`/`email`) reasoning that "no session identity → no row-level
  scoping is possible, so allow broad reads and rely on the app to filter
  client-side." That reasoning is sound for non-sensitive display content
  (see `cycles` above) but wrong here: `using (true)` SELECT means the
  *entire table* is listable via the REST API regardless of what the
  client's own query filters by, so `link_code` — the one thing meant to be
  an unguessable secret — was actually fully enumerable, and every expert's
  personal data was readable by anyone with the (public, browser-bundled)
  anon key. The fix: no anon RLS policy or grant at all on these 4 tables;
  all access goes through `SECURITY DEFINER` functions that take `link_code`
  as an input parameter and internally scope every read/write to the one
  invitation it resolves to. This is the correct shape for "narrow lookup by
  link code" — a secret is something you provide as an argument, never
  something you can list.
- `stakeholder_members` anon access from v1.1 was **not** carried forward —
  Tool A's own CLAUDE.md read list never included this table, and the table
  holds named contacts with emails.
- The old demo assessment's `iros`/`ratings` (v1.1-shaped) were deleted
  rather than migrated in place, per product-spec.md Section 5's explicit
  instruction. `topic_library` and `stakeholder_groups`/`stakeholder_members`
  were altered in place and kept.
- Demo IROs: snapshotted all 10 current `topic_library` rows into the new
  `acme-2026` assessment for good coverage of the Section 9 criteria display
  rules.
- Submit is one Postgres function (`submit_survey_response`) rather than
  several client-side writes, so it's genuinely atomic. First version
  deleted existing draft rows before re-inserting; anon has no DELETE policy
  on `ratings`/`topic_justifications` (correctly, per spec), so that delete
  silently affected 0 rows and the re-insert hit a uniqueness constraint.
  Fixed by switching to `ON CONFLICT ... DO UPDATE` — no delete anywhere.
  Caught and fixed in review before any deploy. (This function was later
  also re-keyed from `p_invitation_id uuid` to `p_link_code text` as part of
  the security fix — same atomicity guarantee, narrower input.)
- Draft progress saves (`saveProgress`/`save_progress`, called on every
  "Next topic"/"Previous topic"/"Save and continue later") are plain
  best-effort upserts, not wrapped in the atomic-submit guarantee — only the
  final Submit needs it (drafts never count in results).
- Welcome re-shows the consent checkbox and requires re-ticking on every
  visit, including resuming a saved draft, per the spec's literal wording.
  `submissions.consent_given_at` is only written once, at draft creation
  (now set server-side inside `create_draft`, not passed from the client).
- URL shape for the personal link: `/survey/:slug/:linkCode` — resolved as
  an explicitly non-blocking open question in product-spec.md Section 15.
  The slug is cosmetic/readability only; every actual lookup and every
  `SECURITY DEFINER` function call is keyed by `linkCode` alone.
- The "About you" group grids are populated by filtering
  `stakeholder_groups` on `type IN ('impact','silent')` and
  `type = 'financial'` — reproduces exactly the two default option lists in
  product-spec.md Section 8.

## Known issues
- **No browser test yet of the post-fix flow.** The one confirmed-working
  browser test (PR #6's deploy preview) ran before the security fix, so it
  exercised the old (leaky) direct-table access pattern, not the new
  function-based one now live on `main`. The new access path was verified
  at the SQL level only (via `execute_sql`, which runs server-side, not
  through this sandbox's network — this sandbox still can't reach
  `*.supabase.co` or Netlify directly, confirmed via verbose curl:
  `CONNECT tunnel failed, response 403`). A real click-through against
  production or a fresh deploy preview is the top item in Remaining work.
- Supabase project still on the Free plan — builder's accepted risk. Not a
  blocker; revisit before real client use.
- Before inviting any real expert, the builder gets a short GDPR check.
  Does not block the build.

## Notes for next session
Both PR #6 (v2.0 migration + frontend) and PR #7 (the security fix) are
merged — `main` is at `1e5cb18` and in sync with the database. Start with a
real browser test against production or a fresh deploy preview: walk
`/survey/acme-2026/a1b2c3d4e5f6a1b2c3d4e5f6` ("Demo Expert 2", a clean
`invited` invitation) end to end — Welcome (consent), About you, Rating
Criteria, topics (answer/skip, check per-criterion justification gating —
the demo assessment's `justification_mode` is `per_criterion`),
Save-and-continue-later (copy the link, reopen it, confirm resume restores
state), Submit, Thank you, then reopen the same link and confirm
"already submitted." Also spot-check that a raw REST call with the anon key
(`GET /rest/v1/invitations`, `/submissions`, `/ratings`,
`/topic_justifications`) returns nothing. Then run the full Section 13
acceptance criteria list.
