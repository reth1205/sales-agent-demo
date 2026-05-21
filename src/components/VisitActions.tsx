import { useNavigate } from '@solidjs/router';
import { Show } from 'solid-js';
import { actions } from '../store';
import type { ScheduledVisit } from '../types';

function VisitActions(props: { visit: ScheduledVisit }) {
  const navigate = useNavigate();
  const visit = () => props.visit;

  return (
    <div class="button-grid">
      <button class="secondary-action" onClick={() => actions.focusVisitLocation(visit().id)}>Simulate arrival</button>
      <Show when={visit().status === 'Scheduled'}>
        <button class="primary-action" onClick={() => actions.startVisit(visit().id)}>Start Visit</button>
      </Show>
      <Show when={visit().status === 'InProgress'}>
        <button class="primary-action" onClick={() => actions.finishInterview(visit().id)}>Finish Interview</button>
      </Show>
      <Show when={visit().status === 'InterviewFinished' || visit().status === 'Questionnaire'}>
        <button class="primary-action" onClick={() => { actions.beginQuestionnaire(visit().id, 'manual'); navigate(`/visits/${visit().id}/questionnaire`); }}>Open Questionnaire</button>
      </Show>
    </div>
  );
}

export default VisitActions;
