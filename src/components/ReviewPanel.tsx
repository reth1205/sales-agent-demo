import { AlertCircle, CheckCircle2, Circle, Cloud, LoaderCircle, Save } from 'lucide-solid';
import { createSignal, For, onCleanup, Show } from 'solid-js';
import { actions, state } from '../store';
import type { ReviewSummary } from '../types';

const salesforceSteps = [
  'Connecting to Salesforce',
  'Updating account details',
  'Syncing opportunity and follow-up tasks',
  'Salesforce update complete',
];

const objectiveStatusLabels = {
  met: 'Met',
  partial: 'Needs review',
  missed: 'Missing',
};

function ReviewPanel() {
  const review = () => state.questionnaire.review;
  const [isSyncing, setIsSyncing] = createSignal(false);
  const [syncStepIndex, setSyncStepIndex] = createSignal(0);
  const syncTimers: ReturnType<typeof setTimeout>[] = [];
  const updateEvent = (field: keyof ReviewSummary['eventUpdate'], value: string) => {
    actions.updateReview((current) => ({
      ...current,
      eventUpdate: {
        ...current.eventUpdate,
        [field]: field === 'durationMinutes' ? Number(value) : value,
      },
    }));
  };
  const salesforceUpdateList = (summary: ReviewSummary) => [
    {
      label: 'Opportunity',
      value: summary.opportunityUpdate
        ? `${summary.opportunityUpdate.stage} - ${summary.opportunityUpdate.probability}% - ${summary.opportunityUpdate.nextStep}`
        : 'No opportunity change detected',
    },
    {
      label: 'Task',
      value: summary.tasks.length
        ? summary.tasks.map((task) => `${task.title} (${task.priority ?? 'Medium'})`).join(', ')
        : 'No new task detected',
    },
    {
      label: 'Meeting',
      value: `${summary.eventUpdate.outcome}. ${summary.eventUpdate.durationMinutes} minutes. ${summary.extraction?.futureMeetingDate ? `Next meeting: ${summary.extraction.futureMeetingDate}.` : 'No next meeting date detected.'}`,
    },
    {
      label: 'Contact',
      value: summary.accountUpdate.notes !== 'No major account data change.'
        ? summary.accountUpdate.notes
        : 'No contact update detected',
    },
    {
      label: 'Risk',
      value: summary.accountUpdate.risks.length
        ? summary.accountUpdate.risks.join(', ')
        : 'No risk detected',
    },
  ];
  const objectiveCompletion = (summary: ReviewSummary) => {
    const total = summary.objectiveChecklist.length;
    if (!total) return '0/0';
    const met = summary.objectiveChecklist.filter((item) => item.status === 'met').length;
    return `${met}/${total}`;
  };
  const clearSyncTimers = () => {
    syncTimers.forEach((timer) => clearTimeout(timer));
    syncTimers.length = 0;
  };
  const confirmWithSalesforceSimulation = () => {
    if (isSyncing()) return;
    setIsSyncing(true);
    setSyncStepIndex(0);
    actions.showToast('Connecting to Salesforce...');

    salesforceSteps.slice(1).forEach((_, index) => {
      syncTimers.push(setTimeout(() => setSyncStepIndex(index + 1), 760 * (index + 1)));
    });
    syncTimers.push(setTimeout(() => {
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
          <h2>Objective checklist</h2>
          <div class="objective-review-card">
            <div class="objective-review-header">
              <strong>{objectiveCompletion(summary())} objectives met</strong>
              <span>Checked against the original visit brief.</span>
            </div>
            <div class="objective-review-list">
              <For each={summary().objectiveChecklist}>
                {(item) => (
                  <div class={`objective-review-item ${item.status}`}>
                    <div class="objective-review-icon">
                      <Show
                        when={item.status === 'met'}
                        fallback={item.status === 'partial' ? <AlertCircle size={17} /> : <Circle size={17} />}
                      >
                        <CheckCircle2 size={17} />
                      </Show>
                    </div>
                    <div>
                      <div class="objective-review-title">
                        <strong>{item.label}</strong>
                        <span>{objectiveStatusLabels[item.status]}</span>
                      </div>
                      <p>{item.detail}</p>
                      <small>{item.evidence}</small>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
          <span class="eyebrow">CRM updates</span>
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
          <Show when={summary().extraction}>
            {(extraction) => (
              <div class="entity-review-card">
                <div class="entity-review-header">
                  <span class="eyebrow">AI Salesforce extraction</span>
                  <strong>{extraction().confidence.topics}% signal confidence</strong>
                </div>
                <div class="salesforce-update-list">
                  <For each={salesforceUpdateList(summary())}>
                    {(item) => (
                      <div class="salesforce-update-row">
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                      </div>
                    )}
                  </For>
                </div>
                <div class="entity-chip-row">
                  <For each={extraction().topicsDiscussed}>
                    {(topic) => <span>{topic}</span>}
                  </For>
                </div>
                <div class="summary-box">
                  <strong>Follow-up</strong>
                  <span>{extraction().followUpActions.map((task) => task.title).join(', ') || 'No new follow-up task detected'}</span>
                </div>
                <Show when={extraction().futureMeetingDate}>
                  {(date) => <div class="summary-box"><strong>Future meeting</strong><span>{date()}</span></div>}
                </Show>
                <Show when={extraction().missingFields.length}>
                  <div class="summary-box warning-box">
                    <strong>Needs review</strong>
                    <span>{extraction().missingFields.join(', ')}</span>
                  </div>
                </Show>
              </div>
            )}
          </Show>
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
