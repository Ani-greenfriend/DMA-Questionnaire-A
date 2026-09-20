import { useEffect, useState } from 'react';
import ExpertSurvey, { SurveyShell, StatusScreen } from './components/ExpertSurvey';
import {
  lookupInvitationByCode, fetchSurveyContext, isSurveyClosed, fetchDraft, markInvitationOpened,
} from './lib/data';
import { supabaseConfigError } from './lib/supabaseClient';

function linkCodeFromPath() {
  // /survey/:slug/:linkCode — the slug is cosmetic (readability only); the
  // link code is the actual, unguessable key used for every lookup.
  const match = window.location.pathname.match(/^\/survey\/[^/]+\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function App() {
  const [linkCode] = useState(linkCodeFromPath);
  const [status, setStatus] = useState('loading'); // loading | config-error | invalid-link | closed | already-submitted | ready
  const [errorDetail, setErrorDetail] = useState(null);
  const [context, setContext] = useState(null); // { invitation, assessment, iros, stakeholderGroups, draft }

  useEffect(() => {
    if (supabaseConfigError) {
      setErrorDetail(supabaseConfigError);
      setStatus('config-error');
      return;
    }
    if (!linkCode) {
      setStatus('invalid-link');
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const invitation = await lookupInvitationByCode(linkCode);
        if (cancelled) return;
        if (!invitation) {
          setStatus('invalid-link');
          return;
        }

        const surveyContext = await fetchSurveyContext(invitation.assessment_id);
        if (cancelled) return;

        if (invitation.status === 'submitted' || invitation.submitted_at) {
          setContext({ assessment: surveyContext.assessment });
          setStatus('already-submitted');
          return;
        }
        if (isSurveyClosed(surveyContext.assessment)) {
          setContext({ assessment: surveyContext.assessment });
          setStatus('closed');
          return;
        }

        markInvitationOpened(linkCode).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Failed to mark invitation opened:', err);
        });

        const draft = await fetchDraft(linkCode);
        if (cancelled) return;

        setContext({ ...surveyContext, draft });
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setErrorDetail(err.message);
        setStatus('config-error');
      }
    })();

    return () => { cancelled = true; };
  }, [linkCode]);

  if (status === 'loading') {
    return (
      <SurveyShell>
        <p className="text-[13px] text-center" style={{ color: '#8A8A94' }}>Loading survey…</p>
      </SurveyShell>
    );
  }

  if (status === 'config-error') {
    return (
      <SurveyShell>
        <StatusScreen title="Survey misconfigured" body={errorDetail} />
      </SurveyShell>
    );
  }

  if (status === 'invalid-link') {
    return (
      <SurveyShell>
        <StatusScreen
          title="This link isn't valid"
          body="Please contact the person who invited you."
        />
      </SurveyShell>
    );
  }

  if (status === 'already-submitted') {
    return (
      <SurveyShell logo={context.assessment.logo} companyName={context.assessment.companyName}>
        <StatusScreen
          title="You've already submitted this survey. Thank you."
          body="Your answers were recorded. This link only accepts one response."
        />
      </SurveyShell>
    );
  }

  if (status === 'closed') {
    return (
      <SurveyShell logo={context.assessment.logo} companyName={context.assessment.companyName}>
        <StatusScreen
          title="This survey is now closed"
          body="It's no longer accepting responses. Please contact the person who invited you if you think this is a mistake."
        />
      </SurveyShell>
    );
  }

  const initialTopicIndex = context.draft?.submission?.current_topic_index ?? 0;

  return (
    <ExpertSurvey
      linkCode={linkCode}
      assessment={context.assessment}
      iros={context.iros}
      stakeholderGroups={context.stakeholderGroups}
      draft={context.draft}
      linkUrl={window.location.href}
      initialTopicIndex={initialTopicIndex}
    />
  );
}
