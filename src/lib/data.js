import { supabase, supabaseConfigError } from './supabaseClient';

function assertReady() {
  if (supabaseConfigError) throw new Error(supabaseConfigError);
}

// Narrow lookup by link code — the only way anon can ever reach an
// invitation row. The anon column grant on `invitations` (see
// docs/supabase-setup.md) only exposes id/assessment_id/status/submitted_at;
// name and email are never selectable from here.
export async function lookupInvitationByCode(linkCode) {
  assertReady();
  const { data, error } = await supabase
    .from('invitations')
    .select('id, assessment_id, status, submitted_at')
    .eq('link_code', linkCode)
    .maybeSingle();
  if (error) throw new Error(`invitation lookup failed: ${error.message} (code: ${error.code})`);
  return data;
}

export async function markInvitationOpened(invitationId) {
  assertReady();
  // Only bumps invited -> opened; a saved/submitted invitation is left alone
  // (the .eq('status', 'invited') guard prevents regressing a later status).
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'opened', opened_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('status', 'invited');
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

export async function fetchDraft(invitationId) {
  assertReady();
  const { data: submission, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('invitation_id', invitationId)
    .maybeSingle();
  if (error) throw new Error(`submission fetch failed: ${error.message} (code: ${error.code})`);
  if (!submission) return null;

  const { data: ratingRows, error: rErr } = await supabase
    .from('ratings')
    .select('iro_id, criterion_key, value, justification')
    .eq('submission_id', submission.id);
  if (rErr) throw new Error(`ratings fetch failed: ${rErr.message} (code: ${rErr.code})`);

  const { data: tjRows, error: tErr } = await supabase
    .from('topic_justifications')
    .select('iro_id, justification')
    .eq('submission_id', submission.id);
  if (tErr) throw new Error(`topic_justifications fetch failed: ${tErr.message} (code: ${tErr.code})`);

  return { submission, ratings: ratingRows, topicJustifications: tjRows };
}

export async function createDraft({
  assessmentId, invitationId, stakeholderGroup, perspective, expertiseTopics,
  expertiseExplanation, title, basisForRepresentation, consentGivenAt,
}) {
  assertReady();
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      assessment_id: assessmentId,
      source: 'expert_survey',
      invitation_id: invitationId,
      status: 'draft',
      stakeholder_group: stakeholderGroup,
      perspective,
      expertise_topics: expertiseTopics,
      expertise_explanation: expertiseExplanation,
      title: title || null,
      basis_for_representation: basisForRepresentation || null,
      consent_given_at: consentGivenAt,
      current_topic_index: 0,
    })
    .select()
    .single();
  if (error) throw new Error(`draft creation failed: ${error.message} (code: ${error.code})`);
  return data;
}

// Draft progress saves (every "Next topic", "Previous topic" and "Save and
// continue later") don't need the all-or-nothing guarantee that Submit
// does — an interrupted draft save just leaves the draft slightly behind,
// which is fine since drafts never count in results.
export async function saveProgress({ submissionId, invitationId, currentTopicIndex, ratings, topicJustifications, overallComment }) {
  assertReady();
  const now = new Date().toISOString();

  if (ratings.length) {
    const { error } = await supabase
      .from('ratings')
      .upsert(ratings.map((r) => ({ submission_id: submissionId, ...r })), { onConflict: 'submission_id,iro_id,criterion_key' });
    if (error) throw new Error(`ratings save failed: ${error.message} (code: ${error.code})`);
  }
  if (topicJustifications.length) {
    const { error } = await supabase
      .from('topic_justifications')
      .upsert(topicJustifications.map((t) => ({ submission_id: submissionId, ...t })), { onConflict: 'submission_id,iro_id' });
    if (error) throw new Error(`topic justification save failed: ${error.message} (code: ${error.code})`);
  }

  const patch = { current_topic_index: currentTopicIndex, last_saved_at: now };
  if (overallComment !== undefined) patch.overall_comment = overallComment;
  const { error: sErr } = await supabase.from('submissions').update(patch).eq('id', submissionId);
  if (sErr) throw new Error(`submission save failed: ${sErr.message} (code: ${sErr.code})`);

  const { error: iErr } = await supabase
    .from('invitations')
    .update({ status: 'saved', last_saved_at: now })
    .eq('id', invitationId);
  if (iErr) throw new Error(`invitation save failed: ${iErr.message} (code: ${iErr.code})`);
}

// The only all-or-nothing write in this tool: one Postgres function call,
// one transaction (see the `submit_survey_response` function in
// docs/supabase-setup.md) — every rating row and justification with status
// set to submitted, or nothing at all.
export async function submitFinal({ invitationId, overallComment, ratings, topicJustifications }) {
  assertReady();
  const { data, error } = await supabase.rpc('submit_survey_response', {
    p_invitation_id: invitationId,
    p_overall_comment: overallComment || '',
    p_ratings: ratings,
    p_topic_justifications: topicJustifications,
  });
  if (error) throw new Error(`submit failed: ${error.message} (code: ${error.code})`);
  return data;
}
