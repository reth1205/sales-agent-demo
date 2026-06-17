import { Pause, Play, SkipForward, Volume2, X } from 'lucide-solid';
import { Show } from 'solid-js';
import { getAccount } from '../selectors';
import { actions, state } from '../store';

function MapDemoControls() {
  const demo = () => state.ui.mapDemo;
  const currentStep = () => demo().steps[demo().currentStepIndex];
  const currentAccount = () => {
    const step = currentStep();
    return step ? getAccount(step.accountId) : undefined;
  };
  const isLastStep = () => demo().currentStepIndex >= demo().steps.length - 1;

  return (
    <section class="map-demo-controls">
      <Show
        when={demo().isRunning}
        fallback={(
          <button class="primary-action compact-action" onClick={() => actions.startMapDemo()}>
            <Play size={16} />
            Run map demo
          </button>
        )}
      >
        <div class="demo-step-copy">
          <span class="eyebrow">
            {demo().isMoving ? 'Moving' : 'Step'} {demo().currentStepIndex + 1} of {demo().steps.length}
          </span>
          <strong>{demo().isMoving ? `Moving to ${currentAccount()?.name ?? 'destination'}` : currentStep()?.label}</strong>
          <p>{currentStep()?.message}</p>
          <Show when={demo().voiceMessage}>
            {(message) => (
              <div class="demo-voice-line" aria-live="polite">
                <Volume2 size={14} />
                <span>{message()}</span>
              </div>
            )}
          </Show>
          <Show when={demo().isMoving}>
            <div class="demo-progress-line">
              <span style={{ width: `${demo().movementProgress}%` }} />
            </div>
          </Show>
        </div>
        <div class="demo-step-actions">
          <button class="icon-button" title={demo().isPaused ? 'Resume demo' : 'Pause demo'} onClick={() => actions.pauseMapDemo()}>
            {demo().isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button class="icon-button" title="Next step" disabled={isLastStep() || demo().isMoving} onClick={() => actions.advanceMapDemoStep()}>
            <SkipForward size={16} />
          </button>
          <button class="icon-button" title="Close demo" onClick={() => actions.stopMapDemo()}>
            <X size={16} />
          </button>
        </div>
      </Show>
    </section>
  );
}

export default MapDemoControls;
