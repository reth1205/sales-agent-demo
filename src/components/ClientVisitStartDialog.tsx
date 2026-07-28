import { CheckCircle2, ClipboardCheck, MapPinned, Play, X } from 'lucide-solid';
import { For, Show } from 'solid-js';
import { getSelectedMapAccount } from '../selectors';
import { buildVisitObjectives } from '../services';
import { actions, state } from '../store';

function ClientVisitStartDialog() {
  const account = getSelectedMapAccount;
  const opportunity = () => state.crm.opportunities.find((item) => item.accountId === account()?.id);
  const objectives = () => {
    const selected = account();
    return selected ? buildVisitObjectives(selected, opportunity()) : [];
  };
  const shouldShow = () => Boolean(
    account()
    && state.ui.visitBriefingAccountId === account()?.id
    && !state.ui.activeAssistantNotificationId
    && !state.ui.mapDemo.isRunning,
  );
  const startDemo = () => {
    const selected = account();
    if (!selected) return;
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
          <div class="visit-briefing-section visit-objective-intro">
            <ClipboardCheck size={18} />
            <div>
              <strong>Interview objective checklist</strong>
              <p>Use this brief to guide what the assistant will validate after the conversation.</p>
            </div>
          </div>
          <div class="visit-objective-list">
            <For each={objectives()}>
              {(item) => (
                <div class="visit-objective-item">
                  <CheckCircle2 size={17} />
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </div>
                </div>
              )}
            </For>
          </div>
          <strong class="visit-ready-line">Ready to start the interview with clear objectives.</strong>
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
