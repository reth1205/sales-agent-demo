import { Show } from 'solid-js';
import { getVisitAccount } from '../selectors';
import { actions, state } from '../store';

function VisitStatusPrompt() {
  const visit = () => state.visits.find((item) => item.id === state.ui.activeVisitPromptId);
  const account = () => (visit() ? getVisitAccount(visit()!) : undefined);

  return (
    <Show when={visit()}>
      <section class="bottom-sheet compact-sheet">
        <div class="sheet-handle" />
        <strong>{account()?.name}</strong>
        <p>You are inside the scheduled visit radius.</p>
        <div class="button-row">
          <button class="primary-action" onClick={() => actions.startVisit(visit()!.id)}>Start Visit</button>
          <button class="secondary-action" onClick={() => actions.dismissVisitPrompt()}>Dismiss</button>
        </div>
      </section>
    </Show>
  );
}

export default VisitStatusPrompt;
