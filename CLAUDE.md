# Apus DMA — Expert Survey

## Identity
A public, no-login web page opened through a personal invitation link, where one invited expert rates the ESRS double-materiality IROs of one assessment (one topic per page, a justification per rating), can save and resume, and submits once.
Tier: 2 — public page, data persists to Supabase, no login required (D3+A1)
Spec version governed: v2.0 — the version of docs/product-spec.md these rules were derived from.
Position: Tool A of 2 in the greenfriend Double Materiality Assessment stack — shares the Supabase project with Apus DMA — Consultant Console (Tool B); this tool builds first and carries the shared schema migration.

## Session Protocol
At the start of every session:
1. Pull the latest from main before reading anything else.
2. Check docs/product-spec.md: if its version is newer than the "Spec version governed" line in this file, STOP. Tell the builder: "The spec has changed since this CLAUDE.md was written — re-run the Project Governor on the revised spec before building, or these rules may contradict it." Do not build against a stale CLAUDE.md.
3. Read PROGRESS.md in the project root — it is the current state of this build. If it is missing, recreate it with the structure at the end of this section, then continue.
4. Increment the session number and update the date in PROGRESS.md.
5. If "Notes for next session" has content: repeat the notes back to the builder, treat them as this session's priorities, then clear the section.
6. If this is session 1, run First Session Setup below before any build work.

Save point — after completing any module, feature, fix, or schema change:
1. Update PROGRESS.md: current state, remaining work, build decisions, known issues.
2. If the database was touched (any table, policy, bucket, or auth change), update docs/supabase-setup.md in the same save point.
3. Commit and push to main.
4. Tell the builder in one line: "Save point committed: [what changed]."
Do not start the next piece of work before the save point is pushed. Never end a session without one — an ending session is a save point.

First Session Setup (session 1 only):
1. Create docs/ and move product-spec.md into it. Move supabase-setup.md into docs/.
2. Announce what moved, then commit and push before building anything.

PROGRESS.md structure (for the recreate rule): status header (Session / Last updated / Live URL), Current state, Last session (3–5 lines, replace each session), Remaining work (shrinking checklist), Build decisions (one line each), Known issues, Notes for next session.

## Commands
```
npm install
npm run dev
npm run build
```

## Tech Stack
React · Vite · Tailwind CSS · Netlify · Supabase. Deployment: GitHub → Netlify, auto-deploys from main. Netlify MCP is active — create the site, set environment variables, and deploy via MCP.

## Environment Variables
VITE_SUPABASE_URL — Supabase: Project Settings → API → Project URL — Netlify env var
VITE_SUPABASE_ANON_KEY — the publishable key (sb_publishable_...), not the legacy anon JWT — Netlify env var

No server functions; both are browser-exposed. Confirm both exist at session start; prompt the builder if missing. No value ever appears in code or a committed file.

## Supabase
Project: "greenfriend Double Materiality Assessment" — already exists. Project URL: https://evwmxduudcujtibirmga.supabase.co
docs/supabase-setup.md is the schema source of truth. Read it before any database work. Never create a new project; never recreate tables or policies that already exist. Update it at every save point that touches the database.
Plan: Free — pauses after ~1 week without traffic (accepted, no upgrade planned). Before migrating: inspect the live database via Supabase MCP, reconcile docs/supabase-setup.md, and take a manual export first (no automatic backups on Free).

Tables this tool writes (only through the link-code functions):
submissions: id, assessment_id, invitation_id, source ('expert_survey'), status ('draft'|'submitted'), stakeholder_group, perspective ('impact'|'financial'), expertise_topics, expertise_explanation, title, basis_for_representation, overall_comment, consent_given_at, current_topic_index, last_saved_at, submitted_at
ratings: id, submission_id, assessment_id, iro_id, criterion_key, value (int, nullable — null means skipped), justification
topic_justifications: id, submission_id, iro_id, justification
Reads: assessments, iros, cycles, clients, stakeholder_groups; invitations, submissions, ratings and topic_justifications only through the link-code functions.
Shared migration — this build performs it exactly as listed in docs/product-spec.md Section 5 (create, change and retire lists); every field is defined in docs/product-spec-tool-b-consultant-console.md Section 5.

