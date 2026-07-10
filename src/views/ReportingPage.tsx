import { Check, WifiOff } from 'lucide-solid';
import { For, Show } from 'solid-js';
import AccountCoveragePanel from '../components/AccountCoveragePanel';
import AgentDrillDownSheet from '../components/AgentDrillDownSheet';
import AgentStatusList from '../components/AgentStatusList';
import Header from '../components/Header';
import ManagerInsightsPanel from '../components/ManagerInsightsPanel';
import TeamMapPanel from '../components/TeamMapPanel';
import {
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
      <Header title="Command Center" subtitle="Essential field signals" />
      <section class="panel executive-summary">
        <span class="eyebrow">Today</span>
        <div class="metric-grid compact-metrics">
          <div><span>Visits</span><strong>{totals().visitsCompleted}/{totals().visitsScheduled}</strong></div>
          <div><span>Tasks</span><strong>{formatPercent(tasks().completionRate)}</strong></div>
          <div><span>Pipeline</span><strong>{formatCurrency(opportunities().pipelineTouched)}</strong></div>
          <div><span>Queue</span><strong>{state.queue.length}</strong></div>
        </div>
      </section>

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
        <section class="panel">
          <h3>AI assistant impact</h3>
          <div class="metric-grid compact-metrics">
            <div><span>Briefings</span><strong>{state.assistant.briefings.length}</strong></div>
            <div><span>Debriefs</span><strong>{state.assistant.extractions.length}</strong></div>
            <div><span>Writebacks</span><strong>{state.assistant.writebacks.length}</strong></div>
            <div><span>CRM quality</span><strong>{state.assistant.kpis.length ? `${Math.round(state.assistant.kpis.reduce((total, item) => total + item.crmCompleteness, 0) / state.assistant.kpis.length)}%` : '0%'}</strong></div>
          </div>
        </section>
        <Show when={topAlert()} fallback={<section class="panel"><p>No priority alert right now.</p></section>}>
          {(alert) => (
            <section class={`panel top-alert ${alert().severity}`}>
              <span class="eyebrow">Priority alert</span>
              <h3>{alert().title}</h3>
              <p>{alert().message}</p>
              <strong>{alert().recommendedAction}</strong>
            </section>
          )}
        </Show>
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
