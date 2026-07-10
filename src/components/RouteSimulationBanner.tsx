import { Navigation } from 'lucide-solid';
import { Show } from 'solid-js';
import { getAccount } from '../selectors';
import { state } from '../store';

function RouteSimulationBanner() {
  const demo = () => state.ui.mapDemo;
  const step = () => demo().steps[demo().currentStepIndex];
  const account = () => {
    const currentStep = step();
    return currentStep ? getAccount(currentStep.accountId) : undefined;
  };

  return (
    <Show when={demo().isRunning && demo().isMoving}>
      <section class="route-simulation-banner" aria-live="polite">
        <Navigation size={18} />
        <div>
          <span class="eyebrow">Route simulation</span>
          <strong>Driving to {account()?.name ?? 'your destination'}</strong>
          <div class="route-progress-line">
            <span style={{ width: `${demo().movementProgress}%` }} />
          </div>
        </div>
      </section>
    </Show>
  );
}

export default RouteSimulationBanner;
