# Product Spec — Apus DMA — Participant Questionnaire

**Version:** 1.1
**Date:** 2026-09-16
**Author:** Anika (greenfriend)
**Status:** Confirmed

---

> **Stack notice:** This is Tool A of a two-tool stack. Tool B — **Apus DMA — Consultant Console** — is the internal, authenticated admin application that creates and manages assessments, and shares the same Supabase project. See `product-spec-apus-dma-console.md`. Tool A creates the database schema; Tool B's build must not start until Tool A's build is complete and `docs/supabase-setup.md` exists.
>
> **Prototype note:** the working prototype built during design (React/Vite, in-memory state, no backend) currently renders this tool's screens as a component *inside* the console app for internal previewing (same component tree, gated by an `?assessment=` handoff). In the real Tier 2 build, this must become a genuinely separate, separately deployed site with its own Netlify URL — the console's "Preview" feature should render this same component tree locally within the console (no network call needed, since it's the console's own bundle), while the actual participant link points at Tool A's independently deployed site.

---

## Section 1 — Tool Summary

**Tool name:** Apus DMA — Participant Questionnaire

**What it does:** A public, no-login web page where one external stakeholder rates a set of ESRS double-materiality IROs (Impacts, Risks, Opportunities) belonging to one assessment created in the Consultant Console. Presents one topic per page, with every applicable rating criterion for that topic's type stacked on the same page, and submits the full set of answers at the end.

**Who uses it:** External stakeholders of a client company invited by a link — e.g. employees, investors, suppliers, customers, executive management, lenders/creditors, supervisory board members, analysts/rating agencies, NGOs/civil society. No account, no prior relationship with the tool.

**Why it exists:** Lets a sustainability consultant collect individually-rated ESRS double-materiality input from many stakeholders, at the level of granularity (Scale/Scope/Irremediability/Likelihood, or Magnitude/Likelihood) that makes the resulting materiality determination audit-defensible, without requiring any stakeholder to create an account or learn an internal tool.

**Build status:** First build — no prior version.

---

## Section 2 — Classification

### Data Model

**Decision:** D3

| Label | This tool? |
|-------|-----------|
| D1 — Hardcoded | No |
| D2 — Session | No |
| D3 — Persisted | **Yes** |

**Reason:** One assessment collects submissions from many different stakeholders over a multi-day/multi-week window; the consultant must be able to review all of them together, after every session has ended, in the Consultant Console.

**D3 triggers that apply:**
- [x] Data must be retrievable after the session ends
- [x] Multiple sessions contribute to the same dataset
- [ ] An audit trail or history is needed *(handled in Tool B via calibration records, not here)*
- [x] Data submitted by one person must be visible to another (the consultant)
- [ ] Results must be accessible via a URL after the session ends *(the consultant views results in Tool B, not via a public results URL)*
- [ ] Files uploaded by users must be stored and retrievable later

---

### Access Model

**Decision:** A1

| Label | This tool? |
|-------|-----------|
| A1 — Public | **Yes** |
| A2 — Authentication | No |
| A3 — Authorization | No |

**Reason:** Anyone with the assessment link fills in the questionnaire; there is no login, no account, and no per-user permission distinction on this side.

---

### Tier

**Tier:** 2 (D3 + A1)

| D+A combination | Stack | Deployment |
|----------------|-------|------------|
| D3+A1 | Netlify + Supabase (no auth) | Netlify |

---

### Standalone or Stack

**This tool is:** Part of a stack — see the stack notice at the top of this document, and Section 4 below.

---

## Section 3 — Arms

**AI API:** Not active
**Export:** Not active
**Email:** Not active — the assessment link is copied and shared manually by the consultant from the Consultant Console; no email is sent by either tool in this build
**Scheduled Automation:** Not active

---

## Section 4 — Stack and Deployment

| Detail | Answer |
|--------|--------|
| Frontend framework | React + Vite + Tailwind (matches the built prototype exactly) |
| Deployment target | Netlify |
| Netlify MCP | **Open question** — not established during the build session; confirm before opening Claude Code (see Section 15) |

