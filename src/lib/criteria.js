// Anchor labels — per the official reference scale definitions. This tool
// never calculates a score from these (see calc.js in Tool B) — it only
// captures the raw 0-5 value and shows the matching label as the expert
// hovers/selects.
export const SCALE_LABELS = ['None', 'Minimal', 'Low', 'Medium', 'High', 'Very High'];
export const SCOPE_LABELS = ['None', 'Local', 'Regional', 'National', 'Continental', 'Global'];
export const IRREVERSIBILITY_LABELS = ['None', 'Easily remediable', 'Remediable with cost', 'Difficult', 'Very difficult', 'Irreversible'];
export const LIKELIHOOD_LABELS = ['None', 'Very unlikely & long-term', 'Unlikely & long-term', 'Likely & mid-term', 'Probable & short-term', 'Certain or already occurred'];
export const RISK_MAGNITUDE_LABELS = ['None', 'Minimal', 'Noticeable impact', 'Impact on business', 'High financial loss', 'Threat to operations'];
export const OPPORTUNITY_MAGNITUDE_LABELS = ['None', 'Minimal', 'Noticeable financial opportunity', 'Positive impact on business', 'High financial gains', 'Growth opportunity of significance'];

const SCALE = { key: 'scale', label: 'Scale', description: 'How big and severe the effect is — from barely noticeable to very severe.', labels: SCALE_LABELS };
const SCOPE = { key: 'scope', label: 'Scope', description: 'How far the effect reaches — a single site, or something felt nationally or globally.', labels: SCOPE_LABELS };
const IRREVERSIBILITY = { key: 'irreversibility', label: 'Irremediability', description: 'How hard it would be to undo or fix — and how long that would take.', labels: IRREVERSIBILITY_LABELS };
const LIKELIHOOD = { key: 'likelihood', label: 'Likelihood', description: 'How probable this is to happen. A 4-5 means it is already happening or about to. A 1-3 means it is a possible future scenario.', labels: LIKELIHOOD_LABELS };
const MAGNITUDE_RISK = { key: 'magnitude', label: 'Magnitude', description: 'How much this could affect the company’s financial performance and position — think in terms of a share of EBITDA, if you know it.', labels: RISK_MAGNITUDE_LABELS };
const MAGNITUDE_OPPORTUNITY = { key: 'magnitude', label: 'Magnitude', description: 'How much this could positively affect the company’s financial performance and position.', labels: OPPORTUNITY_MAGNITUDE_LABELS };

// Explanation-screen reference lists (Rating Criteria screen shows these
// generically, before the expert sees any specific topic).
export const IMPACT_CRITERIA_REFERENCE = [SCALE, SCOPE, IRREVERSIBILITY, LIKELIHOOD];
export const FINANCIAL_CRITERIA_REFERENCE = [MAGNITUDE_RISK, LIKELIHOOD];

export function hasImpactAxis(iroType) {
  return iroType === 'neg_impact' || iroType === 'pos_impact';
}

// Which criteria a topic page shows — product-spec.md Section 9's display
// rules table. Not a calculation: just which questions to ask.
export function criteriaForIro(iro) {
  if (iro.iroType === 'neg_impact') {
    // Actual, or flagged as a potential human rights impact: likelihood is
    // not asked (already occurring, or severity takes precedence).
    if (iro.actual || iro.humanRightsImpact) return [SCALE, SCOPE, IRREVERSIBILITY];
    return [SCALE, SCOPE, IRREVERSIBILITY, LIKELIHOOD];
  }
  if (iro.iroType === 'pos_impact') {
    if (iro.actual) return [SCALE, SCOPE];
    return [SCALE, SCOPE, LIKELIHOOD];
  }
  // risk or opportunity
  return [iro.iroType === 'opportunity' ? MAGNITUDE_OPPORTUNITY : MAGNITUDE_RISK, LIKELIHOOD];
}
