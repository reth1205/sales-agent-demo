import { useNavigate } from '@solidjs/router';
import { CheckCircle2, ClipboardList, MapPinned, Navigation, Play, X } from 'lucide-solid';
import { For, Show } from 'solid-js';
import {
  getAccountDistance,
  getAccountOpportunity,
  getAccountTasks,
  getLastActivity,
  getSelectedMapAccount,
  getSelectedMapVisit,
} from '../selectors';
import { buildAccountInsight, estimateDriveMinutes, formatCurrency, formatDistance, isTaskOverdue } from '../services';
import { actions } from '../store';

function CustomerMapSummarySheet() {
  const navigate = useNavigate();
  const account = getSelectedMapAccount;
  const visit = getSelectedMapVisit;
  const opportunity = () => {
    const selected = account();
    return selected ? getAccountOpportunity(selected.id) : undefined;
  };
  const tasks = () => {
    const selected = account();
    return selected ? getAccountTasks(selected.id) : [];
  };
  const distance = () => {
    const selected = account();
    return selected ? getAccountDistance(selected) : 0;
  };
  const lastActivity = () => {
    const selected = account();
    return selected ? getLastActivity(selected.id) : undefined;
  };
  const openClient = () => {
    const selected = account();
    if (!selected) return;
    actions.selectClient(selected.id);
    navigate('/clients');
  };
  const openQuestionnaire = () => {
    const selectedVisit = visit();
    if (!selectedVisit) return;
    actions.beginQuestionnaire(selectedVisit.id, 'manual');
    navigate(`/visits/${selectedVisit.id}/questionnaire`);
  };

  return (
    <Show when={account()}>
      {(selected) => (
        <section class="bottom-sheet customer-summary-sheet">
          <div class="sheet-handle" />
          <div class="summary-header">
            <div>
              <span class="eyebrow">{selected().tier ?? 'Account'} - {selected().type ?? selected().industry}</span>
              <h2>{selected().name}</h2>
              <p>{selected().status}</p>
            </div>
            <button class="icon-button" title="Close" onClick={() => actions.clearMapSelection()}>
              <X size={18} />
            </button>
          </div>

          <div class="summary-stat-row">
            <div><span>Distance</span><strong>{formatDistance(distance())}</strong></div>
            <div><span>Drive time</span><strong>{estimateDriveMinutes(distance())} min</strong></div>
            <div><span>Risk</span><strong>{selected().engagementRisk ?? 'Low'}</strong></div>
          </div>

          <Show when={visit()}>
            {(selectedVisit) => (
              <div class="visit-workflow-panel">
                <div>
                  <span class="eyebrow">Interview workflow</span>
                  <strong>{selectedVisit().time} - {selectedVisit().status}</strong>
                </div>
                <div class="workflow-actions">
                  <button class="secondary-action" onClick={() => actions.focusVisitLocation(selectedVisit().id)}>
                    <CheckCircle2 size={17} />
                    Simulate arrival
                  </button>
                  <Show when={selectedVisit().status === 'Scheduled'}>
                    <button class="primary-action" onClick={() => actions.startVisit(selectedVisit().id)}>
                      <Play size={17} />
                      Start Interview
                    </button>
                  </Show>
                  <Show when={selectedVisit().status === 'InProgress'}>
                    <button class="primary-action" onClick={() => actions.finishInterview(selectedVisit().id)}>
                      <CheckCircle2 size={17} />
                      Finish Interview
                    </button>
                  </Show>
                  <Show when={selectedVisit().status === 'InterviewFinished' || selectedVisit().status === 'Questionnaire'}>
                    <button class="primary-action" onClick={openQuestionnaire}>
                      <ClipboardList size={17} />
                      Open Questionnaire
                    </button>
                  </Show>
                </div>
              </div>
            )}
          </Show>

          <div class="insight-panel">
            <MapPinned size={18} />
            <p>{buildAccountInsight(selected(), opportunity(), tasks(), distance())}</p>
          </div>

          <Show when={opportunity()}>
            {(opp) => (
              <div class="summary-box">
                <div class="list-row compact-row">
                  <div>
                    <strong>{opp().name}</strong>
                    <span>{opp().stage} - {opp().probability}%</span>
                  </div>
                  <strong>{formatCurrency(opp().amount)}</strong>
                </div>
                <p>{opp().nextStep}</p>
              </div>
            )}
          </Show>

          <div class="summary-two-column">
            <div>
              <span class="eyebrow">Follow-ups</span>
              <For each={tasks().slice(0, 2)} fallback={<p>No open tasks.</p>}>
                {(task) => (
                  <p class={isTaskOverdue(task) ? 'task-line overdue' : 'task-line'}>
                    {task.title}
                  </p>
                )}
              </For>
            </div>
            <div>
              <span class="eyebrow">Recent activity</span>
              <p>{lastActivity()?.title ?? 'No recent activity'}</p>
              <span>{lastActivity()?.date ?? selected().lastInteractionDate}</span>
            </div>
          </div>

          <Show when={selected().risks.length}>
            <div class="risk-list">
              <For each={selected().risks}>
                {(risk) => <span>{risk}</span>}
              </For>
            </div>
          </Show>

          <div class="summary-actions">
            <button class="secondary-action" onClick={() => actions.openNavigation(selected().id)}>
              <Navigation size={17} />
              Navigate
            </button>
            <button class="secondary-action" onClick={openClient}>View Client</button>
          </div>
        </section>
      )}
    </Show>
  );
}

export default CustomerMapSummarySheet;
