# Supabase Setup — Apus DMA (shared project, both tools)

> This file originated in Tool A (Participant Questionnaire) and is copied
> into both repos per each tool's CLAUDE.md. Tool B (Consultant Console)
> owns the sections below the "Tool B additions" marker; edit Tool A's copy
> for anything above it.

**Last updated:** 2026-09-20 — Tool A session 5, v2.0 shared migration
(performed in full per product-spec.md Section 5 and
product-spec-tool-b-consultant-console.md Section 5/6 — Tool A builds first
and migrates the whole shared schema). Replaces the v1.1 schema entirely.
Manual export of the pre-migration state: `docs/backups/pre-v2.0-migration-2026-09-20.md`.

## Project
- Name: `greenfriend Double Materiality Assessment` (existing project — reused per
  the builder's instruction; does **not** match the spec's originally proposed
  `greenfriend-dma` name, kept as-is rather than renaming/recreating)
- Project ID: `evwmxduudcujtibirmga`
- Project URL: `https://evwmxduudcujtibirmga.supabase.co`
- Region: `eu-west-1`
- Plan: Free — builder decided to stay on Free (2026-09-18); accepted risk:
  personal and resume links break while the project is paused after ~1 week
  without traffic. Open a survey link weekly during a survey window.

## Migrations applied this session (in order)
1. `v2_retire_old_objects` — unscheduled the `sync_ratings_to_assessor_ratings`
   cron job, dropped that function, `assessor_ratings`, `increment_respondents`,
   `session_comments`, `participants`; cleared the old-shape `ratings`, `iros`
   and the demo `assessments` row (v1.1-shaped, no `submission_id`/`justification` —
   exported first, see backup file above)
2. `v2_new_tables` — created `clients`, `practice_settings`, `cycles`,
   `threshold_changes`, `invitations`, `live_sessions`,
   `live_session_participants`, `attendance_edit_log`, `submissions`,
   `topic_justifications`; RLS enabled on all
3. `v2_alter_existing_tables` — changed `assessments`, `iros`, `ratings`,
   `topic_library`, `calibrations`, `stakeholder_groups` per the shared
   migration's "Changed" list
4. `v2_drop_old_policies`, `v2_drop_old_calibration_policies` — removed v1.1
   RLS policies before replacing them
5. `v2_rls_policies_and_views` — full RLS matrix (anon + authenticated) across
   every table, plus the `combined_ratings` view
6. `v2_fix_cycle_anon_access` — replaced a `SECURITY DEFINER`-style view (flagged
   ERROR by the Supabase security linter) with column-grant + RLS on `cycles`
   directly, matching the pattern already used for `invitations`
7. `v2_seed_demo_assessment` — re-created the `acme-2026` demo assessment,
   cycle, client and a demo invitation in the new structure

## Tables

### clients — New. Owned by Tool B.
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | default `gen_random_uuid()` |
| name | text | |
| logo_url | text | nullable — set via Supabase Storage upload in Tool B |
| created_at | timestamptz | default `now()` |

### practice_settings — New. Owned by Tool B. One row.
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| consultant_logo_url | text | nullable |

### cycles — New. Owned by Tool B. This tool only reads `esrs_version` (narrowly).
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| client_id | uuid, FK → clients | `on delete cascade` |
| name | text | |
| financial_year | integer | |
| esrs_version | text | `esrs_2023_amended` \| `esrs_2026` |
| stage | text | `collecting` \| `calibrating` \| `signed_off`, default `collecting` |
| impact_threshold, financial_threshold | numeric | default 3.0 each |
| baseline_impact_threshold, baseline_financial_threshold | numeric | default 3.0 each |
| require_both_sources | bool | default `false` |
| silent_stakeholders_considered | bool | default `false` |
| silent_stakeholders_note | text | nullable |
| methodology_version, approver_name, approver_role, minutes_reference | text | nullable |
| signed_off_at | timestamptz | nullable |
| signed_off_recorded_by, created_by | uuid, FK → auth.users | nullable |
| created_at | timestamptz | default `now()` |

### threshold_changes — New. Owned by Tool B. Append-only.
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| cycle_id | uuid, FK → cycles | `on delete cascade` |
| axis | text | `impact` \| `financial` |
| old_value, new_value | numeric | |
| reason | text | nullable |
| changed_by | uuid, FK → auth.users | nullable |
| changed_at | timestamptz | default `now()` |

