import { CheckCircle2, Cloud, LoaderCircle, Save } from 'lucide-solid';
import { createSignal, For, onCleanup, Show } from 'solid-js';
import { actions, state } from '../store';
import type { ReviewSummary } from '../types';

const salesforceSteps = [
  'Connecting to Salesforce',
  'Updating account details',
  'Syncing opportunity and follow-up tasks',
  'Salesforce update complete',
];

function ReviewPanel() {
  const review = () => state.questionnaire.review;
  const [isSyncing, setIsSyncing] = createSignal(false);
  const [syncStepIndex, setSyncStepIndex] = createSignal(0);
  const syncTimers: ReturnType<typeof window.setTimeout>[] = [];
  const updateEvent = (field: keyof ReviewSummary['eventUpdate'], value: string) => {
    actions.updateReview((current) => ({
      ...current,
      eventUpdate: {
        ...current.eventUpdate,
        [field]: field === 'durationMinutes' ? Number(value) : value,
      },
    }));
  };
  const clearSyncTimers = () => {
    syncTimers.forEach((timer) => window.clearTimeout(timer));
    syncTimers.length = 0;
  };
  const confirmWithSalesforceSimulation = () => {
    if (isSyncing()) return;
    setIsSyncing(true);
    setSyncStepIndex(0);
    actions.showToast('Connecting to Salesforce...');

    salesforceSteps.slice(1).forEach((_, index) => {
      syncTimers.push(window.setTimeout(() => setSyncStepIndex(index + 1), 760 * (index + 1)));
    });
    syncTimers.push(window.setTimeout(() => {
      actions.confirmReview();
      clearSyncTimers();
    }, 760 * salesforceSteps.length));
  };

  onCleanup(clearSyncTimers);

  return (
    <Show when={review()}>
      {(summary) => (
        <section class="panel review-panel">
          <span class="eyebrow">Review summary</span>
          <h2>CRM updates</h2>
          <label class="field">
            <span>Outcome</span>
            <input value={summary().eventUpdate.outcome} onInput={(event) => updateEvent('outcome', event.currentTarget.value)} />
          </label>
          <label class="field">
            <span>Duration minutes</span>
            <input type="number" value={summary().eventUpdate.durationMinutes} onInput={(event) => updateEvent('durationMinutes', event.currentTarget.value)} />
          </label>
          <label class="field">
            <span>Notes</span>
            <textarea rows={4} value={summary().eventUpdate.notes} onInput={(event) => updateEvent('notes', event.currentTarget.value)} />
          </label>
          <Show when={summary().opportunityUpdate}>
            {(opportunity) => <div class="summary-box"><strong>Opportunity</strong><span>{opportunity().stage} · {opportunity().probability}% · {opportunity().nextStep}</span></div>}
          </Show>
          <Show when={summary().tasks.length}>
            <div class="summary-box"><strong>New tasks</strong><span>{summary().tasks.map((task) => task.title).join(', ')}</span></div>
          </Show>
          <Show when={isSyncing()}>
            <div class="salesforce-sync-card" aria-live="polite">
              <div class="salesforce-sync-header">
                <Cloud size={20} />
                <div>
                  <span class="eyebrow">Salesforce</span>
                  <strong>{salesforceSteps[syncStepIndex()]}</strong>
                </div>
                <LoaderCircle size={18} class="sync-spinner" />
              </div>
              <div class="salesforce-sync-steps">
                <For each={salesforceSteps}>
                  {(step, index) => (
                    <div class={index() <= syncStepIndex() ? 'sync-step active' : 'sync-step'}>
                      <CheckCircle2 size={15} />
                      <span>{step}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
          <button class="primary-action wide" disabled={isSyncing()} onClick={confirmWithSalesforceSimulation}>
            {isSyncing() ? <LoaderCircle size={18} class="sync-spinner" /> : <Save size={18} />}
            {isSyncing() ? 'Updating Salesforce' : 'Confirm submission'}
          </button>
        </section>
      )}
    </Show>
  );
}

export default ReviewPanel;