RLS — build these policies, never skip:
invitations, submissions, ratings, topic_justifications: anon has NO table-level access (no policy, no grant). All public access goes through six SECURITY DEFINER functions keyed by link code: lookup_invitation, mark_invitation_opened, get_draft, create_draft, save_progress, submit_survey_response. Never restore anon table access or a `using (true)` policy on these tables.
assessments, iros, clients, stakeholder_groups: anon select of all rows (display content only), no writes. cycles: anon select limited by column grant to id, esrs_version, stage, client_id.
All other tables: no anon access. `authenticated` policies: docs/product-spec-tool-b-consultant-console.md Section 6.

## Hard Rules
- API keys never in any frontend file or GitHub commit. This tool uses only the browser-safe publishable key; the service role key is not used.
- Netlify Identity: never; Supabase Auth is the only auth system in this stack (unused here). RLS: never disabled on any table — if a query fails, fix the policy or the query.
- GDPR: consent checkbox and the confirmed data statement (docs/product-spec.md Section 7) required on the Welcome screen before any data is submitted. Personal data: expertise, expertise explanation, optional title, basis for representation, free-text comments and justifications, all linked to an invitation. Deletion requests go to anikalerch@greenfriend.org. Supabase region eu-west-1 (EU). Never claim the survey is anonymous.
- This tool shares a Supabase project with Tool B. Tables other than submissions, ratings and topic_justifications belong to Tool B: change their schema or RLS only as listed in the shared migration above, and never write to them except the invitation status/timestamp update.

## Brand
No brand skill yet. These inline rules apply until one is added to the repo (then install it and defer to it):
- Background #FAFAF8 · Cards #FFFFFF with a soft shadow and #EFEFEC border · Accent #1F9A63 · Text #111318 (secondary #5B5B66 / #6B6B76 / #8A8A94)
- Font: Inter (body), Jost (wordmark only). Rounded corners 24px on cards, 16px on buttons and inputs; soft shadows only.
- The client company's logo (or a dashed-border placeholder) is the prominent brand on every screen; the Apus mark is a small muted "Hosted on" credit at the page bottom only.

## Business Rules
- One personal invitation link = one submission. After submission the link shows "already submitted" and nothing can change.
- Progress saves on every topic change and on "Save and continue later"; the same link resumes; drafts never count in results.
- Submit writes one submission and one ratings row per (topic × criterion) shown — all-or-nothing. A skipped criterion is a row with value null, never omitted.
- A justification is required whenever a rating has a value: per criterion, or once per topic, as set by assessments.justification_mode.
- Criteria per IRO: potential negative impact = scale, scope, irreversibility, likelihood; actual negative impact or potential human rights impact = scale, scope, irreversibility; potential positive impact = scale, scope, likelihood; actual positive impact = scale, scope; risk or opportunity = magnitude, likelihood.
- About you requires at least one expertise (E1–G1 or Other), an expertise explanation and one stakeholder group; title is optional; no name field is ever asked. Silent stakeholder groups show an optional "basis for representation" field.
- "Next topic" stays disabled while assessments.mandatory = true and any criterion on the page is neither answered nor skipped, or a required justification is empty.
- No calculation of any kind happens in this tool — scores and materiality are Tool B's job.

Out of scope — do not build:
- Emailed distribution of personal links (the consultant sends them manually); login-based access for experts
- Expert weighting or scoring by expertise; multi-language support; mobile-specific layout testing
- File or attachment upload as evidence; editing or re-opening a response after submission
- Document search or knowledge base

## Reference Docs
Read before building the related part:
- docs/product-spec.md — full module specs, UI sections, logic, acceptance criteria
- docs/product-spec-tool-b-consultant-console.md — Tool B spec; Section 5 defines the shared migration fields
- docs/supabase-setup.md — schema source of truth (exists — read first)
- reference-prototype/ — look of screens that already exist
PROGRESS.md in the root is read at every session start per the Session Protocol.
