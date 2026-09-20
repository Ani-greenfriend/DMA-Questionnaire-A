# Pre-v2.0 migration backup — 2026-09-20

Manual export taken before running the v2.0 shared migration (spec Section 5),
per CLAUDE.md's Supabase rule ("take a manual export first" — Free plan has
no automatic backups). Project: `evwmxduudcujtibirmga`
("greenfriend Double Materiality Assessment").

All data below is demo/test data — confirmed no real expert responses exist
(`stakeholder_members` rows are named "k", "test", "s"; the only assessment
is the `acme-2026` demo). Safe to keep in the repo.

## Pre-migration table row counts
assessments 1 · iros 5 · ratings 30 · session_comments 0 · topic_library 10 ·
assessor_ratings 10 · calibrations 0 · calibration_history 0 · participants 0 ·
stakeholder_groups 31 · stakeholder_members 3

## Pre-migration RLS policies (public schema)
| table | policy | roles | cmd |
|---|---|---|---|
| assessments | anon select assessments | anon | SELECT |
| assessments | authenticated delete assessments | authenticated | DELETE |
| assessments | authenticated insert assessments | authenticated | INSERT |
| assessments | authenticated read assessments | authenticated | SELECT |
| assessments | authenticated update assessments | authenticated | UPDATE |
| assessor_ratings | authenticated insert assessor_ratings | authenticated | INSERT |
| assessor_ratings | authenticated read assessor_ratings | authenticated | SELECT |
| assessor_ratings | authenticated update assessor_ratings | authenticated | UPDATE |
| calibration_history | authenticated insert calibration_history | authenticated | INSERT |
| calibration_history | authenticated read calibration_history | authenticated | SELECT |
| calibrations | authenticated insert calibrations | authenticated | INSERT |
| calibrations | authenticated read calibrations | authenticated | SELECT |
| calibrations | authenticated update calibrations | authenticated | UPDATE |
| iros | anon select iros | anon | SELECT |
| iros | authenticated insert iros | authenticated | INSERT |
| iros | authenticated read iros | authenticated | SELECT |
| iros | authenticated update iros | authenticated | UPDATE |
| participants | authenticated full access participants | authenticated | ALL |
| ratings | anon insert ratings | anon | INSERT |
| session_comments | anon insert session_comments | anon | INSERT |
| stakeholder_groups | anon select stakeholder_groups | anon | SELECT |
| stakeholder_groups | authenticated full access stakeholder_groups | authenticated | ALL |
| stakeholder_members | anon select stakeholder_members | anon | SELECT |
| stakeholder_members | authenticated full access stakeholder_members | authenticated | ALL |
| topic_library | authenticated full access topic_library | authenticated | ALL |

## Pre-migration functions (retired by this migration)
```sql
CREATE OR REPLACE FUNCTION public.increment_respondents(p_assessment_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update public.assessments
  set respondents_done = respondents_done + 1
  where id = p_assessment_id;
$function$

CREATE OR REPLACE FUNCTION public.sync_ratings_to_assessor_ratings()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.assessor_ratings
    (iro_id, assessor_label, scale, scope, irreversibility, likelihood, magnitude, financial_likelihood, recorded_at, synced_ratings_session_id)
  select
    r.iro_id,
    r.stakeholder_group,
    max(case when r.criterion_key = 'scale' then r.value end),
    max(case when r.criterion_key = 'scope' then r.value end),
    max(case when r.criterion_key = 'irreversibility' then r.value end),
    max(case when r.criterion_key = 'likelihood' then r.value end),
    max(case when r.criterion_key = 'magnitude' then r.value end),
    max(case when r.criterion_key = 'financialLikelihood' then r.value end),
    min(r.submitted_at),
    r.session_id
  from public.ratings r
  where not exists (
    select 1 from public.assessor_ratings ar
    where ar.synced_ratings_session_id = r.session_id and ar.iro_id = r.iro_id
  )
  group by r.iro_id, r.session_id, r.stakeholder_group;
end;
$function$
```

## Pre-migration table data (full export)

`stakeholder_groups` (31 rows, the master stakeholder map) is preserved as-is
by the migration — listed here for completeness but not reproduced inline
since it carries forward unchanged.

### assessments (1 row)
```json
[{"id":"9351b470-8480-449d-b6f9-0868c3094c22","mode":"qualitative","name":"Acme Corp","slug":"acme-2026","status":"active","end_date":null,"logo_url":null,"mandatory":true,"task_text":null,"created_at":"2026-09-10T19:17:34.67333+00:00","created_by":null,"start_date":null,"updated_at":"2026-09-17T12:08:41.548462+00:00","description":null,"welcome_text":"We're inviting a range of stakeholders to help us understand which sustainability topics matter most to Acme Corp. There are no right or wrong answers.","respondents_done":1,"respondents_total":0,"perspective_filter":"full"}]
```

