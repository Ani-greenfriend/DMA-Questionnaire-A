import { useEffect, useState } from 'react';
import ParticipantExperience, { CRITERIA_FOR } from './components/ParticipantExperience';
import ApusLogoLight from './components/ApusLogoLight';
import { fetchAssessmentBySlug, submitRatings, submitSessionComment, incrementRespondents } from './lib/data';

function slugFromPath() {
  const match = window.location.pathname.match(/^\/survey\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

// One submission per browser per assessment — a plain localStorage flag, not
// an IP check: no server-side code needed, no IP address stored (simpler
// GDPR posture), and it's what most lightweight survey tools actually do.
// Clearing cookies/localStorage or switching browsers resets it — an accepted
// tradeoff for this tool's scale, not a security boundary.
function submittedKey(assessmentId) {
  return `apus_submitted_${assessmentId}`;
}
function hasAlreadySubmitted(assessmentId) {
  try {
    return localStorage.getItem(submittedKey(assessmentId)) === '1';
  } catch {
    return false; // private-browsing / blocked storage — fail open, don't block a real submission
  }
}
function markSubmitted(assessmentId) {
  try {
    localStorage.setItem(submittedKey(assessmentId), '1');
  } catch {
    // ignore — storage may be unavailable; the submission itself still succeeded
  }
}

function Centered({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#FAFAF8' }}>
      <div className="text-center max-w-sm">{children}</div>
    </div>
  );
}

export default function App() {
  const [slug] = useState(slugFromPath);
  const [status, setStatus] = useState('loading'); // loading | not-found | config-error | ready
  const [configError, setConfigError] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [iros, setIros] = useState([]);
  const [stakeholders, setStakeholders] = useState(null);
  const [sessionId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!slug) {
      setStatus('not-found');
      return;
    }
    let cancelled = false;
    fetchAssessmentBySlug(slug)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setStatus('not-found');
          return;
        }
        setAssessment(result.assessment);
        setIros(result.iros);
        setStakeholders(result.stakeholders);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setConfigError(err.message);
        setStatus('config-error');
      });
    return () => { cancelled = true; };
  }, [slug]);

  if (status === 'loading') {
    return (
      <Centered>
        <p className="text-[13px]" style={{ color: '#8A8A94' }}>Loading survey…</p>
      </Centered>
    );
  }

  if (status === 'config-error') {
    return (
      <Centered>
        <p className="text-[15px] font-semibold mb-1" style={{ color: '#111318' }}>Survey misconfigured</p>
        <p className="text-[12.5px] mb-6" style={{ color: '#8A8A94' }}>{configError}</p>
        <div className="flex items-center justify-center gap-1.5 opacity-60">
          <span className="text-[10.5px]" style={{ color: '#8A8A94' }}>Hosted on</span>
          <ApusLogoLight height={13} />
        </div>
      </Centered>
    );
  }

  if (status === 'not-found') {
    return (
      <Centered>
        <p className="text-[15px] font-semibold mb-1" style={{ color: '#111318' }}>Survey not found</p>
        <p className="text-[12.5px] mb-6" style={{ color: '#8A8A94' }}>
          This link doesn't match a live assessment. Check the link you were given, or contact whoever sent it to you.
        </p>
        <div className="flex items-center justify-center gap-1.5 opacity-60">
          <span className="text-[10.5px]" style={{ color: '#8A8A94' }}>Hosted on</span>
          <ApusLogoLight height={13} />
        </div>
      </Centered>
    );
  }

  if (hasAlreadySubmitted(assessment.id)) {
    return (
      <Centered>
        <p className="text-[15px] font-semibold mb-1" style={{ color: '#111318' }}>You've already submitted this survey</p>
        <p className="text-[12.5px] mb-6" style={{ color: '#8A8A94' }}>
          Thanks — your answers were recorded. This link only accepts one response per person.
        </p>
        <div className="flex items-center justify-center gap-1.5 opacity-60">
          <span className="text-[10.5px]" style={{ color: '#8A8A94' }}>Hosted on</span>
          <ApusLogoLight height={13} />
        </div>
      </Centered>
    );
  }

  const handleSubmit = (answers, relevantIros, stakeholderGroup, comment) => {
    const rows = [];
    for (const iro of relevantIros) {
      for (const c of CRITERIA_FOR[iro.iroType]) {
        const raw = answers[`${iro.id}::${c.key}`];
        rows.push({
          assessment_id: assessment.id,
          iro_id: iro.id,
          criterion_key: c.key,
          value: raw === 'skipped' ? null : raw,
          stakeholder_group: stakeholderGroup,
          session_id: sessionId,
        });
      }
    }
    submitRatings(rows).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to submit ratings:', err);
    });

    if (comment && comment.trim()) {
      submitSessionComment({
        assessment_id: assessment.id,
        session_id: sessionId,
        comment: comment.trim(),
      }).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to submit comment:', err);
      });
    }

    // Mark this browser as done regardless of whether the count below
    // succeeds — the real ratings rows above are what matters, and a failed
    // counter increment shouldn't let someone spam-refresh into a real
    // duplicate submission of the actual answers.
    markSubmitted(assessment.id);
    incrementRespondents(assessment.id).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to increment respondent count:', err);
    });
  };

  return (
    <ParticipantExperience
      mode={assessment.mode}
      perspectiveFilter={assessment.perspectiveFilter}
      iros={iros}
      welcomeText={assessment.welcomeText}
      stakeholders={stakeholders}
      logo={assessment.logo}
      companyName={assessment.companyName}
      onSubmit={handleSubmit}
    />
  );
}