### assessments — Changed. Owned by Tool B. This tool reads it.
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| cycle_id | uuid, FK → cycles | **new** |
| type | text | **new**, replaces `mode` — `expert_survey` \| `expert_live_session` |
| name, description | text | description nullable |
| perspective_filter | text | `full` \| `impact` \| `financial` |
| status | text | free text, default `'draft'` (demo uses `'active'`) |
| start_date, end_date | date | nullable |
| slug | text | unique — public link identifier for the survey route |
| welcome_text, task_text | text | nullable |
| mandatory | bool | default `false` |
| justification_mode | text | **new** — `per_criterion` (default) \| `per_topic` |
| created_at, updated_at | timestamptz | |
| created_by | uuid, FK → auth.users | nullable |

**Retired columns:** `mode` (→ `type`), `logo_url` (client logo used instead,
via `cycle_id` → `cycles.client_id` → `clients.logo_url`), `respondents_done`,
`respondents_total` (counts now derived from `invitations` + `submissions`).

### topic_library — Changed. Owned by Tool B, the master IRO library.
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| iro_type | text | `neg_impact` \| `pos_impact` \| `risk` \| `opportunity` |
| esrs_topic_id | text | E1–G1 |
| esrs_subtopic, short_title, description | text | subtopic/description nullable |
| actual | bool | default `false` |
| value_chain | text | nullable — `own` \| `upstream` \| `downstream` |
| esrs_version | text | **new** — `esrs_2023_amended` \| `esrs_2026`, backfilled `esrs_2023_amended` |
| time_horizon | text | **new**, nullable |
| potential_human_rights_impact | bool | **new**, default `false` |
| client_id | uuid, FK → clients | **new**, nullable — empty means shared master topic |
| reference_code | text | unique |
| signed_off_by | text | nullable |
| signed_off_at | timestamptz | nullable |
| created_at | timestamptz | |

### iros — Changed. Owned by Tool B (snapshot at assessment creation). This tool reads/writes ratings against it.
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| assessment_id | uuid, FK → assessments | `on delete cascade` |
| topic_library_id | uuid, FK → topic_library | nullable |
| esrs_topic_id | text | |
| name, description | text | description nullable |
| iro_type | text | `neg_impact` \| `pos_impact` \| `risk` \| `opportunity` |
| actual | bool | default `false` |
| time_horizon | text | **new**, nullable |
| potential_human_rights_impact | bool | **new**, default `false` |
| session_notes | text | nullable |
| order | integer | default `0` |
| created_at | timestamptz | |

**Retired columns:** `subtopic_raw`, `impact_threshold`, `financial_threshold`
(unused — never read by the ported UI, not in the v2.0 field list).

### stakeholder_groups — Changed. Owned by Tool B, the master stakeholder map. This tool reads it (anon, all rows — needed to render the "About you" group picker).
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| type | text | **new**, nullable — `impact` \| `financial` \| `silent`; backfilled from the old `perspectives` array where it held exactly one value, left `null` for the ungrouped entries carried over from the v1.1 stakeholder map |
| perspectives | text[] | kept alongside `type` per spec's field list |
| order | integer | |

Three silent-stakeholder presets seeded: Nature and ecosystems, Species and
biodiversity, Future generations (`type = 'silent'`, custom entries allowed).

### stakeholder_members — Unchanged shape. Owned by Tool B. **No longer anon-readable** (see RLS below).
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| group_id | uuid, FK → stakeholder_groups | |
| name, role | text | |
| company, email, expertise | text | nullable |
| pillars | text[] | default `{}` |
| created_at | timestamptz | |

### invitations — New. Owned by Tool B. This tool only reads/writes a narrow column set (never `name`/`email`).
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| assessment_id | uuid, FK → assessments | `on delete cascade` |
| name, email | text | **never exposed to anon** |
| stakeholder_group_id | uuid, FK → stakeholder_groups | the group the consultant *expects* — not binding, "About you" is never pre-filled |
| link_code | text | unique, unguessable — the personal link's secret |
| status | text | `invited` \| `opened` \| `saved` \| `submitted`, default `invited` |
| sent_at, opened_at, last_saved_at, submitted_at, anonymised_at | timestamptz | nullable |
| created_at | timestamptz | |