**GitHub:** A repo for this tool must exist and contain this spec, plus `CLAUDE.md` and `PROGRESS.md` from the Project Governor, before the first Claude Code session.

### Supabase project

**Status:** New — Claude Code creates it at the start of Tool A's build session (this tool builds the schema first).

**Plan:** Pro — client questionnaires run intermittently over days or weeks; the Free plan's auto-pause after roughly a week of inactivity would make a shared link look broken to a stakeholder opening it during a quiet stretch.

| Detail | Answer |
|--------|--------|
| Proposed project name | `greenfriend-dma` — named for the consulting practice, not this specific tool, since Tool B shares the same project |
| Confirmed project name | `greenfriend-dma` — confirmed |

### Stack detail

**Stack name / Supabase project name:** greenfriend-dma (proposed)

**This tool's role in the stack:** Tool A — public submission side (creates schema)

| Tool | Tier | Role in the stack |
|------|------|-------------------|
| Apus DMA — Participant Questionnaire (this spec) | 2 | Public, no-login submission of ratings |
| Apus DMA — Consultant Console | 3 | Internal, authenticated creation, calibration, and results |

**Build order:** This tool (Tool A) builds first and creates the shared schema. The Consultant Console (Tool B) marks the Supabase project as *existing* and must not start its build session until `docs/supabase-setup.md` exists from this build.

---

## Section 5 — Data Architecture

**What data is collected or stored in this tool:**

| Field name | Plain language label | Data type | Who provides it | Required? |
|-----------|----------------------|-----------|-------------------|-----------|
| assessment_id | Which assessment this submission belongs to | UUID (FK) | From the link | Yes |
| iro_id | Which IRO this row rates | UUID (FK) | From the assessment's topic list | Yes |
| criterion_key | Which criterion this row rates | Text — one of `scale`, `scope`, `irreversibility`, `likelihood`, `magnitude`, `financialLikelihood` | Fixed by the IRO's type | Yes |
| value | The 0–5 rating, or null if skipped | Integer 0–5, nullable | Participant | No — the "skip" control leaves this null on purpose |
| stakeholder_group | The single group the participant selected (e.g. "Employees", "Investors / shareholders") | Text | Participant, once per session, applied to every row from that session | Yes |
| session_id | Groups all rows from one participant's single visit | UUID, generated client-side at the start of the session | Automatic | Yes |
| submitted_at | When the full submission was sent | Timestamp | Automatic | Yes |

**Tables needed:**

| Table name | What it stores | Key fields |
|-----------|-----------------|-----------|
| ratings | One row per (IRO × criterion) answered or skipped, per participant session | assessment_id, iro_id, criterion_key, value, stakeholder_group, session_id, submitted_at |
| session_comments | One row per participant session's optional free-text "Any other comments?" field, captured on Submit | id, assessment_id, session_id, comment, submitted_at |

> `iros` (the topic list itself) and `assessments` (the survey record) are owned and written by Tool B — see that spec's Section 5. This tool only reads them (to render the questionnaire) and writes `ratings` and `session_comments`.

**File storage:** No — the only file involved (company logo) is uploaded by the consultant in Tool B and read here as a URL.

**Derived or calculated data:** No — this tool never computes severity, scores, or materiality. It only captures raw values. All aggregation happens in Tool B, reading the `ratings` table.

---

## Section 6 — Access and Permissions

Not applicable — no authentication on this tool (A1).

**RLS — who can read and write what:**

| Table | User type | Can read | Can insert | Can update | Can delete |
|-------|-----------|----------|------------|------------|------------|
| assessments | Unauthenticated (anon) | Own assessment only, via its link/slug | No | No | No |
| iros | Unauthenticated (anon) | Rows belonging to the assessment being viewed | No | No | No |
| ratings | Unauthenticated (anon) | No (write-only from this side) | Yes — scoped to the assessment being viewed | No | No |
| session_comments | Unauthenticated (anon) | No (write-only from this side) | Yes — scoped to the assessment being viewed | No | No |

