// Data layer for the Participant Questionnaire.
//
// This currently returns mock, in-memory data so the frontend can be built
// and exercised on its own. `fetchAssessmentBySlug` and `submitRatings` are
// the two functions to swap for real Supabase queries once the backend is
// wired up — their shapes already match what CLAUDE.md's schema describes
// (assessments/iros read, ratings written) so App.jsx shouldn't need to change.

const DEFAULT_STAKEHOLDERS = {
  impact: ['Employees', 'Suppliers', 'Local community', 'Customers', 'Workers in the value chain', 'NGOs / civil society'],
  financial: ['Investors / shareholders', 'Lenders / creditors', 'Executive management', 'Supervisory board', 'Analysts / rating agencies'],
};

const MOCK_ASSESSMENTS = {
  'acme-2026': {
    id: 'mock-assessment-1',
    slug: 'acme-2026',
    companyName: 'Acme Corp',
    perspectiveFilter: 'full',
    mandatory: true,
    welcomeText:
      "We're inviting a range of stakeholders to help us understand which sustainability topics matter most to Acme Corp and the people affected by our work. There are no right or wrong answers — we're interested in your honest perspective.",
    logo: null,
  },
};

const MOCK_IROS = {
  'mock-assessment-1': [
    { id: 'iro-1', topic: 'E1', iroType: 'neg_impact', actual: true, name: 'Greenhouse gas emissions from own operations', description: 'Direct emissions from company facilities, fleet vehicles, and on-site energy use.' },
    { id: 'iro-2', topic: 'E1', iroType: 'risk', actual: false, name: 'Carbon pricing exposure', description: 'Potential future costs from carbon taxes or emissions trading schemes affecting the business.' },
    { id: 'iro-3', topic: 'S1', iroType: 'pos_impact', actual: true, name: 'Employee training and development', description: 'Investment in upskilling and career development for the workforce.' },
    { id: 'iro-4', topic: 'S2', iroType: 'neg_impact', actual: false, name: 'Working conditions in the supply chain', description: 'Potential for poor labour conditions at supplier and sub-supplier sites.' },
    { id: 'iro-5', topic: 'G1', iroType: 'opportunity', actual: false, name: 'Improved access to sustainable finance', description: 'Stronger governance and disclosure could improve terms on green financing.' },
  ],
};

export async function fetchAssessmentBySlug(slug) {
  const assessment = MOCK_ASSESSMENTS[slug];
  if (!assessment) return null;
  const iros = MOCK_IROS[assessment.id] ?? [];
  return { assessment, iros, stakeholders: DEFAULT_STAKEHOLDERS };
}

export async function submitRatings({ assessmentId, sessionId, stakeholderGroup, rows }) {
  // eslint-disable-next-line no-console
  console.log('[mock submit] would insert into `ratings`:', { assessmentId, sessionId, stakeholderGroup, rows });
  return { ok: true };
}
