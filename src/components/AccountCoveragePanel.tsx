import { AlertTriangle, Briefcase, ClipboardCheck } from 'lucide-solid';
import { For } from 'solid-js';
import { getAccount, getAccountCoverageSummary, getTaskCompletionSummary } from '../selectors';
import { calculateCoverageRisk, formatCurrency, formatPercent } from '../services';
import { state } from '../store';

function AccountCoveragePanel() {
  const summary = () => getAccountCoverageSummary();
  const tasks = () => getTaskCompletionSummary();

  return (
    <section class="panel account-coverage-panel">
      <div class="section-title">
        <div>
          <span class="eyebrow">Accounts</span>
          <h3>Coverage and follow-up</h3>
        </div>
        <span>{summary().totalAccounts} tracked</span>
      </div>
      <div class="metric-grid compact-metrics">
        <div><span>Visits this week</span><strong>{summary().visitsThisWeek}</strong></div>
        <div><span>Inactive accounts</span><strong>{summary().inactiveAccounts}</strong></div>
        <div><span>At-risk accounts</span><strong>{summary().atRiskAccounts}</strong></div>
        <div><span>Task completion</span><strong>{formatPercent(tasks().completionRate)}</strong></div>
      </div>
      <div class="task-summary">
        <div class="inline-icon"><ClipboardCheck size={17} /><strong>{tasks().completed} completed</strong></div>
        <span>{tasks().open} open follow-ups, {tasks().overdue} overdue activities.</span>
      </div>
      <div class="coverage-list">
        <For each={state.manager.accountCoverage}>
          {(metric) => {
            const account = () => getAccount(metric.accountId);
            const risk = () => calculateCoverageRisk(metric);
            return (
              <div class="coverage-row">
                <div class="coverage-row-header">
                  <div>
                    <strong>{account()?.name ?? 'Account'}</strong>
                    <span>{metric.engagementFrequency} engagement - last visit {metric.lastVisitDaysAgo} days ago</span>
                  </div>
                  <span class={`risk-pill ${risk() >= 55 ? 'high' : risk() >= 35 ? 'watch' : 'low'}`}>{risk()}</span>
                </div>
                <div class="bar-line">
                  <i style={{ width: `${Math.max(10, 100 - risk())}%` }} />
                </div>
                <div class="coverage-meta">
                  <span><Briefcase size={14} /> {formatCurrency(metric.pipelineAmount)}</span>
                  <span><AlertTriangle size={14} /> {metric.pipelineHealth}</span>
                </div>
              </div>
            );
          }}
        </For>
      </div>
      <div class="territory-grid">
        <For each={state.manager.territories}>
          {(territory) => (
            <div>
              <strong>{territory.territory.replace('Mexico City ', '')}</strong>
              <span>{territory.visitsCompleted} visits</span>
              <span>{formatPercent(territory.efficiency)} efficiency</span>
            </div>
          )}
        </For>
      </div>
    </section>
  );
}

export default AccountCoveragePanel;
