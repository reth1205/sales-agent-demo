import { For } from 'solid-js';
import {
  getAgentPerformance,
  getAgentPerformanceScore,
  getAgentStatusColor,
  getAgentStatusLabel,
  getAgentTaskCompletionRate,
  getAgentsByRisk,
} from '../selectors';
import { formatPercent } from '../services';
import { actions, state } from '../store';

function AgentStatusList() {
  return (
    <section class="panel">
      <div class="section-title">
        <div>
          <span class="eyebrow">Team</span>
          <h3>Agent performance</h3>
        </div>
        <span>Lowest score first</span>
      </div>
      <div class="agent-list">
        <For each={getAgentsByRisk()}>
          {(agent) => {
            const snapshot = () => getAgentPerformance(agent.id);
            return (
              <button
                class={`agent-row ${state.ui.selectedManagerAgentId === agent.id ? 'selected' : ''}`}
                onClick={() => actions.selectManagerAgent(agent.id)}
              >
                <span class="agent-avatar" style={{ background: getAgentStatusColor(agent.status) }}>{agent.avatarInitials}</span>
                <div class="agent-row-body">
                  <div class="agent-row-header">
                    <strong>{agent.name}</strong>
                    <span class="status-badge" style={{ color: getAgentStatusColor(agent.status) }}>{getAgentStatusLabel(agent.status)}</span>
                  </div>
                  <span>{agent.territory} - {agent.currentCustomer ?? 'Between visits'}</span>
                  <div class="bar-line">
                    <i style={{ width: `${agent.completionPercent}%` }} />
                  </div>
                  <div class="agent-row-metrics">
                    <span>{formatPercent(agent.completionPercent)} completion</span>
                    <span>{formatPercent(agent.crmCompletionRate)} CRM</span>
                    <span>{snapshot()?.visitsCompleted ?? 0}/{snapshot()?.visitsScheduled ?? 0} visits</span>
                    <span>{getAgentPerformanceScore(agent.id)} score</span>
                    <span>{getAgentTaskCompletionRate(agent.id)}% tasks</span>
                  </div>
                </div>
              </button>
            );
          }}
        </For>
      </div>
    </section>
  );
}

export default AgentStatusList;
