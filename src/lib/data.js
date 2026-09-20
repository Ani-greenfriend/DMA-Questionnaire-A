import { supabase, supabaseConfigError } from './supabaseClient';

function assertReady() {
  if (supabaseConfigError) throw new Error(supabaseConfigError);
}

// Narrow lookup by link code — the only way anon can ever reach an
// invitation. Anon has NO table-level access to `invitations` at all (see
// docs/supabase-setup.md): this calls a SECURITY DEFINER function that takes
// the code as an input and returns just id/assessment_id/status/submitted_at
// for the one matching row. The code is a secret you must already hold, not
// a value that can be listed or enumerated — there is no anon SELECT policy
// on the table that could leak the full set of codes.
export async function lookupInvitationByCode(linkCode) {
  assertReady();
  const { data, error } = await supabase.rpc('lookup_invitation', { p_link_code: linkCode });
  if (error) throw new Error(`invitation lookup failed: ${error.message} (code: ${error.code})`);
  return data?.[0] ?? null;
}

export async function markInvitationOpened(linkCode) {
  assertReady();
  // Only bumps invited -> opened; a saved/submitted invitation is left alone
  // (the function's own WHERE ... and status = 'invited' guard).
  const { error } = await supabase.rpc('mark_invitation_opened', { p_link_code: linkCode });
  if (error) throw new Error(`invitation update failed: ${error.message}`);
}

// Everything the survey needs to render, for the assessment behind one
// invitation: assessment copy/settings, the client's name+logo (via the
// cycle), the cycle's ESRS version and stage (for the closed-survey check),
// this assessment's IRO snapshot, and the master stakeholder group list.
export async function fetchSurveyContext(assessmentId) {
  assertReady();

  const { data: assessment, error: aErr } = await supabase
    .from('assessments')
    .select('id, cycle_id, type, name, description, perspective_filter, slug, welcome_text, task_text, mandatory, justification_mode, status, start_date, end_date')
    .eq('id', assessmentId)
    .single();
  if (aErr) throw new Error(`assessment fetch failed: ${aErr.message} (code: ${aErr.code})`);

  const { data: cycle, error: cErr } = await supabase
    .from('cycles')
    .select('id, esrs_version, stage, client_id')
    .eq('id', assessment.cycle_id)
    .single();
  if (cErr) throw new Error(`cycle fetch failed: ${cErr.message} (code: ${cErr.code})`);

  const { data: client, error: clErr } = await supabase
    .from('clients')
    .select('name, logo_url')
    .eq('id', cycle.client_id)
    .single();
  if (clErr) throw new Error(`client fetch failed: ${clErr.message} (code: ${clErr.code})`);

  const { data: iroRows, error: iErr } = await supabase
    .from('iros')
    .select('id, esrs_topic_id, name, description, iro_type, actual, time_horizon, potential_human_rights_impact, order')
    .eq('assessment_id', assessmentId)
    .order('order', { ascending: true });
  if (iErr) throw new Error(`iros fetch failed: ${iErr.message} (code: ${iErr.code})`);

  const { data: groupRows, error: gErr } = await supabase
    .from('stakeholder_groups')
    .select('id, name, type, order')
    .order('order', { ascending: true });
  if (gErr) throw new Error(`stakeholder_groups fetch failed: ${gErr.message} (code: ${gErr.code})`);

  return {
    assessment: {
      id: assessment.id,
      type: assessment.type,
      companyName: client.name,
      logo: client.logo_url,
      perspectiveFilter: assessment.perspective_filter,
      slug: assessment.slug,
      welcomeText: assessment.welcome_text,
      taskText: assessment.task_text,
      mandatory: assessment.mandatory,
      justificationMode: assessment.justification_mode,
      status: assessment.status,
      endDate: assessment.end_date,
      cycleStage: cycle.stage,
      esrsVersion: cycle.esrs_version,
    },
    iros: iroRows.map((r) => ({
      id: r.id,
      topic: r.esrs_topic_id,
      name: r.name,
      description: r.description,
      iroType: r.iro_type,
      actual: r.actual,
      timeHorizon: r.time_horizon,
      humanRightsImpact: r.potential_human_rights_impact,
    })),
    stakeholderGroups: groupRows.filter((g) => g.type === 'impact' || g.type === 'silent' || g.type === 'financial'),
  };
}

// Section 8: "survey closed ... when the assessment's cycle is no longer
// accepting responses (stage Signed off, or assessment end date passed)."
export function isSurveyClosed(assessment) {
  if (assessment.cycleStage === 'signed_off') return true;
  if (assessment.endDate && new Date(assessment.endDate) < new Date()) return true;
  return false;
}

// Anon has no table-level access to submissions/ratings/topic_justifications
// either (see docs/supabase-setup.md) — every draft read/write goes through
// a SECURITY DEFINER function keyed by link_code, so a browser can only ever
// reach the one draft its own secret link resolves to.
export async function fetchDraft(linkCode) {
  assertReady();
  const { data, error } = await supabase.rpc('get_draft', { p_link_code: linkCode });
  if (error) throw new Error(`draft fetch failed: ${error.message} (code: ${error.code})`);
  if (!data) return null;
  return { submission: data.submission, ratings: data.ratings, topicJustifications: data.topic_justifications };
}

export async function createDraft({
  linkCode, stakeholderGroup, perspective, expertiseTopics,
  expertiseExplanation, title, basisForRepresentation,
}) {
  assertReady();
  const { data, error } = await supabase.rpc('create_draft', {
    p_link_code: linkCode,
    p_stakeholder_group: stakeholderGroup,
    p_perspective: perspective,
    p_expertise_topics: expertiseTopics,
    p_expertise_explanation: expertiseExplanation,
    p_title: title || null,
    p_basis_for_representation: basisForRepresentation || null,
  });
  if (error) throw new Error(`draft creation failed: ${error.message} (code: ${error.code})`);
  return data;
}

// Draft progress saves (every "Next topic", "Previous topic" and "Save and
// continue later") don't need the all-or-nothing guarantee that Submit
// does — an interrupted draft save just leaves the draft slightly behind,
// which is fine since drafts never count in results.
export async function saveProgress({ linkCode, currentTopicIndex, ratings, topicJustifications }) {
  assertReady();
  const { error } = await supabase.rpc('save_progress', {
    p_link_code: linkCode,
    p_current_topic_index: currentTopicIndex,
    p_ratings: ratings,
    p_topic_justifications: topicJustifications,
  });
  if (error) throw new Error(`progress save failed: ${error.message} (code: ${error.code})`);
}

// The only all-or-nothing write in this tool: one Postgres function call,
// one transaction (see the `submit_survey_response` function in
// docs/supabase-setup.md) — every rating row and justification with status
// set to submitted, or nothing at all.
export async function submitFinal({ linkCode, overallComment, ratings, topicJustifications }) {
  assertReady();
  const { data, error } = await supabase.rpc('submit_survey_response', {
    p_link_code: linkCode,
    p_overall_comment: overallComment || '',
    p_ratings: ratings,
    p_topic_justifications: topicJustifications,
  });
  if (error) throw new Error(`submit failed: ${error.message} (code: ${error.code})`);
  return data;
}
