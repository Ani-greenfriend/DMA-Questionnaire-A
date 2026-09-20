import { useState } from 'react';
import ApusLogoLight from './ApusLogoLight';
import { TYPE_LABEL, EXPERTISE_OPTIONS } from '../lib/topics';
import { criteriaForIro, hasImpactAxis } from '../lib/criteria';
import { createDraft, saveProgress, submitFinal } from '../lib/data';

const DATA_STATEMENT = "Your expertise details, your answers and, if you choose to give it, your job title are stored securely and used only to run and document this materiality assessment. Your answers are linked to your personal invitation, not to a name field, but the assessment owner can connect the invitation to you. They may be shared with the client company and its auditor. You can request deletion or anonymisation at any time by contacting: anikalerch@greenfriend.org.";

function Shell({ children, wide }) {
  return <div className={`mx-auto px-6 pb-16 ${wide ? 'max-w-2xl' : 'max-w-xl'}`}>{children}</div>;
}

function Card({ children }) {
  return (
    <div
      className="rounded-3xl p-9 bg-white"
      style={{ boxShadow: '0 1px 3px rgba(17,19,24,0.04), 0 20px 40px -16px rgba(17,19,24,0.12)', border: '1px solid #EFEFEC' }}
    >
      {children}
    </div>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="w-full text-[14px] font-semibold rounded-2xl py-3.5 transition-transform hover:scale-[1.01] disabled:opacity-40 disabled:hover:scale-100"
      style={{ background: '#1F9A63', color: '#FFFFFF', boxShadow: '0 10px 24px -8px rgba(31,154,99,0.45)' }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="w-full text-[13px] font-semibold rounded-2xl py-3 transition-colors disabled:opacity-40"
      style={{ background: '#FFFFFF', color: '#1F9A63', border: '1.5px solid #1F9A63' }}
    >
      {children}
    </button>
  );
}

function BackLink({ onClick }) {
  return <button onClick={onClick} className="text-[12px] mb-4" style={{ color: '#8A8A94' }}>← Back</button>;
}

export function SurveyShell({ logo, companyName, children }) {
  return (
    <div className="min-h-screen" style={{ background: '#FAFAF8' }}>
      <div className="flex flex-col items-center justify-center pt-10 pb-4">
        {logo ? (
          <img src={logo} alt={companyName ? `${companyName} logo` : 'Company logo'} className="h-9 max-w-[180px] object-contain" />
        ) : (
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ border: '1.5px dashed #C7C9C2', background: '#FAFAF8' }}
            title="The client's logo will appear here once uploaded in the console"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ACACB0" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
          </div>
        )}
      </div>
      {children}
      <div className="flex items-center justify-center gap-1.5 pb-8 pt-2 opacity-60">
        <span className="text-[10.5px]" style={{ color: '#8A8A94' }}>Hosted on</span>
        <ApusLogoLight height={13} />
      </div>
    </div>
  );
}

export function StatusScreen({ title, body }) {
  return (
    <Shell>
      <Card>
        <p className="text-[18px] font-bold mb-2" style={{ color: '#111318' }}>{title}</p>
        <p className="text-[13.5px] leading-relaxed" style={{ color: '#5B5B66' }}>{body}</p>
      </Card>
    </Shell>
  );
}

function Welcome({ text, companyName, hasDraft, linkUrl, consentChecked, setConsentChecked, onNext }) {
  return (
    <Shell>
      <Card>
        <p className="text-[20px] font-bold mb-4" style={{ color: '#111318' }}>
          {companyName ? `${companyName} sustainability survey` : 'Sustainability survey'}
        </p>
        {text && <p className="text-[14px] leading-relaxed whitespace-pre-wrap mb-5" style={{ color: '#5B5B66' }}>{text}</p>}

        <div className="rounded-2xl p-4 mb-5" style={{ background: '#F5F6F3' }}>
          <p className="text-[12.5px] mb-1.5" style={{ color: '#3A3A42' }}>✓ Your answers are linked to your personal invitation, not to a name field</p>
          <p className="text-[12.5px] mb-1.5" style={{ color: '#3A3A42' }}>✓ Time needed depends on the number of topics — you can save and continue later at any time</p>
          <p className="text-[12.5px]" style={{ color: '#3A3A42' }}>✓ Not sure about something? You can skip any criterion</p>
        </div>

        <p className="text-[12px] leading-relaxed mb-4" style={{ color: '#8A8A94' }}>{DATA_STATEMENT}</p>

        <label className="flex items-start gap-2.5 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded"
            style={{ accentColor: '#1F9A63' }}
          />
          <span className="text-[12.5px]" style={{ color: '#3A3A42' }}>I've read the above and agree that my responses are collected and used as described.</span>
        </label>

        <p className="text-[11.5px] mb-6" style={{ color: '#8A8A94' }}>
          This link is yours — it brings you back to your saved progress. Keep it: <span className="font-mono">{linkUrl}</span>
        </p>

        <PrimaryButton onClick={onNext} disabled={!consentChecked}>
          {hasDraft ? 'Continue where you left off →' : 'Get started →'}
        </PrimaryButton>
      </Card>
    </Shell>
  );
}

