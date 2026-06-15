import { Activity, AlertTriangle, CheckCircle, X } from 'lucide-solid';
import { For, Show } from 'solid-js';
import { getAccount, getManagerAlerts } from '../selectors';
import { actions, state } from '../store';

function ManagerInsightsPanel() {
  const relatedName = (agentId?: string, accountId?: string) => {
    if (agentId) return state.manager.agents.find((agent) => agent.id === agentId)?.name;
    if (accountId) return getAccount(accountId)?.name;
    return 'Team-wide';
  };

  return (
    <section class="panel insights-panel">
      <div class="section-title">
        <div>
          <span class="eyebrow">AI insights</span>
          <h3>Manager recommendations</h3>
        </div>
        <span>{getManagerAlerts().length} active</span>
      </div>
      <Show
        when={getManagerAlerts().length}
        fallback={
          <div class="empty-panel">
            <CheckCircle size={20} />
            <strong>All insights cleared</strong>
            <span>No active manager alerts remain in this demo session.</span>
          </div>
        }
      >
        <div class="insight-list">
          <For each={getManagerAlerts()}>
            {(insight) => (
              <article class={`insight-card ${insight.severity}`}>
                <div class="insight-card-header">
                  <span class="insight-icon">
                    {insight.severity === 'critical' ? <AlertTriangle size={18} /> : <Activity size={18} />}
                  </span>
                  <div>
                    <strong>{insight.title}</strong>
                    <span>{insight.category} - {relatedName(insight.agentId, insight.accountId)}</span>
                  </div>
                  <button class="icon-button" title="Dismiss insight" onClick={() => actions.dismissManagerInsight(insight.id)}>
                    <X size={16} />
                  </button>
                </div>
                <p>{insight.message}</p>
                <div class="recommended-action">
                  <span>Recommended action</span>
                  <strong>{insight.recommendedAction}</strong>
                </div>
              </article>
            )}
          </For>
        </div>
      </Show>
    </section>
  );
}

export default ManagerInsightsPanel;
