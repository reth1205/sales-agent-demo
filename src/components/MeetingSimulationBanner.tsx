import { ClipboardCheck } from 'lucide-solid';
import { Show } from 'solid-js';
import { getVisitAccount } from '../selectors';
import { state } from '../store';

function MeetingSimulationBanner() {
  const demo = () => state.ui.meetingDemo;
  const visit = () => state.visits.find((item) => item.id === demo().visitId);
  const account = () => {
    const currentVisit = visit();
    return currentVisit ? getVisitAccount(currentVisit) : undefined;
  };
  const remainingSeconds = () => Math.max(0, demo().durationSeconds - demo().elapsedSeconds);

  return (
    <Show when={demo().isRunning}>
      <section class="meeting-simulation-banner" aria-live="polite">
        <ClipboardCheck size={18} />
        <div>
          <span class="eyebrow">Interview simulation</span>
          <strong>30 min interview with {account()?.name ?? 'your customer'}</strong>
          <p>{remainingSeconds()}s remaining in this demo</p>
          <div class="meeting-progress-line">
            <span style={{ width: `${demo().progress}%` }} />
          </div>
        </div>
      </section>
    </Show>
  );
}

export default MeetingSimulationBanner;
