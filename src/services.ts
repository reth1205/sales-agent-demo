import type {
  Account,
  AccountCoverageMetric,
  AgentPerformanceSnapshot,
  FieldAgent,
  InterviewQuestion,
  LocationPoint,
  MapDemoStep,
  NearbyRecommendation,
  Opportunity,
  ReviewSummary,
  ScheduledVisit,
  Task,
} from './types';

export const getDistanceMeters = (from: LocationPoint, to: LocationPoint) => {
  const earthRadius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

export const formatDistance = (distanceMeters: number) => {
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1000).toFixed(1)} km`;
};

export const estimateDriveMinutes = (distanceMeters: number) => Math.max(3, Math.round(distanceMeters / 230));

export const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;

export const formatPercent = (value: number) => `${Math.round(value)}%`;

export const formatHours = (value: number) => `${value.toFixed(1)}h`;

export const calculateTaskCompletionRate = (snapshot: AgentPerformanceSnapshot) => {
  const total = snapshot.followUpTasksCompleted + snapshot.followUpTasksOpen;
  return total ? Math.round((snapshot.followUpTasksCompleted / total) * 100) : 100;
};

export const calculateScheduleAdherence = (snapshot: AgentPerformanceSnapshot) => {
  if (!snapshot.visitsScheduled) return 100;
  return Math.max(0, Math.round(((snapshot.visitsScheduled - snapshot.missedVisits) / snapshot.visitsScheduled) * 100));
};

export const calculateCompositePerformanceScore = (agent: FieldAgent, snapshot: AgentPerformanceSnapshot) => {
  const taskCompletion = calculateTaskCompletionRate(snapshot);
  const scheduleAdherence = calculateScheduleAdherence(snapshot);
  return Math.round(
    agent.completionPercent * 0.3 +
      agent.crmCompletionRate * 0.25 +
      agent.routeEfficiency * 0.2 +
      taskCompletion * 0.15 +
      scheduleAdherence * 0.1,
  );
};

export const calculateCoverageRisk = (metric: AccountCoverageMetric) => {
  const inactivityRisk = Math.min(metric.lastVisitDaysAgo * 4, 50);
  const engagementRisk = metric.engagementFrequency === 'Low' ? 24 : metric.engagementFrequency === 'Medium' ? 12 : 0;
  const pipelineRisk = metric.pipelineHealth === 'AtRisk' ? 26 : metric.pipelineHealth === 'Watch' ? 14 : 0;
  return Math.min(100, Math.round((metric.riskScore + inactivityRisk + engagementRisk + pipelineRisk) / 2));
};

export const buildCoachingInsight = (agent: FieldAgent, snapshot: AgentPerformanceSnapshot) => {
  if (snapshot.missedVisits > 0) return 'Review route pacing and remove low-value stops before the afternoon window.';
  if (agent.crmCompletionRate < 75) return 'Coach on same-day CRM notes and require opportunity updates after each visit.';
  if (agent.routeEfficiency < 75) return 'Compare the planned route against actual travel time before assigning new visits.';
  return 'Reinforce the current routine and use recent wins as a team example.';
};

export const isTaskOverdue = (task: Task, today = '2026-06-15') =>
  task.status === 'Open' && task.dueDate < today;

export const buildAccountInsight = (
  account: Account,
  opportunity: Opportunity | undefined,
  tasks: Task[],
  distanceMeters: number,
) => {
  const overdueTasks = tasks.filter((task) => isTaskOverdue(task));
  const distance = formatDistance(distanceMeters);
  if (account.hasEscalation || account.engagementRisk === 'High') {
    return `${account.name} is ${distance} away and has an active risk signal. Prioritize a quick check-in before the next scheduled meeting.`;
  }
  if (overdueTasks.length) {
    return `${account.name} is ${distance} away with ${overdueTasks.length} overdue follow-up. A short stop could recover momentum.`;
  }
  if (opportunity && opportunity.amount >= 75000 && opportunity.stage !== 'Closed Won') {
    return `${account.name} is nearby with a ${formatCurrency(opportunity.amount)} opportunity in ${opportunity.stage}.`;
  }
  if (account.lastInteractionDate && account.lastInteractionDate < '2026-06-01') {
    return `${account.name} has not had a recent touchpoint. This route gap is a good moment to refresh the relationship.`;
  }
  return `${account.name} is a nearby ${account.type ?? account.industry.toLowerCase()} account with a clear next action.`;
};

export const scoreNearbyAccount = (
  account: Account,
  opportunity: Opportunity | undefined,
  tasks: Task[],
  distanceMeters: number,
  hasScheduleGap = true,
) => {
  const overdueTasks = tasks.filter((task) => isTaskOverdue(task)).length;
  const opportunityScore = opportunity && opportunity.stage !== 'Closed Won' ? Math.min(opportunity.amount / 1500, 70) : 0;
  const distanceScore = Math.max(0, 40 - distanceMeters / 100);
  const riskScore = account.hasEscalation || account.engagementRisk === 'High' ? 30 : account.engagementRisk === 'Medium' ? 14 : 0;
  const taskScore = overdueTasks * 24;
  const gapScore = hasScheduleGap ? 10 : 0;
  return Math.round(opportunityScore + distanceScore + riskScore + taskScore + gapScore);
};

export const buildNavigationUrl = (account: Account) => {
  const query = encodeURIComponent(`${account.latitude},${account.longitude}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

