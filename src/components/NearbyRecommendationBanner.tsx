import { Navigation, Sparkles, X } from 'lucide-solid';
import { Show } from 'solid-js';
import { getAccount, getActiveRecommendation } from '../selectors';
import { formatDistance } from '../services';
import { actions, state } from '../store';
import type { NearbyRecommendation } from '../types';

const reasonLabels: Record<NearbyRecommendation['reason'], string> = {
  highValue: 'High value',
  overdueTask: 'Overdue follow-up',
  inactiveAccount: 'Inactive account',
  scheduleGap: 'Schedule gap',
  risk: 'Risk signal',
};

function NearbyRecommendationBanner() {
  const recommendation = getActiveRecommendation;
  const account = () => {
    const active = recommendation();
    return active ? getAccount(active.accountId) : undefined;
  };
  const visibleRecommendation = () => {
    const active = recommendation();
    return active && account() && !state.ui.selectedMapAccountId ? active : undefined;
  };

  return (
    <Show when={visibleRecommendation()}>
      {(active) => (
        <section class="nearby-banner">
          <Sparkles size={18} />
          <div>
            <span class="eyebrow">{reasonLabels[active().reason]} · {formatDistance(active().distanceMeters)}</span>
            <p>{active().message}</p>
          </div>
          <div class="nearby-actions">
            <button class="icon-button" title="View account" onClick={() => actions.focusAccountLocation(active().accountId)}>
              <Sparkles size={16} />
            </button>
            <button class="icon-button" title="Navigate" onClick={() => actions.openNavigation(active().accountId)}>
              <Navigation size={16} />
            </button>
            <button class="icon-button" title="Dismiss" onClick={() => actions.dismissRecommendation(active().id)}>
              <X size={16} />
            </button>
          </div>
        </section>
      )}
    </Show>
  );
}

export default NearbyRecommendationBanner;
