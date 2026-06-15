import { Clock, MapPin, Route, X } from 'lucide-solid';
import { Show } from 'solid-js';
import { getAgentPerformance, getAgentPerformanceScore, getSelectedAgent } from '../selectors';
import {
  buildCoachingInsight,
  calculateScheduleAdherence,
  calculateTaskCompletionRate,
  formatHours,
  formatPercent,
} from '../services';
import { actions } from '../store';

function AgentDrillDownSheet() {
  const agent = () => getSelectedAgent();
  const snapshot = () => (agent() ? getAgentPerformance(agent()!.id) : undefined);

  return (
    <Show when={agent() && snapshot()}>
      <section class="panel agent-drilldown">
        <div class="section-title">
          <div class="agent-title">
            <span class="agent-avatar">{agent()!.avatarInitials}</span>
            <div>
              <span class="eyebrow">Agent drill-down</span>
              <h3>{agent()!.name}</h3>
            </div>
          </div>
          <button class="icon-button" title="Close agent detail" onClick={() => actions.selectManagerAgent(undefined)}>
            <X size={18} />
          </button>
        </div>
        <div class="context-box">
          <div class="inline-icon">
            <MapPin size={17} />
            <strong>{agent()!.currentCustomer ?? 'No active customer meeting'}</strong>
          </div>
          <span>{agent()!.territory}</span>
        </div>
        <div class="metric-grid compact-metrics">
          <div><span>Performance score</span><strong>{getAgentPerformanceScore(agent()!.id)}</strong></div>
          <div><span>Schedule adherence</span><strong>{formatPercent(calculateScheduleAdherence(snapshot()!))}</strong></div>
          <div><span>CRM completion</span><strong>{formatPercent(agent()!.crmCompletionRate)}</strong></div>
          <div><span>Route efficiency</span><strong>{formatPercent(agent()!.routeEfficiency)}</strong></div>
          <div><span>Tasks complete</span><strong>{formatPercent(calculateTaskCompletionRate(snapshot()!))}</strong></div>
          <div><span>Productive hours</span><strong>{formatHours(agent()!.productiveHours)}</strong></div>
        </div>
        <div class="summary-box">
          <div class="inline-icon">
            <Route size={17} />
            <strong>Route and activity</strong>
          </div>
          <span>{snapshot()!.visitsCompleted}/{snapshot()!.visitsScheduled} visits complete, {snapshot()!.opportunityUpdates} opportunity updates, {snapshot()!.overdueTasks} overdue tasks.</span>
        </div>
        <div class="timeline-stack">
          <div class="timeline-item">
            <Clock size={16} />
            <div><strong>09:20</strong><span>Route started with CRM prep complete.</span></div>
          </div>
          <div class="timeline-item">
            <Clock size={16} />
            <div><strong>12:10</strong><span>{agent()!.currentCustomer ?? 'Midday route checkpoint'} updated in field notes.</span></div>
          </div>
          <div class="timeline-item">
            <Clock size={16} />
            <div><strong>15:30</strong><span>Next follow-up window pending manager review.</span></div>
          </div>
        </div>
        <div class="coaching-box">
          <span class="eyebrow">AI coaching simulation</span>
          <p>{buildCoachingInsight(agent()!, snapshot()!)}</p>
        </div>
      </section>
    </Show>
  );
}

export default AgentDrillDownSheet;