### submissions — New. Owned/written by this tool.
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| assessment_id | uuid, FK → assessments | `on delete cascade` |
| source | text | `expert_survey` \| `expert_live_session` |
| invitation_id | uuid, FK → invitations | nullable — set for `expert_survey`, **unique** (one submission per invitation) |
| live_session_id | uuid, FK → live_sessions | nullable — set for `expert_live_session` |
| status | text | `draft` \| `submitted`, default `draft` |
| stakeholder_group | text | the group the expert chose (About you) |
| perspective | text | `impact` \| `financial` |
| expertise_topics | text[] | E1–G1 / Other, multi-select |
| expertise_explanation | text | |
| title, basis_for_representation, overall_comment | text | nullable |
| consent_given_at | timestamptz | nullable |
| current_topic_index | integer | default `0` |
| last_saved_at | timestamptz | default `now()` |
| submitted_at | timestamptz | nullable |
| created_at | timestamptz | |

`submissions_source_reference` check constraint enforces exactly one of
`invitation_id` / `live_session_id` is set, matching `source`.

### ratings — Changed. Owned/written by this tool (and, later, Tool B for live sessions).
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| submission_id | uuid, FK → submissions | **new**, `on delete cascade` — replaces the old bare `session_id` |
| assessment_id | uuid, FK → assessments | kept (denormalized, per spec) |
| iro_id | uuid, FK → iros | |
| criterion_key | text | `scale` \| `scope` \| `irreversibility` \| `likelihood` \| `magnitude` — **`financialLikelihood` retired**; CLAUDE.md's Business Rules list "risk or opportunity = magnitude, likelihood" and product-spec.md Section 9 confirm `likelihood` is reused for risk/opportunity, not a separate key |
| value | integer, nullable | 0–5, `null` = skipped |
| justification | text | **new**, nullable — required whenever `value` is set and `justification_mode = per_criterion` |

**Retired columns:** `stakeholder_group`, `session_id` (both moved to
`submissions`).

### topic_justifications — New. Owned/written by this tool.
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| submission_id | uuid, FK → submissions | `on delete cascade` |
| iro_id | uuid, FK → iros | `on delete cascade` |
| justification | text | required when `justification_mode = per_topic` |

Unique on `(submission_id, iro_id)` — one topic justification per topic per
submission.

### live_sessions, live_session_participants, attendance_edit_log — New. Owned by Tool B (Tier 3, live facilitation). This tool never reads or writes these.
See product-spec-tool-b-consultant-console.md Section 5 for full field
definitions; created here as part of the shared migration, RLS restricted to
`authenticated` only.

### calibrations — Changed. Owned by Tool B.
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| cycle_id | uuid, FK → cycles | **new** |
| iro_id | uuid, FK → iros | |
| owner, moderator, notes | text | nullable |
| calibrated_value | numeric | nullable |
| band_value | integer | nullable, 1–5 |
| reviewed_with_owner | bool | **new**, default `false` |
| reviewed_with_owner_at | timestamptz | **new**, nullable |
| calibrated_at | timestamptz | nullable |

**Retired columns:** `signed_off_by`, `signed_off_at` (sign-off now lives on
`cycles`, one record per cycle rather than per calibration).

### calibration_history — Unchanged. Owned by Tool B. Append-only.

