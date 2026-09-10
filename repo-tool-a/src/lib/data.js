import { supabase } from './supabaseClient';

// Stakeholder Group options are meant to live in `stakeholder_options`, a table
// owned by the Consultant Console (Tool B), which hasn't been built yet. Once it
// exists this tool only ever reads it (never writes/alters it, per CLAUDE.md).
// Until then, fall back to the spec's default option lists.
const DEFAULT_STAKEHOLDERS = {
  impact: ['Employees', 'Suppliers', 'Local community', 'Customers', 'Workers in the value chain', 'NGOs / civil society'],
  financial: ['Investors / shareholders', 'Lenders / creditors', 'Executive management', 'Supervisory board', 'Analysts / rating agencies'],
};

async function fetchStakeholderOptions(assessmentId) {
  const { data, error } = await supabase
    .from('stakeholder_options')
    .select('perspective, label')
    .eq('assessment_id', assessmentId);
  if (error || !data?.length) return DEFAULT_STAKEHOLDERS;
  return {
    impact: data.filter((r) => r.perspective === 'impact').map((r) => r.label),
    financial: data.filter((r) => r.perspective === 'financial').map((r) => r.label),
  };
}

export async function fetchAssessmentBySlug(slug) {
  const { data: assessment, error } = await supabase
    .from('assessments')
    .select('id, name, mode, perspective_filter, welcome_text, logo_url, mandatory')
    .eq('slug', slug)
    .single();
  if (error || !assessment) return null;

  const { data: iroRows, error: iroError } = await supabase
    .from('iros')
    .select('id, esrs_topic_id, name, description, iro_type, actual')
    .eq('assessment_id', assessment.id)
    .order('order', { ascending: true });
  if (iroError) return null;

  const iros = iroRows.map((r) => ({
    id: r.id,
    topic: r.esrs_topic_id,
    name: r.name,
    description: r.description,
    iroType: r.iro_type,
    actual: r.actual,
  }));

  const stakeholders = await fetchStakeholderOptions(assessment.id);

  return {
    assessment: {
      id: assessment.id,
      slug,
      companyName: assessment.name,
      mode: assessment.mode,
      perspectiveFilter: assessment.perspective_filter,
      welcomeText: assessment.welcome_text,
      logo: assessment.logo_url,
      mandatory: assessment.mandatory,
    },
    iros,
    stakeholders,
  };
}

export async function submitRatings(rows) {
  const { error } = await supabase.from('ratings').insert(rows);
  if (error) throw error;
  return { ok: true };
}
