import { Save } from 'lucide-solid';
import { Show } from 'solid-js';
import { actions, state } from '../store';
import type { ReviewSummary } from '../types';

function ReviewPanel() {
  const review = () => state.questionnaire.review;
  const updateEvent = (field: keyof ReviewSummary['eventUpdate'], value: string) => {
    actions.updateReview((current) => ({
      ...current,
      eventUpdate: {
        ...current.eventUpdate,
        [field]: field === 'durationMinutes' ? Number(value) : value,
      },
    }));
  };

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
          <button class="primary-action wide" onClick={() => actions.confirmReview()}>
            <Save size={18} />
            Confirm submission
          </button>
        </section>
      )}
    </Show>
  );
}

export default ReviewPanel;