export const buildRecommendationMessage = (
  account: Account,
  opportunity: Opportunity | undefined,
  tasks: Task[],
  distanceMeters: number,
) => {
  const eta = estimateDriveMinutes(distanceMeters);
  const overdueTasks = tasks.filter((task) => isTaskOverdue(task));
  if (account.hasEscalation || account.engagementRisk === 'High') {
    return `You are ${eta} minutes away from ${account.name}. This account has an active risk signal and needs attention.`;
  }
  if (overdueTasks.length) {
    return `You are ${eta} minutes away from ${account.name}. There is an overdue follow-up waiting.`;
  }
  if (opportunity && opportunity.amount >= 75000) {
    return `You are ${eta} minutes away from ${account.name}. There is an active opportunity worth ${formatCurrency(opportunity.amount)}.`;
  }
  return `You have a route gap nearby. ${account.name} is ${eta} minutes away and has a clear next action.`;
};

export const buildMapDemoSteps = (
  accounts: Account[],
  visits: ScheduledVisit[],
  recommendations: NearbyRecommendation[],
) => {
  const preferredAccountIds = ['acct-acme', 'acct-horizon', 'acct-urban-foods', 'acct-pinnacle', 'acct-globex'];
  const scheduled = new Set(visits.map((visit) => visit.accountId));
  const ordered = preferredAccountIds
    .map((accountId) => accounts.find((account) => account.id === accountId))
    .filter((account): account is Account => Boolean(account));

  return ordered.map<MapDemoStep>((account, index) => {
    const recommendation = recommendations.find((item) => item.accountId === account.id);
    const hasVisit = scheduled.has(account.id);
    return {
      id: `map-demo-${index + 1}`,
      label: hasVisit ? 'Scheduled stop' : recommendation ? 'Nearby discovery' : 'Account context',
      accountId: account.id,
      recommendationId: recommendation?.id ?? (!hasVisit ? `nearby-${account.id}` : undefined),
      location: {
        latitude: account.latitude,
        longitude: account.longitude,
      },
      message: recommendation?.message ?? `Open ${account.name} from the map and review the next best action.`,
    };
  });
};

export const getActiveQuestions = (questions: InterviewQuestion[]) =>
  [...questions].filter((question) => question.isActive).sort((a, b) => a.order - b.order);

export const interpretVisitAnswers = (
  visitId: string,
  account: Account,
  opportunity: Opportunity | undefined,
  questions: InterviewQuestion[],
  answers: Record<string, string>,
): ReviewSummary => {
  const combined = questions.map((question) => `${question.prompt} ${answers[question.id] ?? ''}`).join(' ');
  const normalized = combined.toLowerCase();
  const durationMatch = normalized.match(/(\d+)\s*(minute|min|minutes|mins|hour|hours)/);
  const durationMinutes = durationMatch
    ? durationMatch[2].startsWith('hour')
      ? Number(durationMatch[1]) * 60
      : Number(durationMatch[1])
    : 30;
  const tasks: Task[] = [];

  if (/(follow up|send|call|schedule|next week|proposal)/i.test(combined)) {
    tasks.push({
      id: makeId('task'),
      accountId: account.id,
      title: normalized.includes('proposal') ? 'Send updated proposal' : 'Follow up with customer',
      dueDate: '2026-05-22',
      owner: 'Sofia Rivera',
      status: 'Open',
      priority: 'Medium',
      source: 'questionnaire',
    });
  }

  return {
    visitId,
    extractedNotes: combined.trim() || 'No notes captured.',
    eventUpdate: {
      outcome: normalized.includes('not available') ? 'Customer unavailable' : 'Customer meeting completed',
      durationMinutes,
      notes: combined.trim() || 'Visit completed with standard follow-up.',
    },
    opportunityUpdate: opportunity
      ? {
          opportunityId: opportunity.id,
          stage: normalized.includes('proposal') ? 'Proposal' : normalized.includes('negotiation') ? 'Negotiation' : opportunity.stage,
          probability: normalized.includes('budget') || normalized.includes('timeline') ? Math.min(opportunity.probability + 10, 90) : opportunity.probability,
          nextStep: normalized.includes('next week') ? 'Follow up next week' : opportunity.nextStep,
        }
      : undefined,
    accountUpdate: {
      accountId: account.id,
      status: normalized.includes('risk') || normalized.includes('escalation') ? 'Needs attention' : account.status,
      risks: normalized.includes('risk') || normalized.includes('escalation') ? [...account.risks, 'New risk mentioned during visit'] : [...account.risks],
      notes: normalized.includes('stakeholder') ? 'New stakeholder identified during meeting.' : 'No major account data change.',
    },
    tasks,
    attachments: normalized.includes('screenshot') || normalized.includes('photo') ? ['Visit evidence screenshot'] : [],
  };
};

export const speakText = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
};