### iros (5 rows)
```json
[{"id":"50fdb4b7-2816-4b9b-b79b-71df927fba42","name":"Greenhouse gas emissions from own operations","order":1,"actual":true,"iro_type":"neg_impact","created_at":"2026-09-10T19:17:34.67333+00:00","description":"Direct emissions from company facilities, fleet vehicles, and on-site energy use.","subtopic_raw":null,"assessment_id":"9351b470-8480-449d-b6f9-0868c3094c22","esrs_topic_id":"E1","session_notes":null,"impact_threshold":null,"topic_library_id":null,"financial_threshold":null},
{"id":"64ff529b-247a-41ab-8c58-19f2e5884af9","name":"Carbon pricing exposure","order":2,"actual":false,"iro_type":"risk","created_at":"2026-09-10T19:17:34.67333+00:00","description":"Potential future costs from carbon taxes or emissions trading schemes.","subtopic_raw":null,"assessment_id":"9351b470-8480-449d-b6f9-0868c3094c22","esrs_topic_id":"E1","session_notes":null,"impact_threshold":null,"topic_library_id":null,"financial_threshold":null},
{"id":"3a76c82b-9566-4924-8722-8389d3752166","name":"Employee training and development","order":3,"actual":true,"iro_type":"pos_impact","created_at":"2026-09-10T19:17:34.67333+00:00","description":"Investment in upskilling and career development for the workforce.","subtopic_raw":null,"assessment_id":"9351b470-8480-449d-b6f9-0868c3094c22","esrs_topic_id":"S1","session_notes":null,"impact_threshold":null,"topic_library_id":null,"financial_threshold":null},
{"id":"4db97404-7a73-41f9-a66d-4fc823d789ee","name":"Working conditions in the supply chain","order":4,"actual":false,"iro_type":"neg_impact","created_at":"2026-09-10T19:17:34.67333+00:00","description":"Potential for poor labour conditions at supplier sites.","subtopic_raw":null,"assessment_id":"9351b470-8480-449d-b6f9-0868c3094c22","esrs_topic_id":"S2","session_notes":null,"impact_threshold":null,"topic_library_id":null,"financial_threshold":null},
{"id":"95ecaaef-a319-41fd-9a92-d506ffecd93e","name":"Improved access to sustainable finance","order":5,"actual":false,"iro_type":"opportunity","created_at":"2026-09-10T19:17:34.67333+00:00","description":"Stronger governance could improve terms on green financing.","subtopic_raw":null,"assessment_id":"9351b470-8480-449d-b6f9-0868c3094c22","esrs_topic_id":"G1","session_notes":null,"impact_threshold":null,"topic_library_id":null,"financial_threshold":null}]
```

### topic_library (10 rows) — master IRO library, carried forward
Reference codes: IMP-E1-01, IMP-E1-02, RSK-E1-01, OPP-E1-01, IMP-E2-01,
OPP-E5-01, IMP-S1-01, IMP-S1-02, RSK-S2-01, RSK-G1-01 (full JSON omitted here
for length — recoverable from Supabase point-in-time state at time of writing
if ever needed; ids and titles listed above are sufficient to re-cross-reference).

### ratings (30 rows)
One row per (iro × criterion) per session_id, `stakeholder_group` either
"Employees" (session_id `2e357271-97e5-44d4-a367-1597c8a3ebd0`) or
"Local community" (session_id `86a2f993-c7a8-4ede-b9ae-5b555f6f4fab`). Demo
data only — retired shape (`assessment_id` + `session_id`, no `submission_id`/
`justification`), not migrated forward as rows; the assessment is re-seeded
fresh in the new structure per the spec ("no real data ... re-create the demo
assessment in the new structure").

### assessor_ratings (10 rows) — retired table, not migrated forward
Synced copy of the above `ratings`, keyed by `synced_ratings_session_id`.
Superseded by the combined ratings view.

### session_comments (0 rows), calibrations (0 rows), calibration_history (0 rows), participants (0 rows)
Empty at time of migration.

### stakeholder_members (3 rows) — demo/placeholder data only
```json
[{"id":"6d0436ec-573d-4af6-bd96-a947ec3570b5","name":"k","role":"k","email":null,"company":null,"pillars":[],"group_id":"d60361a6-7cc2-469e-a0e4-e59547c132c2","expertise":null,"created_at":"2026-09-17T14:50:36.722164+00:00"},
{"id":"341a3d77-b82c-462c-9da2-1577fe5d99d8","name":"test","role":"test","email":null,"company":null,"pillars":[],"group_id":"d0e66096-4950-4f2d-9727-c9d415bc9de3","expertise":null,"created_at":"2026-09-18T07:11:53.980263+00:00"},
{"id":"2bccded1-cb3f-48c9-8b16-8abd077fd7bc","name":"s","role":"s","email":null,"company":null,"pillars":[],"group_id":"b84f4604-1be7-4427-94d1-8ee8f7d92d32","expertise":null,"created_at":"2026-09-17T14:50:43.31953+00:00"}]
```