---

## Section 7 — GDPR

**GDPR outcome:** Not applicable — confirmed that this tool collects no personal data through its forms. The only participant-supplied field is `stakeholder_group`, a fixed category (e.g. "Employees," "Investors / shareholders") — never a name, email, or other identifying detail.

---

## Section 8 — Screen and UI Structure

Verified against the built `ParticipantExperience.jsx` component.

### Welcome
- **Purpose:** Introduce the survey and set expectations before any question is asked.
- **What is visible:** The **client company's own logo, prominently centered at the top of every screen in the survey** (not just the Welcome card) — or, if none has been uploaded yet, a clear dashed-border placeholder box signalling where it will appear once set in Tool B; a title ("[Company name] sustainability survey" or "Sustainability survey" if no company name was set), the consultant-edited welcome text, and three fixed bullets — "Fully anonymous — no answer can be traced back to you," "About 15–20 minutes," "Not sure about something? Every question can be skipped." The Apus mark itself is demoted to a small, muted "Hosted on ✈ apus" credit at the very bottom of the page — the client sending the survey is the prominent brand, Apus is the host, not the sender.
- **User actions:** Click "Get started →"
- **What happens next:** Moves to Rating Criteria.

### Rating Criteria
- **Purpose:** Explain what each criterion means before the participant is asked to use it.
- **What is visible:** A "← Back" link; "How to rate each topic" heading; one or both of two blocks depending on the assessment's scope — "Impacts on the environment or society (positive or negative)" (Scale, Scope, Irremediability, Likelihood, each with its plain-language description) and/or "Financial risks and opportunities" (Magnitude, Likelihood, with descriptions).
- **User actions:** Click "← Back" (returns to Welcome) or "Continue →"
- **What happens next:** Moves to Stakeholder Group.

### Stakeholder Group
- **Purpose:** Capture which perspective the participant is answering from.
- **What is visible:** "← Back"; "Which group best describes you?"; two labeled option grids — "Impact perspective" (default options: Employees, Suppliers, Local community, Customers, Workers in the value chain, NGOs / civil society) and "Financial perspective" (default options: Investors / shareholders, Lenders / creditors, Executive management, Supervisory board, Analysts / rating agencies) — both lists are editable by the consultant in Tool B, so a real deployment may show different options per assessment.
- **User actions:** Select exactly one option; click "Continue →" (disabled until one is selected).
- **What happens next:** Moves to the first Topic rating page.

### Topic rating (repeats once per IRO in the assessment's scope)
- **Purpose:** Collect every rating criterion for one IRO.
- **What is visible:** "← Previous topic" (hidden on the first topic); "Topic X of Y"; a progress bar; an IRO-type badge ("Negative impact," "Positive impact," "Risk," or "Opportunity") plus an "Actual"/"Potential" badge; the topic name and description; then, stacked vertically, every applicable criterion for that IRO's type — each with its own large label, plain-language description, a row of 6 buttons (0–5), a live label under the row showing what the hovered or selected value means, and its own "Skip" control (with an info tooltip: "For anyone unsure or without direct expertise on this specific topic — it's fine to skip rather than guess"). A skipped criterion shows "Skipped — that's okay, not everyone has a view on every topic" with an "Answer instead" link to undo it.
- **User actions:** Answer or skip each criterion; go back to the previous topic; advance.
- **What happens next:** "Next topic →" (or "Continue →" on the last topic) is disabled until every criterion on the page has a value or is explicitly skipped. Advancing past the last topic moves to Submit.

