# PROGRESS — Apus DMA — Participant Questionnaire

> Claude Code: read this file at the start of every session, before touching
> anything. Update it at every save point. Replace content — do not append.
> History lives in git.

**Session:** 0 — build not started
**Last updated:** 2026-09-10 — by Project Governor, pre-build
**Live URL:** none yet

## Current state
Nothing built. Repo contains CLAUDE.md, PROGRESS.md, docs/product-spec.md, reference-prototype/ (working prototype source — see its README.md).

## Last session
None — the first build session has not happened yet.

## Remaining work
- [ ] First Session Setup: create docs/ (already present in this repo — confirm nothing else needs moving), commit (see CLAUDE.md Session Protocol)
- [ ] Builder: upgrade the Supabase project to Pro in the dashboard (manual billing step) before client use
- [ ] Create Supabase project "greenfriend-dma" via MCP — confirm the name with the builder first
- [ ] Build all tables and RLS policies, then write docs/supabase-setup.md
- [ ] Build Welcome — logo/name, welcome text, three fixed reassurance bullets
- [ ] Build Rating Criteria — Impact and/or Financial criteria blocks depending on assessment scope
- [ ] Build Stakeholder Group — single-select from two labeled option lists
- [ ] Build Topic rating — one topic per page, all applicable criteria stacked, per-criterion skip, progress bar, back navigation
- [ ] Build Submit — final confirmation before writing ratings
- [ ] Build Thank you — closing screen
- [ ] Local test pass — full walkthrough of every view before deploying
- [ ] Acceptance criteria pass — verify every criterion in spec Section "Acceptance Criteria" before deploy
- [ ] Deploy to Netlify — builder adds environment variables in the Netlify dashboard if Netlify MCP is not active

## Build decisions
None yet.

## Known issues
- Netlify MCP connector status was unconfirmed at spec time — confirm with the builder in session 1.
- The prototype's `ratings` shape (one row per criterion, supporting a null "skipped" value) needs to be reconciled against Tool B's `assessor_ratings` table — see product-spec.md Section 15, Open Questions. Resolve before finalizing the `ratings` table schema.

## Notes for next session
None.
