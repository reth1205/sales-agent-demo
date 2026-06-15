import { Check, WifiOff } from 'lucide-solid';
import { For, Show } from 'solid-js';
import AccountCoveragePanel from '../components/AccountCoveragePanel';
import AgentDrillDownSheet from '../components/AgentDrillDownSheet';
import AgentStatusList from '../components/AgentStatusList';
import Header from '../components/Header';
import ManagerInsightsPanel from '../components/ManagerInsightsPanel';
import ManagerKpiStrip from '../components/ManagerKpiStrip';
import PerformanceTrendPanel from '../components/PerformanceTrendPanel';
import TeamMapPanel from '../components/TeamMapPanel';
import {
  getAgentsByRisk,
  getManagerAlerts,
  getOpportunityExecutionSummary,
  getTaskCompletionSummary,
  getTeamTotals,
} from '../selectors';
import { formatCurrency, formatPercent } from '../services';
import { actions, state } from '../store';
import type { ReportingTab } from '../types';

const tabs: { id: ReportingTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'team', label: 'Team' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'insights', label: 'Insights' },
];

function ReportingPage() {
  const totals = () => getTeamTotals();
  const tasks = () => getTaskCompletionSummary();
  const opportunities = () => getOpportunityExecutionSummary();
  const topAlert = () => getManagerAlerts()[0];

  return (
    <div class="content-stack reporting-command-center">
      <Header title="Command Center" subtitle="Team visibility and field performance" />
      <ManagerKpiStrip />
      <nav class="segmented-control reporting-tabs" aria-label="Reporting sections">
        <For each={tabs}>
          {(tab) => (
            <button
              class={state.ui.reportingTab === tab.id ? 'selected' : ''}
              onClick={() => actions.setReportingTab(tab.id)}
            >
              {tab.label}
            </button>
          )}
        </For>
      </nav>

      <Show when={state.ui.reportingTab === 'overview'}>
        <TeamMapPanel />
        <section class="panel">
          <div class="section-title">
            <div>
              <span class="eyebrow">Today</span>
              <h3>Operational summary</h3>
            </div>
            <strong>{totals().visitsCompleted}/{totals().visitsScheduled}</strong>
          </div>
          <div class="metric-grid compact-metrics">
            <div><span>Task completion</span><strong>{formatPercent(tasks().completionRate)}</strong></div>
            <div><span>Overdue tasks</span><strong>{tasks().overdue}</strong></div>
            <div><span>Opportunity updates</span><strong>{opportunities().updates}</strong></div>
            <div><span>Pipeline touched</span><strong>{formatCurrency(opportunities().pipelineTouched)}</strong></div>
          </div>
        </section>
        <Show when={topAlert()}>
          {(alert) => (
            <section class={`panel top-alert ${alert().severity}`}>
              <span class="eyebrow">Manager alert</span>
              <h3>{alert().title}</h3>
              <p>{alert().message}</p>
              <strong>{alert().recommendedAction}</strong>
            </section>
          )}
        </Show>
        <PerformanceTrendPanel />
        <section class="panel">
          <div class="section-title">
            <div>
              <span class="eyebrow">Leaderboard</span>
              <h3>Coaching priority</h3>
            </div>
          </div>
          <For each={getAgentsByRisk().slice(0, 3)}>
            {(agent) => (
              <button class="list-row selectable-row" onClick={() => {
                actions.selectManagerAgent(agent.id);
                actions.setReportingTab('team');
              }}>
                <div>
                  <strong>{agent.name}</strong>
                  <span>{formatPercent(agent.completionPercent)} completion - {formatPercent(agent.crmCompletionRate)} CRM</span>
                </div>
                <span class="status-badge">{agent.status}</span>
              </button>
            )}
          </For>
        </section>
        <section class="panel">
          <h3>Sync queue</h3>
          <Show when={state.queue.length} fallback={<p>All CRM updates are synced.</p>}>
            <For each={state.queue}>
              {(item) => (
                <div class="list-row">
                  <div><strong>{item.summary.eventUpdate.outcome}</strong><span>{new Date(item.createdAt).toLocaleString()}</span></div>
                  <WifiOff size={18} />
                </div>
              )}
            </For>
          </Show>
        </section>
      </Show>

      <Show when={state.ui.reportingTab === 'team'}>
        <TeamMapPanel />
        <AgentStatusList />
        <AgentDrillDownSheet />
      </Show>

      <Show when={state.ui.reportingTab === 'accounts'}>
        <AccountCoveragePanel />
      </Show>

      <Show when={state.ui.reportingTab === 'insights'}>
        <ManagerInsightsPanel />
        <section class="panel">
          <h3>Milestones</h3>
          <Show when={state.progress.milestones.length} fallback={<p>No field milestone reached yet.</p>}>
            <For each={state.progress.milestones}>
              {(milestone) => <div class="list-row"><strong>{milestone}</strong><Check size={18} /></div>}
            </For>
          </Show>
        </section>
      </Show>
    </div>
  );
}

export default ReportingPage;