### Submit
- **Purpose:** A final confirmation step before anything is sent, plus a chance to add anything not covered by the structured questions.
- **What is visible:** "That's everything"; a note that "Previous" can still be used to review answers; an **"Any other comments?"** free-text textarea (optional, labeled "anything you didn't get to say above, or context you think matters") positioned directly above the Submit button.
- **User actions:** Type an optional comment; click "Submit survey →"
- **What happens next:** Writes every answered/skipped row to the `ratings` table, tagged with the session's `stakeholder_group`, writes the comment text (if any) to `session_comments` — see Section 5 — then moves to Thank you.

### Thank you
- **Purpose:** Close the loop for the participant.
- **What is visible:** "Thank you for your participation," and a short note that the answers will feed into the company's materiality assessment alongside everyone else's.
- **User actions:** None — end of flow.

---

## Section 9 — Logic and Calculations

None. This tool performs no calculation — it captures a `value` (0–5) or `null` (skipped) per criterion and hands it to the database exactly as entered. All formulas (severity, override rule, impact/financial score, materiality) live in Tool B — see that spec's Section 9, which this tool's data feeds directly.

---

## Section 10 — Brand and Visual Direction

**Brand reference:** No brand skill file used during this build; described here directly, and deliberately distinct from the Apus admin dark theme.

