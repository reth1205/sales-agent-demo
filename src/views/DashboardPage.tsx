import { useNavigate } from '@solidjs/router';
import { CircleDot } from 'lucide-solid';
import { createMemo, Show } from 'solid-js';
import DailyProgressWidget from '../components/DailyProgressWidget';
import MapView from '../components/MapView';
import VisitStatusPrompt from '../components/VisitStatusPrompt';
import { getVisitAccount } from '../selectors';
import { actions, state } from '../store';

function DashboardPage() {
  const nextVisit = createMemo(() => state.visits.find((visit) => visit.status !== 'Completed') ?? state.visits[0]);
  const navigate = useNavigate();

  const runVisitAction = () => {
    const visit = nextVisit();
    if (visit.status === 'Scheduled') {
      actions.startVisit(visit.id);
    }
    if (visit.status === 'InProgress') {
      actions.finishInterview(visit.id);
    }
    if (visit.status === 'InterviewFinished' || visit.status === 'Questionnaire') {
      actions.beginQuestionnaire(visit.id, 'manual');
      navigate(`/visits/${visit.id}/questionnaire`);
    }
  };

  const dashboardActionLabel = () => {
    const status = nextVisit().status;
    if (status === 'Scheduled') return 'Start Visit';
    if (status === 'InProgress') return 'Finish Interview';
    if (status === 'InterviewFinished') return 'Start Questionnaire';
    if (status === 'Questionnaire') return 'Continue Questionnaire';
    return 'Completed';
  };

  return (
    <>
      <MapView />
      <div class="dashboard-overlay top">
        <DailyProgressWidget />
      </div>
      <div class="dashboard-overlay bottom">
        <section class="visit-card">
          <div>
            <span class="eyebrow">Next visit</span>
            <h2>{getVisitAccount(nextVisit())?.name}</h2>
            <p>{nextVisit().time} · {nextVisit().status}</p>
          </div>
          <div class="visit-card-actions">
            <button class="icon-button" title="Use demo location" onClick={() => actions.focusVisitLocation(nextVisit().id)}>
              <CircleDot size={20} />
            </button>
            <Show when={nextVisit().status !== 'Completed'}>
              <button class="primary-action compact-action" onClick={runVisitAction}>{dashboardActionLabel()}</button>
            </Show>
          </div>
        </section>
        <div class="button-row">
          <button class="secondary-action" onClick={() => actions.requestBrowserLocation()}>Use live location</button>
          <button class="primary-action" onClick={() => actions.useDemoLocation()}>Use demo location</button>
        </div>
      </div>
      <VisitStatusPrompt />
    </>
  );
}

export default DashboardPage;