function ExpertiseMultiSelect({ selected, onToggle }) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-5">
      {EXPERTISE_OPTIONS.map((opt) => {
        const active = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className="text-left text-[13px] rounded-xl px-3.5 py-3 border transition-colors"
            style={{ borderColor: active ? '#1F9A63' : '#EAEAE6', background: active ? 'rgba(31,154,99,0.06)' : '#FFFFFF', color: active ? '#1F9A63' : '#111318' }}
          >
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}

function GroupGrid(label, groups, selectedId, onSelect) {
  if (!groups.length) return null;
  return (
    <div className="mb-5">
      <p className="text-[11.5px] font-bold tracking-wide mb-2" style={{ color: '#8A8A94' }}>{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelect(g)}
            className="text-left text-[13px] rounded-xl px-3.5 py-3 border transition-colors"
            style={{ borderColor: selectedId === g.id ? '#1F9A63' : '#EAEAE6', background: selectedId === g.id ? 'rgba(31,154,99,0.06)' : '#FFFFFF', color: selectedId === g.id ? '#1F9A63' : '#111318' }}
          >
            {g.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function AboutYou({ stakeholderGroups, onNext, onBack }) {
  const [expertise, setExpertise] = useState([]);
  const [explanation, setExplanation] = useState('');
  const [title, setTitle] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [basis, setBasis] = useState('');

  const impactGroups = stakeholderGroups.filter((g) => g.type === 'impact' || g.type === 'silent');
  const financialGroups = stakeholderGroups.filter((g) => g.type === 'financial');
  const isSilent = selectedGroup?.type === 'silent';

  const canContinue = expertise.length > 0 && explanation.trim() && selectedGroup;

  const toggleExpertise = (id) => {
    setExpertise((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  };

  return (
    <Shell wide>
      <BackLink onClick={onBack} />
      <Card>
        <p className="text-[20px] font-bold mb-1.5" style={{ color: '#111318' }}>About you</p>
        <p className="text-[13.5px] mb-6" style={{ color: '#5B5B66' }}>Nothing here is pre-filled from your invitation — please fill it in yourself.</p>

        <p className="text-[13px] font-semibold mb-2" style={{ color: '#111318' }}>Field(s) of expertise</p>
        <ExpertiseMultiSelect selected={expertise} onToggle={toggleExpertise} />

        <p className="text-[13px] font-semibold mb-1.5" style={{ color: '#111318' }}>Explain your expertise</p>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="A sentence or two on why you're a good source on these topics…"
          className="w-full rounded-xl p-3.5 text-[13.5px] outline-none mb-5 min-h-[80px]"
          style={{ background: '#F5F6F3', color: '#111318', border: '1px solid #EAEAE4' }}
        />

        <p className="text-[13px] font-semibold mb-1.5" style={{ color: '#111318' }}>Job title or role <span style={{ color: '#8A8A94', fontWeight: 400 }}>(optional — keep it general, for example "Head of HR")</span></p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Head of HR"
          className="w-full rounded-xl px-3.5 py-3 text-[13.5px] outline-none mb-6"
          style={{ background: '#F5F6F3', color: '#111318', border: '1px solid #EAEAE4' }}
        />

        <p className="text-[13px] font-semibold mb-3" style={{ color: '#111318' }}>Which group best describes you?</p>
        {GroupGrid('IMPACT PERSPECTIVE', impactGroups, selectedGroup?.id, setSelectedGroup)}
        {GroupGrid('FINANCIAL PERSPECTIVE', financialGroups, selectedGroup?.id, setSelectedGroup)}

        {isSilent && (
          <div className="mb-6">
            <p className="text-[13px] font-semibold mb-1.5" style={{ color: '#111318' }}>On what basis do you represent it? <span style={{ color: '#8A8A94', fontWeight: 400 }}>(optional — for example a study, method or mandate)</span></p>
            <textarea
              value={basis}
              onChange={(e) => setBasis(e.target.value)}
              className="w-full rounded-xl p-3.5 text-[13.5px] outline-none min-h-[70px]"
              style={{ background: '#F5F6F3', color: '#111318', border: '1px solid #EAEAE4' }}
            />
          </div>
        )}

        <PrimaryButton
          disabled={!canContinue}
          onClick={() => onNext({
            expertise, explanation: explanation.trim(), title: title.trim(),
            group: selectedGroup, basis: basis.trim(),
          })}
        >
          Continue →
        </PrimaryButton>
      </Card>
    </Shell>
  );
}

function RatingCriteriaExplainer({ perspectiveFilter, onNext, onBack }) {
  const showImpact = perspectiveFilter !== 'financial';
  const showFinancial = perspectiveFilter !== 'impact';
  const impactCriteria = [
    { label: 'Scale', description: 'How big and severe the effect is — from barely noticeable to very severe.' },
    { label: 'Scope', description: 'How far the effect reaches — a single site, or something felt nationally or globally.' },
    { label: 'Irremediability', description: 'How hard it would be to undo or fix — and how long that would take.' },
    { label: 'Likelihood', description: 'How probable this is to happen. A 4-5 means it is already happening or about to. A 1-3 means it is a possible future scenario.' },
  ];
  const financialCriteria = [
    { label: 'Magnitude', description: 'How much this could affect the company’s financial performance and position.' },
    { label: 'Likelihood', description: 'How probable this is to happen. A 4-5 means it is already happening or about to. A 1-3 means it is a possible future scenario.' },
  ];
  return (
    <Shell wide>
      <BackLink onClick={onBack} />
      <Card>
        <p className="text-[20px] font-bold mb-2" style={{ color: '#111318' }}>How to rate each topic</p>
        <p className="text-[13.5px] mb-7" style={{ color: '#5B5B66' }}>For each topic, please select the option that in your opinion applies best.</p>

        {showImpact && (
          <div className="mb-7">
            <p className="text-[13px] font-bold mb-3 tracking-wide" style={{ color: '#111318' }}>IMPACTS ON THE ENVIRONMENT OR SOCIETY (POSITIVE OR NEGATIVE)</p>
            {impactCriteria.map((c) => (
              <div key={c.label} className="mb-3.5 last:mb-0">
                <p className="text-[15px] font-bold" style={{ color: '#111318' }}>{c.label}</p>
                <p className="text-[12.5px] leading-relaxed" style={{ color: '#6B6B76' }}>{c.description}</p>
              </div>
            ))}
          </div>
        )}
        {showFinancial && (
          <div className="mb-7">
            <p className="text-[13px] font-bold mb-3 tracking-wide" style={{ color: '#111318' }}>FINANCIAL RISKS AND OPPORTUNITIES</p>
            {financialCriteria.map((c) => (
              <div key={c.label} className="mb-3.5 last:mb-0">
                <p className="text-[15px] font-bold" style={{ color: '#111318' }}>{c.label}</p>
                <p className="text-[12.5px] leading-relaxed" style={{ color: '#6B6B76' }}>{c.description}</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-[12px] rounded-xl px-3.5 py-3" style={{ background: '#F5F6F3', color: '#5B5B66' }}>
          Every rating needs a short justification. Not sure about something? Any criterion can be skipped.
        </p>

        <div className="mt-7"><PrimaryButton onClick={onNext}>Continue →</PrimaryButton></div>
      </Card>
    </Shell>
  );
}

function SkipInfo() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span className="w-4 h-4 rounded-full border text-[9px] flex items-center justify-center select-none" style={{ borderColor: '#B8B8C0', color: '#8A8A94' }}>i</span>
      {open && (
        <div className="absolute left-0 bottom-full mb-2 z-20 w-56 rounded-xl p-2.5 text-[11px] leading-snug shadow-lg bg-white" style={{ border: '1px solid #EAEAE6', color: '#3A3A42' }}>
          For anyone unsure or without direct expertise on this specific topic — it's fine to skip rather than guess.
        </div>
      )}
    </span>
  );
}

function JustificationBox({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl p-3 text-[12.5px] outline-none mt-3 min-h-[56px]"
      style={{ background: '#F5F6F3', color: '#111318', border: '1px solid #EAEAE4' }}
    />
  );
}

function CriterionRow({ criterion, value, onAnswer, onSkip, justification, onJustification, showJustification }) {
  const [hoverVal, setHoverVal] = useState(null);
  const skipped = value === 'skipped';
  return (
    <div className="mb-7 last:mb-0 pb-7 last:pb-0 border-b last:border-b-0" style={{ borderColor: '#EFEFEC' }}>
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-[17px] font-extrabold" style={{ color: '#111318' }}>{criterion.label}</p>
        {!skipped ? (
          <button onClick={onSkip} className="text-[11px] flex items-center gap-1" style={{ color: '#8A8A94' }}>
            Skip <SkipInfo />
          </button>
        ) : (
          <button onClick={() => onAnswer(undefined)} className="text-[11px]" style={{ color: '#1F9A63' }}>Answer instead</button>
        )}
      </div>
      <p className="text-[12.5px] leading-relaxed mb-4" style={{ color: '#6B6B76' }}>{criterion.description}</p>

      {skipped ? (
        <p className="text-[12px] rounded-xl px-3 py-2.5" style={{ background: '#F5F6F3', color: '#8A8A94' }}>Skipped — that's okay, not everyone has a view on every topic.</p>
      ) : (
        <>
          <div className="grid grid-cols-6 gap-1.5 mb-2">
            {[0, 1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onMouseEnter={() => setHoverVal(v)}
                onMouseLeave={() => setHoverVal(null)}
                onClick={() => onAnswer(v)}
                className="rounded-xl py-3 text-[11px] font-semibold transition-colors border"
                style={{
                  borderColor: value === v ? '#1F9A63' : '#EAEAE6',
                  background: value === v ? '#1F9A63' : '#FFFFFF',
                  color: value === v ? '#FFFFFF' : '#111318',
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="text-[11.5px]" style={{ color: '#8A8A94', minHeight: 16 }}>
            {(hoverVal !== null ? criterion.labels[hoverVal] : typeof value === 'number' ? criterion.labels[value] : '')}
          </p>
          {showJustification && typeof value === 'number' && (
            <JustificationBox value={justification} onChange={onJustification} placeholder="Why this rating? (required)" />
          )}
        </>
      )}
    </div>
  );
}

function TopicPage({
  iro, criteria, answers, justifications, justificationMode, topicJustification, onTopicJustification,
  onAnswerCriterion, onJustification, onBack, onNext, onSaveContinue, canGoBack, nextDisabled, index, total,
}) {
  const anyValued = criteria.some((c) => typeof answers[c.key] === 'number');
  return (
    <Shell wide>
      <div className="flex items-center justify-between mb-4">
        {canGoBack ? <button onClick={onBack} className="text-[12px]" style={{ color: '#8A8A94' }}>← Previous topic</button> : <span />}
        <span className="text-[11.5px]" style={{ color: '#8A8A94' }}>Topic {index + 1} of {total}</span>
      </div>
      <div className="h-1 rounded-full mb-7 overflow-hidden" style={{ background: '#EAEAE6' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${(index / total) * 100}%`, background: '#1F9A63' }} />
      </div>

      <Card>
        <span className="text-[11px] font-semibold rounded-full px-2.5 py-1 inline-block mb-3" style={{ background: '#F5F6F3', color: '#5B5B66' }}>
          {TYPE_LABEL[iro.iroType]} · {iro.actual ? 'Actual' : 'Potential'}
        </span>
        <p className="text-[16px] font-semibold mb-1" style={{ color: '#111318' }}>{iro.name}</p>
        {iro.description && <p className="text-[12.5px] mb-7" style={{ color: '#6B6B76' }}>{iro.description}</p>}

        {criteria.map((c) => (
          <CriterionRow
            key={c.key}
            criterion={c}
            value={answers[c.key]}
            onAnswer={(v) => onAnswerCriterion(c.key, v)}
            onSkip={() => onAnswerCriterion(c.key, 'skipped')}
            justification={justifications[c.key]}
            onJustification={(v) => onJustification(c.key, v)}
            showJustification={justificationMode === 'per_criterion'}
          />
        ))}

        {justificationMode === 'per_topic' && anyValued && (
          <div className="mb-7">
            <p className="text-[13px] font-semibold mb-1.5" style={{ color: '#111318' }}>Justification for this topic</p>
            <JustificationBox value={topicJustification} onChange={onTopicJustification} placeholder="Why these ratings? (required)" />
          </div>
        )}

        <div className="flex flex-col gap-2.5 mt-7">
          <PrimaryButton onClick={onNext} disabled={nextDisabled}>
            {index + 1 < total ? 'Next topic →' : 'Continue →'}
          </PrimaryButton>
          <SecondaryButton onClick={onSaveContinue}>Save and continue later</SecondaryButton>
        </div>
      </Card>
    </Shell>
  );
}

function SaveAndContinueScreen({ linkUrl, onBack }) {
  const [copied, setCopied] = useState(false);
  return (
    <Shell>
      <Card>
        <p className="text-[20px] font-bold mb-2" style={{ color: '#111318' }}>Your progress is saved.</p>
        <p className="text-[13px] mb-2" style={{ color: '#5B5B66' }}>Your personal link:</p>
        <div className="rounded-xl px-3.5 py-3 mb-3 flex items-center justify-between gap-3" style={{ background: '#F5F6F3', border: '1px solid #EAEAE4' }}>
          <span className="text-[12px] font-mono break-all" style={{ color: '#111318' }}>{linkUrl}</span>
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(linkUrl).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
          className="text-[12px] font-semibold mb-6"
          style={{ color: '#1F9A63' }}
        >
          {copied ? 'Copied ✓' : 'Copy link'}
        </button>
        <p className="text-[12px] mb-6" style={{ color: '#8A8A94' }}>
          This link is the only way back to your answers — keep it. Anyone with this link can open your draft. Unfinished answers are not counted in the results until the survey is submitted.
        </p>
        <PrimaryButton onClick={onBack}>Back to the survey →</PrimaryButton>
      </Card>
    </Shell>
  );
}

function SubmitScreen({ comment, setComment, onSubmit, submitting, submitError, incompleteItems, mandatory }) {
  return (
    <Shell>
      <Card>
        <p className="text-[20px] font-bold mb-2" style={{ color: '#111318' }}>That's everything</p>
        <p className="text-[13.5px] mb-5" style={{ color: '#5B5B66' }}>
          Use "Previous" to review your answers if you'd like — submitting is final.
        </p>

        {mandatory && incompleteItems.length > 0 && (
          <div className="rounded-xl px-3.5 py-3 mb-5" style={{ background: '#FFF4E0', border: '1px solid #F0DBAE' }}>
            <p className="text-[12px] font-semibold mb-1" style={{ color: '#9A6B1F' }}>A few things are still missing:</p>
            <ul className="text-[11.5px] list-disc pl-4" style={{ color: '#9A6B1F' }}>
              {incompleteItems.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        )}

        <p className="text-[13px] font-semibold mb-1.5" style={{ color: '#111318' }}>Any other comments?</p>
        <p className="text-[11.5px] mb-2" style={{ color: '#8A8A94' }}>Optional — anything you didn't get to say above, or context you think matters.</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Type here…"
          className="w-full rounded-xl p-3.5 text-[13.5px] outline-none mb-5 min-h-[100px]"
          style={{ background: '#F5F6F3', color: '#111318', border: '1px solid #EAEAE4' }}
        />
        {submitError && <p className="text-[12px] mb-3" style={{ color: '#C0392B' }}>{submitError} — your answers are still here, you can try again.</p>}
        <PrimaryButton onClick={onSubmit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit survey →'}</PrimaryButton>
      </Card>
    </Shell>
  );
}

function ThankYou() {
  return (
    <Shell>
      <Card>
        <p className="text-[28px] mb-3">🎉</p>
        <p className="text-[20px] font-bold mb-2" style={{ color: '#111318' }}>Thank you for your participation</p>
        <p className="text-[13.5px] leading-relaxed" style={{ color: '#5B5B66' }}>
          Your answers have been recorded and will feed into the company's materiality assessment, alongside everyone else's.
        </p>
      </Card>
    </Shell>
  );
}

function keyFor(iroId, criterionKey) {
  return `${iroId}::${criterionKey}`;
}

export default function ExpertSurvey({
  linkCode, assessment, iros, stakeholderGroups, draft, linkUrl, initialTopicIndex,
}) {
  const [phase, setPhase] = useState('welcome');
  const [consentChecked, setConsentChecked] = useState(false);
  const [qIndex, setQIndex] = useState(initialTopicIndex);
  const [answers, setAnswers] = useState(() => {
    const initial = {};
    for (const r of draft?.ratings ?? []) {
      initial[keyFor(r.iro_id, r.criterion_key)] = r.value === null ? 'skipped' : r.value;
    }
    return initial;
  });
  const [justifications, setJustifications] = useState(() => {
    const initial = {};
    for (const r of draft?.ratings ?? []) {
      if (r.justification) initial[keyFor(r.iro_id, r.criterion_key)] = r.justification;
    }
    return initial;
  });
  const [topicJustifications, setTopicJustifications] = useState(() => {
    const initial = {};
    for (const tj of draft?.topicJustifications ?? []) initial[tj.iro_id] = tj.justification;
    return initial;
  });
  const [comment, setComment] = useState(draft?.submission?.overall_comment ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const relevantIros = iros.filter((i) => {
    if (assessment.perspectiveFilter === 'impact') return hasImpactAxis(i.iroType);
    if (assessment.perspectiveFilter === 'financial') return !hasImpactAxis(i.iroType);
    return true;
  });

  function persistTopic(index, nextIndexForCursor) {
    const iro = relevantIros[index];
    if (!iro) return;
    const criteria = criteriaForIro(iro);
    const ratingsRows = criteria.map((c) => {
      const k = keyFor(iro.id, c.key);
      const raw = answers[k];
      return {
        iro_id: iro.id,
        criterion_key: c.key,
        value: raw === 'skipped' || raw === undefined ? null : raw,
        justification: assessment.justificationMode === 'per_criterion' ? (justifications[k] || null) : null,
      };
    });
    const tjText = topicJustifications[iro.id]?.trim();
    const tjRows = assessment.justificationMode === 'per_topic' && tjText
      ? [{ iro_id: iro.id, justification: tjText }]
      : [];

    saveProgress({
      linkCode,
      currentTopicIndex: nextIndexForCursor,
      ratings: ratingsRows,
      topicJustifications: tjRows,
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to save progress:', err);
    });
  }

  const handleAboutYouNext = async ({ expertise, explanation, title, group, basis }) => {
    const perspective = group.type === 'financial' ? 'financial' : 'impact';
    try {
      await createDraft({
        linkCode,
        stakeholderGroup: group.name,
        perspective,
        expertiseTopics: expertise,
        expertiseExplanation: explanation,
        title,
        basisForRepresentation: basis,
      });
      setPhase('task');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to start your draft:', err);
      window.alert('Something went wrong saving your details. Please try again.');
    }
  };

  const goToTopic = (targetIndex) => {
    if (targetIndex >= relevantIros.length) {
      setPhase('submit');
    } else {
      setQIndex(targetIndex);
      setPhase('questions');
    }
  };

  const handleNext = () => {
    persistTopic(qIndex, Math.min(qIndex + 1, relevantIros.length));
    goToTopic(qIndex + 1);
  };
  const handlePrevious = () => {
    persistTopic(qIndex, Math.max(0, qIndex - 1));
    setQIndex((i) => Math.max(0, i - 1));
  };
  const handleSaveContinue = () => {
    persistTopic(qIndex, qIndex);
    setPhase('save-continue');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const ratingsRows = [];
    const tjRows = [];
    for (const iro of relevantIros) {
      const criteria = criteriaForIro(iro);
      for (const c of criteria) {
        const k = keyFor(iro.id, c.key);
        const raw = answers[k];
        ratingsRows.push({
          iro_id: iro.id,
          criterion_key: c.key,
          value: raw === 'skipped' || raw === undefined ? null : raw,
          justification: assessment.justificationMode === 'per_criterion' ? (justifications[k] || null) : null,
        });
      }
      const tjText = topicJustifications[iro.id]?.trim();
      if (assessment.justificationMode === 'per_topic' && tjText) {
        tjRows.push({ iro_id: iro.id, justification: tjText });
      }
    }
    try {
      await submitFinal({ linkCode, overallComment: comment.trim(), ratings: ratingsRows, topicJustifications: tjRows });
      setPhase('done');
    } catch (err) {
      setSubmitError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const incompleteItems = [];
  for (const iro of relevantIros) {
    const criteria = criteriaForIro(iro);
    const unanswered = criteria.filter((c) => answers[keyFor(iro.id, c.key)] === undefined);
    if (unanswered.length) incompleteItems.push(`${iro.name}: ${unanswered.map((c) => c.label).join(', ')} not answered or skipped`);
    const missingJustification = assessment.justificationMode === 'per_criterion'
      ? criteria.some((c) => typeof answers[keyFor(iro.id, c.key)] === 'number' && !justifications[keyFor(iro.id, c.key)]?.trim())
      : criteria.some((c) => typeof answers[keyFor(iro.id, c.key)] === 'number') && !topicJustifications[iro.id]?.trim();
    if (missingJustification) incompleteItems.push(`${iro.name}: justification missing`);
  }

  const handleWelcomeNext = () => {
    if (draft) goToTopic(initialTopicIndex);
    else setPhase('about-you');
  };

  let content;
  if (phase === 'welcome') {
    content = (
      <Welcome
        text={assessment.welcomeText}
        companyName={assessment.companyName}
        hasDraft={!!draft}
        linkUrl={linkUrl}
        consentChecked={consentChecked}
        setConsentChecked={setConsentChecked}
        onNext={handleWelcomeNext}
      />
    );
  } else if (phase === 'about-you') {
    content = <AboutYou stakeholderGroups={stakeholderGroups} onNext={handleAboutYouNext} onBack={() => setPhase('welcome')} />;
  } else if (phase === 'task') {
    content = <RatingCriteriaExplainer perspectiveFilter={assessment.perspectiveFilter} onNext={() => goToTopic(0)} onBack={() => setPhase('about-you')} />;
  } else if (phase === 'questions' && relevantIros.length) {
    const iro = relevantIros[qIndex];
    const criteria = criteriaForIro(iro);
    const topicAnswers = Object.fromEntries(criteria.map((c) => [c.key, answers[keyFor(iro.id, c.key)]]));
    const topicJustificationsForRow = Object.fromEntries(criteria.map((c) => [c.key, justifications[keyFor(iro.id, c.key)]]));
    const allAnsweredOrSkipped = criteria.every((c) => topicAnswers[c.key] !== undefined);
    const missingJustification = assessment.justificationMode === 'per_criterion'
      ? criteria.some((c) => typeof topicAnswers[c.key] === 'number' && !topicJustificationsForRow[c.key]?.trim())
      : criteria.some((c) => typeof topicAnswers[c.key] === 'number') && !topicJustifications[iro.id]?.trim();
    const nextDisabled = (assessment.mandatory && !allAnsweredOrSkipped) || missingJustification;

    content = (
      <TopicPage
        iro={iro}
        criteria={criteria}
        answers={topicAnswers}
        justifications={topicJustificationsForRow}
        justificationMode={assessment.justificationMode}
        topicJustification={topicJustifications[iro.id]}
        onTopicJustification={(v) => setTopicJustifications((prev) => ({ ...prev, [iro.id]: v }))}
        onAnswerCriterion={(key, v) => setAnswers((prev) => ({ ...prev, [keyFor(iro.id, key)]: v }))}
        onJustification={(key, v) => setJustifications((prev) => ({ ...prev, [keyFor(iro.id, key)]: v }))}
        onNext={handleNext}
        onBack={handlePrevious}
        onSaveContinue={handleSaveContinue}
        canGoBack={qIndex > 0}
        nextDisabled={nextDisabled}
        index={qIndex}
        total={relevantIros.length}
      />
    );
  } else if (phase === 'save-continue') {
    content = <SaveAndContinueScreen linkUrl={linkUrl} onBack={() => setPhase(qIndex >= relevantIros.length ? 'submit' : 'questions')} />;
  } else if (phase === 'submit') {
    content = (
      <SubmitScreen
        comment={comment}
        setComment={setComment}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitError={submitError}
        incompleteItems={incompleteItems}
        mandatory={assessment.mandatory}
      />
    );
  } else if (phase === 'done') {
    content = <ThankYou />;
  }

  return (
    <SurveyShell logo={assessment.logo} companyName={assessment.companyName}>
      {content}
    </SurveyShell>
  );
}
