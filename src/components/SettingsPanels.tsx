import { ArrowDown, ArrowUp, Plus, RefreshCcw, Trash2 } from 'lucide-solid';
import { createSignal, For, Show } from 'solid-js';
import { actions, state } from '../store';
import { getActiveQuestions } from '../services';

export function InterviewQuestionsSettings() {
  const activeCount = () => getActiveQuestions(state.settings.questions).length;
  const sorted = () => [...state.settings.questions].sort((a, b) => a.order - b.order);

  return (
    <section class="panel">
      <div class="section-title">
        <div>
          <span class="eyebrow">{activeCount()} active</span>
          <h2>Interview questions</h2>
        </div>
        <button class="icon-button" title="Add question" onClick={() => actions.addQuestion()}>
          <Plus size={20} />
        </button>
      </div>
      <For each={sorted()}>
        {(question) => (
          <div class="question-row">
            <label class="toggle-row">
              <input type="checkbox" checked={question.isActive} onChange={() => actions.toggleQuestion(question.id)} />
              <span>{question.isActive ? 'Active' : 'Off'}</span>
            </label>
            <input class="question-input" value={question.prompt} onInput={(event) => actions.updateQuestion(question.id, event.currentTarget.value)} />
            <div class="mini-actions">
              <button class="icon-button" title="Move up" onClick={() => actions.moveQuestion(question.id, -1)}><ArrowUp size={16} /></button>
              <button class="icon-button" title="Move down" onClick={() => actions.moveQuestion(question.id, 1)}><ArrowDown size={16} /></button>
              <button class="icon-button danger" title="Delete" onClick={() => actions.removeQuestion(question.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        )}
      </For>
      <button class="secondary-action wide" onClick={() => actions.restoreDefaultQuestions()}>
        <RefreshCcw size={18} />
        Restore defaults
      </button>
    </section>
  );
}

export function DemoCleanupSettings() {
  const completedVisits = () => state.visits.filter((visit) => visit.status === 'Completed').length;
  const [confirmReset, setConfirmReset] = createSignal(false);
  const resetApp = () => {
    actions.resetApp();
    setConfirmReset(false);
  };

  return (
    <section class="panel">
      <div class="section-title">
        <div>
          <span class="eyebrow">Demo cleanup</span>
          <h2>Reset activity</h2>
          <p>Clear generated demo data without changing session or questions.</p>
        </div>
      </div>
      <div class="metric-grid compact-metrics">
        <div><span>Tasks</span><strong>{state.crm.tasks.length}</strong></div>
        <div><span>Completed</span><strong>{completedVisits()}</strong></div>
        <div><span>Pending sync</span><strong>{state.queue.length}</strong></div>
        <div><span>Progress</span><strong>{state.progress.percent}%</strong></div>
      </div>
      <div class="button-grid">
        <button class="secondary-action" disabled={!state.crm.tasks.length} onClick={() => actions.clearTasks()}>
          <Trash2 size={18} />
          Clear tasks
        </button>
        <button class="secondary-action danger" onClick={() => actions.resetDemoActivity()}>
          <RefreshCcw size={18} />
          Reset demo
        </button>
      </div>
      <div class="danger-zone">
        <div>
          <span class="eyebrow">Full reset</span>
          <p>Restore visits, tasks, queue, progress, questions, settings, map demo state, and local app data.</p>
        </div>
        <Show
          when={confirmReset()}
          fallback={(
            <button class="secondary-action danger wide" onClick={() => setConfirmReset(true)}>
              <RefreshCcw size={18} />
              Reset app
            </button>
          )}
        >
          <div class="confirm-reset-actions">
            <button class="secondary-action" onClick={() => setConfirmReset(false)}>Cancel</button>
            <button class="secondary-action danger" onClick={resetApp}>
              <Trash2 size={18} />
              Confirm reset
            </button>
          </div>
        </Show>
      </div>
    </section>
  );
}
