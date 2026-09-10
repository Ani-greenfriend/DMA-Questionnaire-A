import { useEffect, useState } from 'react';
import ParticipantExperience, { CRITERIA_FOR } from './components/ParticipantExperience';
import ApusLogoLight from './components/ApusLogoLight';
import { fetchAssessmentBySlug, submitRatings } from './lib/data';

function slugFromPath() {
  const match = window.location.pathname.match(/^\/survey\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
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
  const [status, setStatus] = useState('loading'); // loading | not-found | ready
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
    fetchAssessmentBySlug(slug).then((result) => {
      if (cancelled) return;
      if (!result) {
        setStatus('not-found');
        return;
      }
      setAssessment(result.assessment);
      setIros(result.iros);
      setStakeholders(result.stakeholders);
      setStatus('ready');
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

  if (status === 'not-found') {
    return (
      <Centered>
        <div className="flex justify-center mb-5"><ApusLogoLight height={26} /></div>
        <p className="text-[15px] font-semibold mb-1" style={{ color: '#111318' }}>Survey not found</p>
        <p className="text-[12.5px]" style={{ color: '#8A8A94' }}>
          This link doesn't match a live assessment. Check the link you were given, or contact whoever sent it to you.
        </p>
      </Centered>
    );
  }

  const handleSubmit = (answers, relevantIros, stakeholderGroup) => {
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
