import { state } from './store';
import { calculateCompositePerformanceScore, calculateCoverageRisk, calculateTaskCompletionRate } from './services';
import type { AgentStatus, ScheduledVisit } from './types';

export const getAccount = (accountId: string) => state.crm.accounts.find((account) => account.id === accountId);

export const getVisitAccount = (visit: ScheduledVisit) => getAccount(visit.accountId);

export const getOpenOpportunity = (accountId: string) =>
  state.crm.opportunities.find((opportunity) => opportunity.accountId === accountId);

export const getAgentPerformance = (agentId: string) =>
  state.manager.performance.find((snapshot) => snapshot.agentId === agentId);

export const getSelectedAgent = (agentId = state.ui.selectedManagerAgentId) =>
  agentId ? state.manager.agents.find((agent) => agent.id === agentId) : undefined;

export const getTeamAverageCompletion = () => {
  const agents = state.manager.agents;
  if (!agents.length) return 0;
  return Math.round(agents.reduce((total, agent) => total + agent.completionPercent, 0) / agents.length);
};

export const getCrmAdoptionScore = () => {
  const agents = state.manager.agents;
  if (!agents.length) return 0;
  return Math.round(agents.reduce((total, agent) => total + agent.crmCompletionRate, 0) / agents.length);
};

export const getAgentStatusColor = (status: AgentStatus) => {
  const colors: Record<AgentStatus, string> = {
    OnSchedule: '#2c8a52',
    AtRisk: '#c89b1f',
    Missed: '#c44332',
    InMeeting: '#0f6c7a',
    Offline: '#7b8792',
  };
  return colors[status];
};

export const getAgentStatusLabel = (status: AgentStatus) => {
  const labels: Record<AgentStatus, string> = {
    OnSchedule: 'On schedule',
    AtRisk: 'At risk',
    Missed: 'Missed visits',
    InMeeting: 'In meeting',
    Offline: 'Offline',
  };
  return labels[status];
};

export const getTeamTotals = () => {
  const snapshots = state.manager.performance;
  return snapshots.reduce(
    (totals, snapshot) => ({
      visitsCompleted: totals.visitsCompleted + snapshot.visitsCompleted,
      visitsScheduled: totals.visitsScheduled + snapshot.visitsScheduled,
      opportunityUpdates: totals.opportunityUpdates + snapshot.opportunityUpdates,
      tasksCompleted: totals.tasksCompleted + snapshot.followUpTasksCompleted,
      tasksOpen: totals.tasksOpen + snapshot.followUpTasksOpen,
      overdueTasks: totals.overdueTasks + snapshot.overdueTasks,
      missedVisits: totals.missedVisits + snapshot.missedVisits,
    }),
    {
      visitsCompleted: 0,
      visitsScheduled: 0,
      opportunityUpdates: 0,
      tasksCompleted: 0,
      tasksOpen: 0,
      overdueTasks: 0,
      missedVisits: 0,
    },
  );
};

export const getAgentsByRisk = () =>
  [...state.manager.agents].sort((left, right) => {
    const leftSnapshot = getAgentPerformance(left.id);
    const rightSnapshot = getAgentPerformance(right.id);
    const leftScore = leftSnapshot ? calculateCompositePerformanceScore(left, leftSnapshot) : left.completionPercent;
    const rightScore = rightSnapshot ? calculateCompositePerformanceScore(right, rightSnapshot) : right.completionPercent;
    return leftScore - rightScore;
  });

export const getManagerAlerts = () =>
  state.manager.insights.filter((insight) => !state.ui.dismissedManagerInsightIds.includes(insight.id));

export const getAccountCoverageSummary = () => {
  const metrics = state.manager.accountCoverage;
  const pipelineTouched = metrics.reduce((total, metric) => total + metric.pipelineAmount, 0);
  const atRiskAccounts = metrics.filter((metric) => calculateCoverageRisk(metric) >= 55).length;
  const inactiveAccounts = metrics.filter((metric) => metric.lastVisitDaysAgo >= 7).length;
  const visitsThisWeek = metrics.reduce((total, metric) => total + metric.visitsThisWeek, 0);
  return {
    totalAccounts: metrics.length,
    visitsThisWeek,
    inactiveAccounts,
    atRiskAccounts,
    pipelineTouched,
  };
};

export const getTaskCompletionSummary = () => {
  const totals = getTeamTotals();
  const totalTasks = totals.tasksCompleted + totals.tasksOpen;
  return {
    completed: totals.tasksCompleted,
    open: totals.tasksOpen,
    overdue: totals.overdueTasks,
    completionRate: totalTasks ? Math.round((totals.tasksCompleted / totalTasks) * 100) : 100,
  };
};

export const getOpportunityExecutionSummary = () => {
  const totals = getTeamTotals();
  const scheduled = Math.max(totals.visitsScheduled, 1);
  return {
    updates: totals.opportunityUpdates,
    updateRate: Math.round((totals.opportunityUpdates / scheduled) * 100),
    pipelineTouched: getAccountCoverageSummary().pipelineTouched,
  };
};

export const getAgentPerformanceScore = (agentId: string) => {
  const agent = state.manager.agents.find((item) => item.id === agentId);
  const snapshot = getAgentPerformance(agentId);
  if (!agent || !snapshot) return 0;
  return calculateCompositePerformanceScore(agent, snapshot);
};

export const getAgentTaskCompletionRate = (agentId: string) => {
  const snapshot = getAgentPerformance(agentId);
  return snapshot ? calculateTaskCompletionRate(snapshot) : 0;
};