### combined_ratings — New view (not a table). Owned by Tool B, `authenticated`-only.
One row per **submitted** rating: `submission_id`, `cycle_id`, `assessment_id`,
`source`, `iro_id`, `criterion_key`, `value`, `justification` (the criterion's,
or the topic's when the mode is per topic, via `coalesce`), `stakeholder_group`,
`perspective`, `expertise_topics`, `invitation_id`, `live_session_id`.

## RLS — full matrix (built this session, Tool A CLAUDE.md rules + Tool B spec Section 6)

**Anon (unauthenticated, public survey):**
| Table | Access |
|---|---|
| assessments, iros, clients, stakeholder_groups | SELECT, all columns, all rows (row-level scoping isn't possible without an auth identity — same accepted pattern as v1.1; data is non-sensitive display content) |
| cycles | SELECT limited to columns `(id, esrs_version)` via column grant — thresholds, stage, sign-off/approver fields stay internal |
| invitations | SELECT limited to columns `(id, assessment_id, link_code, status, submitted_at)`; UPDATE limited to columns `(status, opened_at, last_saved_at, submitted_at)` — `name`/`email` never exposed or writable. No general SELECT/UPDATE policy exists; access is column-grant-scoped on top of a `using (true)` policy, so the *column grant* is the real boundary |
| submissions | SELECT all; INSERT (`source = 'expert_survey'` only); UPDATE only while `status = 'draft'` |
| ratings, topic_justifications | SELECT all; INSERT/UPDATE only while the parent submission is a draft (checked via `EXISTS` subquery against `submissions.status`) |
| stakeholder_members | **no access** — Tool A's CLAUDE.md read list never included this table; the v1.1 "anon select stakeholder_members" policy was dropped this session, not carried forward |
| topic_library, practice_settings, threshold_changes, live_sessions, live_session_participants, attendance_edit_log, calibrations, calibration_history | no access |
| All tables | **no DELETE ever** for anon |

**Authenticated (Tool B, magic-link login, one shared access level):** full
matrix per product-spec-tool-b-consultant-console.md Section 6 — SELECT/INSERT/UPDATE
on nearly everything, with DELETE gated by state (`clients` only if no cycles,
`cycles`/`assessments` only if no responses exist, `cycles` UPDATE blocked once
`stage = 'signed_off'`, `invitations` DELETE only before `opened_at`,
`live_sessions` DELETE only before `started_at`; `threshold_changes`,
`attendance_edit_log`, `calibration_history` are append-only — no
UPDATE/DELETE policy exists for any role).

> Every table has RLS enabled — confirmed via `list_tables`. Two migrations
> (`v2_drop_old_policies`, `v2_drop_old_calibration_policies`) were needed to
> clear v1.1 policy names before the new ones could be created — `apply_migration`
> runs each call in a transaction, so the one failed attempt rolled back cleanly
> with no partial state (verified via `pg_policies` before retrying).

## Retired functions, triggers and jobs
- `increment_respondents(uuid)` — dropped (was `SECURITY DEFINER`, callable by
  `anon`/`authenticated`, flagged by the security advisor pre-migration)
- `sync_ratings_to_assessor_ratings()` — dropped, along with the `pg_cron` job
  (`jobid 1`, `*/10 * * * *`) that called it every 10 minutes
- `cycle_public_info` view — created then immediately replaced in the same
  session: it used the `SECURITY DEFINER`-equivalent pattern (`security_invoker = false`)
  to expose `esrs_version` to anon, which the Supabase security linter flags at
  ERROR level (`security_definer_view`). Replaced with the column-grant pattern
  used everywhere else in this schema (see `cycles` above) — verified clean
  with `get_advisors` afterward (only the pre-existing, unrelated
  "leaked password protection disabled" Auth warning remains)

## Demo data (re-created this session, new structure)
- Client: **Acme Corp**
- Cycle: "Acme Corp DMA 2026", FY2026, `esrs_2023_amended`, stage `collecting`,
  thresholds 3.0/3.0
- Assessment: slug `acme-2026`, `type = expert_survey`,
  `justification_mode = per_criterion`, `mandatory = true`, `status = active`
- 10 IROs snapshotted from `topic_library` (all current master-library topics —
  a mix of `neg_impact`, `pos_impact`, `risk` and `opportunity` across E1, E2,
  E5, S1, S2, G1)
- 1 demo invitation: name "Demo Expert" (placeholder — GDPR-safe, not a real
  person), stakeholder group "Employees", `link_code = 33168bb608ca541d0a44a623`,
  status `invited`
- `stakeholder_groups` (34 rows: 31 original + 3 new silent presets) and
  `stakeholder_members` (3 test rows: "k", "test", "s" — pre-existing test
  data, confirmed non-real before the migration) carried forward unchanged

## Notes
- Network egress from the Claude Code sandbox to `*.supabase.co` is blocked by
  this environment's proxy policy (confirmed via `curl -v` — `CONNECT tunnel
  failed, response 403`; same restriction noted in earlier sessions for
  click-testing). RLS/grants were verified via Supabase MCP `execute_sql`
  (which runs server-side, not through the sandboxed network) rather than a
  live REST call with the anon key. A real click-through still needs a Netlify
  deploy preview or a browser outside this sandbox, same as before.
- Builder must still upgrade to Pro before real client use if the accepted
  Free-plan risk (link breakage during a pause) becomes unacceptable — no
  change to that decision this session.
