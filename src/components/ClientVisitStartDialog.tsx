import { MapPinned, Play, X } from 'lucide-solid';
import { For, Show } from 'solid-js';
import { getSelectedMapAccount } from '../selectors';
import { actions, state } from '../store';

function ClientVisitStartDialog() {
  const account = getSelectedMapAccount;
  const priorities = [
    'Close the action item regarding contract approval.',
    'Review the pending renewal opportunity valued at $320,000.',
    'Confirm the delivery timeline requested during your last visit.',
  ];
  const openActivities = [
    '2 overdue tasks',
    '1 customer email awaiting response',
    'Proposal expires in 6 days',
  ];
  const customerInsights = [
    'Last meeting sentiment was positive.',
    'Main concern remains implementation timing.',
    'Procurement is waiting for final pricing confirmation.',
  ];
  const upcomingEvents = [
    'Executive business review scheduled next Friday.',
    'Quarterly renewal meeting in three weeks.',
  ];
  const shouldShow = () => Boolean(
    account()
    && state.ui.visitBriefingAccountId === account()?.id
    && !state.ui.activeAssistantNotificationId
    && !state.ui.mapDemo.isRunning,
  );
  const startDemo = () => {
    const selected = account();
    if (!selected) return;
    actions.clearMapSelection();
    actions.startClientDestinationDemo(selected.id);
  };

  return (
    <Show when={shouldShow()}>
      <section class="client-start-dialog visit-briefing-dialog" role="dialog" aria-modal="true" aria-label="Start client destination demo">
        <div class="client-start-icon">
          <MapPinned size={22} />
        </div>
        <div class="client-start-copy">
          <span class="eyebrow">Visit briefing</span>
          <h2>You're approaching {account()?.name ?? 'Northwind Foods'}.</h2>
          <div class="visit-briefing-section">
            <strong>Today's priorities:</strong>
            <ul>
              <For each={priorities}>{(item) => <li>{item}</li>}</For>
            </ul>
          </div>
          <div class="visit-briefing-section">
            <strong>Open activities:</strong>
            <ul>
              <For each={openActivities}>{(item) => <li>{item}</li>}</For>
            </ul>
          </div>
          <div class="visit-briefing-section">
            <strong>Customer insights:</strong>
            <For each={customerInsights}>{(item) => <p>{item}</p>}</For>
          </div>
          <div class="visit-briefing-section">
            <strong>Upcoming events:</strong>
            <For each={upcomingEvents}>{(item) => <p>{item}</p>}</For>
          </div>
          <strong class="visit-ready-line">You're ready for today's visit.</strong>
        </div>
        <div class="client-start-actions">
          <button class="secondary-action" onClick={() => actions.clearMapSelection()}>
            <X size={17} />
            Cancel
          </button>
          <button class="primary-action" onClick={startDemo}>
            <Play size={17} />
            Start
          </button>
        </div>
      </section>
    </Show>
  );
}

export default ClientVisitStartDialog;