- **Background:** Off-white (`#FAFAF8`), white cards (`#FFFFFF`) with a soft shadow, `#EFEFEC` border
- **Primary text:** `#111318`; secondary text: `#5B5B66` / `#6B6B76` / `#8A8A94`
- **Primary action colour:** `#1F9A63` (a slightly deeper emerald than the admin tool's `#5ED996`, chosen for AA-contrast on white)
- **Font:** Inter (body), Jost (wordmark) — same as the admin tool
- **Logo:** The client company's logo is the prominent brand shown at the top of every screen in the survey (not the Apus mark) — see the Welcome screen entry above. The Apus swift icon (`ApusLogoLight`, dark-on-light variant) appears only as a small "Hosted on" credit at the bottom of the page.

**Visual feel:** Clean, warm, and welcoming — generous white space, rounded 24px cards, soft shadows. Intentionally reads as a standalone, professional survey product, not as "a screen inside someone else's internal tool."

**Reference implementation — authoritative for UI/UX:** The working React/Vite prototype's source is included in this repo at `reference-prototype/` (specifically `src/components/ParticipantExperience.jsx` and `src/components/ApusLogoLight.jsx`, plus the shared logic in `src/lib/calc.js` and `src/lib/topics.js`). This spec describes structure and behavior in prose; the reference code is authoritative for exact layout, copy, spacing, colours, and interaction detail. Port this component faithfully — do not redesign from the prose description alone.

---

## Section 11 — API and Credentials

| Service | What it does in this tool | Key required | Where key is stored |
|---------|---------------------------|---------------|----------------------|
| Supabase | Reads assessment/IRO data, writes ratings | Anon key (public, browser-safe) | Netlify environment variable |

No other external service is used by this tool.

**Credentials readiness:**

| Credential | Status | Where to get it |
|-----------|--------|-------------------|
| Supabase anon key | Created by Claude Code with the project | Supabase dashboard → Project Settings → API |

---

## Section 12 — Out of Scope — Phase 2

| Deferred feature | Reason it is deferred |
|-------------------|--------------------------|
| Emailed distribution of the link | Not needed to validate the core tool — link is copy/pasted manually today |
| PDF/CSV export of raw responses | Not needed on the participant side — the consultant reviews results in Tool B |
| Multi-language support | Not needed to validate the core tool |
| Mobile-specific layout testing | The prototype was built and tested at desktop widths; needs a real responsive pass |
| True real-time sync of in-progress answers before Submit | The prototype only writes to the database on final submit — an in-progress autosave (so a closed tab doesn't lose partial answers) was not built |

---

## Section 13 — Acceptance Criteria

| # | What to verify | Expected result | Done? |
|---|------------------|--------------------|-------|
| 1 | Opening a valid assessment link loads the Welcome screen | Company logo/name, welcome text, and the three fixed bullets render correctly | [ ] |
| 2 | Rating Criteria screen adapts to the assessment's scope | Impact-only assessments show only the Impact block; Financial-only show only the Financial block; Full shows both | [ ] |
| 3 | Stakeholder Group requires a selection | "Continue" stays disabled until one option is chosen | [ ] |
| 4 | Each topic page shows the correct criteria for its IRO type | neg_impact shows 4 criteria (incl. Irremediability); pos_impact shows 3 (no Irremediability); risk/opportunity show 2 (Magnitude, Likelihood) | [ ] |
| 5 | Skip and "Answer instead" work per-criterion | Skipping one criterion doesn't affect the others on the same page; "Answer instead" clears the skip and re-enables the rating buttons | [ ] |
| 6 | "Next topic" is gated correctly | Stays disabled while any criterion on the page is neither answered nor skipped | [ ] |
| 7 | "← Previous topic" preserves prior answers | Going back and forward again shows the same values, not blank | [ ] |
| 8 | Submitting writes to Supabase | One `ratings` row exists per (IRO × criterion) for that session, tagged with the correct `assessment_id`, `stakeholder_group`, and `session_id` | [ ] |
| 9 | Tool deploys and is reachable at its own Netlify URL | Live URL loads correctly, independent of the Consultant Console's URL | [ ] |

---

## Section 14 — Build Path

**This tool's tier:** Tier 2

### Pre-build steps
- [ ] Tool Architect interview complete, this spec confirmed
- [ ] Project Governor run — CLAUDE.md and PROGRESS.md produced from this spec
- [ ] GitHub repo created for this tool specifically (separate from the Consultant Console's repo)
- [ ] product-spec.md, CLAUDE.md, PROGRESS.md uploaded to this repo's root
- [ ] Netlify connected to this repo (skip if Netlify MCP is active)
- [ ] Supabase project name confirmed with Anika before the build session

### Tier 2 — build session
- [ ] Open Claude Code in this tool's project folder
- [ ] Claude Code runs First Session Setup
- [ ] Claude Code reads product-spec.md, CLAUDE.md, PROGRESS.md
- [ ] Claude Code proposes the confirmed Supabase project name, waits for confirmation, creates the project via MCP
- [ ] Claude Code builds the `ratings` table (and `assessments`/`iros` if this is genuinely the first tool built in the stack) and RLS policies via MCP
- [ ] Claude Code creates docs/supabase-setup.md
- [ ] Claude Code builds the frontend from Section 8
- [ ] Test locally before deploying
- [ ] Deploy (automatic if Netlify MCP active, otherwise push to main + manual env vars)

---

## Section 15 — Open Questions

| Question | Who answers it | Blocking? |
|----------|-------------------|-----------|
| Is the Netlify MCP connector active in Claude Desktop? | Anika | No — affects deploy step only |
| Confirm the Supabase project name (`greenfriend-dma` proposed) | Anika | Yes — needed before the build session |
| Should partial answers autosave before Submit, so a closed tab doesn't lose progress? | Anika | No — can be added post-v1 |
| Real design intent for how the assessment link/slug maps to a route (e.g. `/survey/[slug]`) | Anika + Claude Code, at build time | Yes — needed to build routing |

---

## Section 16 — Tool Version History

| Version | Date | What changed in the tool |
|---------|------|------------------------------|
| v1.0 | 2026-09-10 | Initial build — documents the working React/Vite prototype's participant-facing flow (Welcome → Rating Criteria → Stakeholder Group → one-topic-per-page rating with per-criterion skip → Submit → Thank you). |
| v1.1 | 2026-09-16 | The client company's own logo (uploaded in Tool B) is now the prominent brand shown at the top of every screen — previously it only appeared inside the Welcome card while the Apus mark was the prominent header everywhere; Apus is now a small "Hosted on" credit at the page bottom instead. Added an optional "Any other comments?" free-text field on the Submit screen, written to a new `session_comments` table. |

---

*This spec is written for Claude Code. It assumes zero prior context.*
