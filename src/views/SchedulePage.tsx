import { Bot, ChevronDown, ChevronUp, WifiOff } from 'lucide-solid';
import { createSignal, For, Show } from 'solid-js';
import Header from '../components/Header';
import VisitActions from '../components/VisitActions';
import VisitContext from '../components/VisitContext';
import { getVisitAccount } from '../selectors';
import { formatDistance, getDistanceMeters } from '../services';
import { state } from '../store';

function SchedulePage() {
  const [expandedVisitId, setExpandedVisitId] = createSignal(state.visits.find((visit) => visit.status !== 'Completed')?.id);

  return (
    <div class="content-stack">
      <Header title="My Day" subtitle="Route, briefings, and visit capture" />
      <section class="panel schedule-list-panel">
        <For each={state.visits}>
          {(visit) => {
            const account = () => getVisitAccount(visit);
            const distance = () => getDistanceMeters(state.location.current, { latitude: visit.latitude, longitude: visit.longitude });
            const isExpanded = () => expandedVisitId() === visit.id;
            const assistantNotification = () => state.assistant.notifications.find((item) => item.visitId === visit.id && item.status !== 'dismissed');
            const briefing = () => state.assistant.briefings.find((item) => item.visitId === visit.id);
            return (
              <div class={isExpanded() ? 'schedule-row expanded' : 'schedule-row'}>
                <button class="schedule-row-summary" onClick={() => setExpandedVisitId(isExpanded() ? undefined : visit.id)}>
                  <div>
                    <span class={`status-badge ${visit.status.toLowerCase()}`}>{visit.status}</span>
                    <strong>{account()?.name}</strong>
                    <span>{visit.time} - {formatDistance(distance())}</span>
                    <Show when={assistantNotification() || briefing()}>
                      <span class="assistant-row-signal">
                        <Bot size={13} />
                        {assistantNotification()?.type === 'postMeetingDebrief' ? 'Debrief ready' : 'AI briefing ready'}
                      </span>
                    </Show>
                  </div>
                  <div class="schedule-row-icons">
                    <Show when={visit.pendingSync}>
                      <WifiOff size={18} class="offline-icon" />
                    </Show>
                    {isExpanded() ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>
                <Show when={isExpanded()}>
                  <div class="schedule-row-detail">
                    <p>{visit.address}</p>
                    <Show when={account()}>
                      {(currentAccount) => <VisitContext account={currentAccount()} />}
                    </Show>
                    <VisitActions visit={visit} />
                  </div>
                </Show>
              </div>
            );
          }}
        </For>
      </section>
    </div>
  );
}

export default SchedulePage;
