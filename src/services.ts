import { Capacitor } from '@capacitor/core';
import { QueueStrategy, TextToSpeech } from '@capacitor-community/text-to-speech';
import type {
  Account,
  AccountCoverageMetric,
  ActivityEvent,
  AgentPerformanceSnapshot,
  Contact,
  FieldAgent,
  InterviewQuestion,
  LocationPoint,
  MapDemoStep,
  NearbyRecommendation,
  Opportunity,
  PostMeetingExtraction,
  PreMeetingBriefing,
  ReviewSummary,
  ScheduledVisit,
  Task,
  VisitObjectiveAssessment,
  VisitObjectiveItem,
} from './types';

export const assistantTiming = {
  production: {
    preMeetingLeadMinutes: 15,
    postMeetingWindowMinutes: 30,
  },
  demo: {
    preMeetingLeadSeconds: 15,
    postMeetingWindowSeconds: 30,
  },
};

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

const parseVisitDateTime = (visit: ScheduledVisit, currentTime = new Date()) => {
  const [hours = '0', minutes = '0'] = visit.time.split(':');
  const date = new Date(currentTime);
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date;
};

export const shouldTriggerPreMeetingBriefing = (
  visit: ScheduledVisit,
  currentTime = new Date(),
  isDemo = true,
) => {
  if (visit.status !== 'Scheduled') return false;
  const eventTime = parseVisitDateTime(visit, currentTime).getTime();
  const leadMs = isDemo
    ? assistantTiming.demo.preMeetingLeadSeconds * 1000
    : assistantTiming.production.preMeetingLeadMinutes * 60 * 1000;
  const deltaMs = eventTime - currentTime.getTime();
  return deltaMs <= leadMs && deltaMs >= 0;
};

export const shouldTriggerPostMeetingDebrief = (
  visit: ScheduledVisit,
  currentTime = new Date(),
  isDemo = true,
) => {
  const anchor = visit.finishedAt ?? visit.startedAt;
  if (!anchor || visit.status === 'Completed' || visit.status === 'Questionnaire') return false;
  const elapsedMs = currentTime.getTime() - new Date(anchor).getTime();
  const windowMs = isDemo
    ? assistantTiming.demo.postMeetingWindowSeconds * 1000
    : assistantTiming.production.postMeetingWindowMinutes * 60 * 1000;
  return elapsedMs >= windowMs;
};

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

export const buildPreMeetingBriefing = (
  visit: ScheduledVisit,
  account: Account,
  contacts: Contact[],
  opportunity: Opportunity | undefined,
  tasks: Task[],
  activities: ActivityEvent[],
  distanceMeters: number,
): PreMeetingBriefing => {
  const openTasks = tasks.filter((task) => task.status === 'Open');
  const recentActivities = [...activities].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 3);
  const overdueTasks = openTasks.filter((task) => isTaskOverdue(task));
  const riskLevel = account.hasEscalation || account.engagementRisk === 'High'
    ? 'High'
    : overdueTasks.length || account.engagementRisk === 'Medium'
      ? 'Medium'
      : 'Low';
  const recentTopics = recentActivities.map((activity) => `${activity.title}: ${activity.notes}`);
  const blockers = [
    ...account.risks,
    ...overdueTasks.map((task) => `Overdue: ${task.title}`),
  ].slice(0, 4);

  return {
    id: `briefing-${visit.id}`,
    visitId: visit.id,
    accountId: account.id,
    generatedAt: new Date().toISOString(),
    etaMinutes: estimateDriveMinutes(distanceMeters),
    executiveSummary: `${account.name} is a ${account.tier ?? 'Core'} ${account.type ?? account.industry} account. ${account.summary}`,
    recentTopics: recentTopics.length ? recentTopics : ['No recent activity logged. Confirm current priorities.'],
    openTaskIds: openTasks.map((task) => task.id),
    blockers,
    suggestedQuestions: [
      `What changed since the last ${account.status.toLowerCase()} conversation?`,
      opportunity ? `Is ${opportunity.name} still in ${opportunity.stage}?` : 'Is there a new commercial opportunity to capture?',
      account.nextAction ? `Can we confirm the next action: ${account.nextAction}?` : 'What follow-up should be created after this visit?',
    ],
    keyContactIds: contacts.slice(0, 2).map((contact) => contact.id),
    opportunitySummary: opportunity
      ? `${opportunity.name} is in ${opportunity.stage} at ${opportunity.probability}% with ${formatCurrency(opportunity.amount)} in pipeline.`
      : undefined,
    riskLevel,
  };
};

type VisitObjectiveDefinition = VisitObjectiveItem & {
  requiredSignals: string[][];
  partialEvidence: string;
  missedEvidence: string;
};

export const buildVisitObjectives = (
  account: Account,
  opportunity: Opportunity | undefined,
): VisitObjectiveItem[] => {
  const opportunityName = opportunity?.name ?? 'active opportunity';
  const opportunityValue = opportunity ? formatCurrency(opportunity.amount) : 'the open pipeline';

  return [
    {
      id: 'approval',
      label: 'Confirm approval path',
      detail: 'Validate budget, contract approval, and who still needs to sign off.',
    },
    {
      id: 'opportunity',
      label: 'Review opportunity movement',
      detail: `Clarify next stage and next step for ${opportunityName} (${opportunityValue}).`,
    },
    {
      id: 'timeline',
      label: 'Validate implementation timing',
      detail: 'Capture rollout, delivery, or implementation timeline concerns.',
    },
    {
      id: 'stakeholders',
      label: 'Update stakeholders',
      detail: `Confirm champion, procurement, or decision-maker changes at ${account.name}.`,
    },
    {
      id: 'follow-up',
      label: 'Lock next commitments',
      detail: 'Capture tasks, proposal/pricing follow-up, and the next meeting date.',
    },
  ];
};

const buildVisitObjectiveDefinitions = (
  account: Account,
  opportunity: Opportunity | undefined,
): VisitObjectiveDefinition[] => {
  const objectives = buildVisitObjectives(account, opportunity);
  return [
    {
      ...objectives[0],
      requiredSignals: [['budget', 'approval', 'approved', 'contract', 'sign off', 'signoff']],
      partialEvidence: 'Approval was mentioned, but the final owner or path is unclear.',
      missedEvidence: 'No clear budget or contract approval signal captured.',
    },
    {
      ...objectives[1],
      requiredSignals: [['opportunity', 'proposal', 'pilot', 'renewal', opportunity?.stage.toLowerCase() ?? 'stage']],
      partialEvidence: 'Opportunity context was mentioned without a clear stage or next step.',
      missedEvidence: 'No clear opportunity update captured.',
    },
    {
      ...objectives[2],
      requiredSignals: [['timeline', 'implementation', 'rollout', 'delivery', 'schedule']],
      partialEvidence: 'Timing came up, but the risk or date needs confirmation.',
      missedEvidence: 'No implementation or delivery timing signal captured.',
    },
    {
      ...objectives[3],
      requiredSignals: [['champion', 'procurement', 'stakeholder', 'contact', 'decision maker', 'decision-maker']],
      partialEvidence: 'A stakeholder was mentioned without a role change or action.',
      missedEvidence: 'No stakeholder or contact update captured.',
    },
    {
      ...objectives[4],
      requiredSignals: [['task', 'follow up', 'send', 'next week', 'meeting', 'pricing', 'proposal']],
      partialEvidence: 'A next step was mentioned, but date or owner needs review.',
      missedEvidence: 'No clear next commitment captured.',
    },
  ];
};

export const evaluateVisitObjectives = (
  combined: string,
  account: Account,
  opportunity: Opportunity | undefined,
): VisitObjectiveAssessment[] => {
  const normalized = combined.toLowerCase();
  return buildVisitObjectiveDefinitions(account, opportunity).map((objective) => {
    const matchedSignals = objective.requiredSignals
      .map((signals) => signals.filter((signal) => normalized.includes(signal)))
      .filter((signals) => signals.length);
    const matchCount = matchedSignals.reduce((total, signals) => total + signals.length, 0);
    const status = matchCount >= 2 ? 'met' : matchCount === 1 ? 'partial' : 'missed';
    const evidence = status === 'met'
      ? `Detected: ${matchedSignals.flat().slice(0, 3).join(', ')}.`
      : status === 'partial'
        ? objective.partialEvidence
        : objective.missedEvidence;

    return {
      id: objective.id,
      label: objective.label,
      detail: objective.detail,
      status,
      evidence,
    };
  });
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

const combineDebriefText = (questions: InterviewQuestion[], answers: Record<string, string>) => {
  const questionIds = new Set(questions.map((question) => question.id));
  const promptedAnswers = questions
    .map((question) => {
      const answer = answers[question.id]?.trim();
      return answer ? `${question.prompt} ${answer}` : '';
    })
    .filter(Boolean);
  const freeformAnswers = Object.entries(answers)
    .filter(([questionId, answer]) => !questionIds.has(questionId) && answer.trim())
    .map(([, answer]) => answer.trim());

  return [...promptedAnswers, ...freeformAnswers].join(' ').trim();
};

const splitTopics = (combined: string, account: Account, opportunity: Opportunity | undefined) => {
  const normalized = combined.toLowerCase();
  const topics = [
    normalized.includes('budget') ? 'Budget approval' : undefined,
    normalized.includes('timeline') ? 'Decision timeline' : undefined,
    normalized.includes('stakeholder') ? 'Stakeholder update' : undefined,
    normalized.includes('proposal') ? 'Proposal review' : undefined,
    normalized.includes('risk') || normalized.includes('escalation') ? 'Risk or escalation' : undefined,
    opportunity && normalized.includes(opportunity.stage.toLowerCase()) ? `${opportunity.stage} opportunity` : undefined,
  ].filter((topic): topic is string => Boolean(topic));

  return topics.length ? topics : [account.nextAction ?? 'Customer follow-up'];
};

export const extractPostMeetingEntities = (
  visitId: string,
  account: Account,
  opportunity: Opportunity | undefined,
  questions: InterviewQuestion[],
  answers: Record<string, string>,
): PostMeetingExtraction => {
  const combined = combineDebriefText(questions, answers);
  const normalized = combined.toLowerCase();
  const durationMatch = normalized.match(/(\d+)\s*(minute|min|minutes|mins|hour|hours)/);
  const durationMinutes = durationMatch
    ? durationMatch[2].startsWith('hour')
      ? Number(durationMatch[1]) * 60
      : Number(durationMatch[1])
    : 30;
  const followUpActions: Task[] = [];

  if (/(task|follow up|send|call|schedule|next week|proposal|quote|meeting)/i.test(combined)) {
    followUpActions.push({
      id: makeId('task'),
      accountId: account.id,
      title: normalized.includes('proposal') || normalized.includes('quote') ? 'Send updated proposal' : normalized.includes('task') ? 'Complete customer action item' : 'Follow up with customer',
      dueDate: normalized.includes('next week') ? '2026-06-22' : '2026-06-18',
      owner: 'Sofia Rivera',
      status: 'Open',
      priority: normalized.includes('risk') || normalized.includes('budget') ? 'High' : 'Medium',
      source: 'questionnaire',
    });
  }

  const completedTaskIds = normalized.includes('completed') || normalized.includes('closed')
    ? questions
      .filter((question) => question.category === 'followUp')
      .map((question) => question.id)
    : [];
  const missingFields = [
    combined ? undefined : 'meeting notes',
    durationMatch ? undefined : 'visit duration',
    /(task|follow up|next|schedule|call|send)/i.test(combined) ? undefined : 'follow-up action',
  ].filter((field): field is string => Boolean(field));

  return {
    id: makeId('extract'),
    visitId,
    accountId: account.id,
    createdAt: new Date().toISOString(),
    durationMinutes,
    topicsDiscussed: splitTopics(combined, account, opportunity),
    opportunityUpdate: opportunity
      ? {
          opportunityId: opportunity.id,
          stage: normalized.includes('proposal') ? 'Proposal' : normalized.includes('negotiation') ? 'Negotiation' : normalized.includes('opportunity') ? opportunity.stage : opportunity.stage,
          probability: normalized.includes('budget') || normalized.includes('timeline') || normalized.includes('opportunity') ? Math.min(opportunity.probability + 10, 90) : opportunity.probability,
          nextStep: normalized.includes('next week') ? 'Follow up next week' : opportunity.nextStep,
        }
      : undefined,
    completedTaskIds,
    followUpActions,
    futureMeetingDate: normalized.includes('next week') ? '2026-06-22' : undefined,
    missingFields,
    confidence: {
      duration: durationMatch ? 92 : 58,
      topics: combined ? 84 : 32,
      opportunity: opportunity ? 78 : 40,
      tasks: followUpActions.length || completedTaskIds.length ? 86 : 48,
      followUp: missingFields.includes('follow-up action') ? 45 : 88,
    },
  };
};

export const interpretVisitAnswers = (
  visitId: string,
  account: Account,
  opportunity: Opportunity | undefined,
  questions: InterviewQuestion[],
  answers: Record<string, string>,
): ReviewSummary => {
  const combined = combineDebriefText(questions, answers);
  const normalized = combined.toLowerCase();
  const extraction = extractPostMeetingEntities(visitId, account, opportunity, questions, answers);

  return {
    visitId,
    extractedNotes: combined.trim() || 'No notes captured.',
    eventUpdate: {
      outcome: normalized.includes('not available') ? 'Customer unavailable' : 'Customer meeting completed',
      durationMinutes: extraction.durationMinutes,
      notes: combined.trim() || 'Visit completed with standard follow-up.',
    },
    opportunityUpdate: extraction.opportunityUpdate,
    accountUpdate: {
      accountId: account.id,
      status: normalized.includes('risk') || normalized.includes('escalation') ? 'Needs attention' : account.status,
      risks: normalized.includes('risk') || normalized.includes('escalation') ? [...account.risks, 'New risk mentioned during visit'] : [...account.risks],
      notes: normalized.includes('contact') || normalized.includes('champion') || normalized.includes('stakeholder') || normalized.includes('procurement')
        ? 'Contact or stakeholder update captured during meeting.'
        : 'No major account data change.',
    },
    tasks: extraction.followUpActions,
    attachments: normalized.includes('screenshot') || normalized.includes('photo') ? ['Visit evidence screenshot'] : [],
    objectiveChecklist: evaluateVisitObjectives(combined, account, opportunity),
    extraction,
  };
};

export const speakText = (text: string, lang = 'en-US') => {
  if (Capacitor.isNativePlatform()) {
    void TextToSpeech.stop()
      .catch(() => undefined)
      .then(() => TextToSpeech.speak({
        text,
        lang,
        rate: 0.96,
        pitch: 1,
        volume: 1,
        category: 'playback',
        queueStrategy: QueueStrategy.Flush,
      }))
      .catch(() => undefined);
    return true;
  }

  if (!('speechSynthesis' in globalThis) || !('SpeechSynthesisUtterance' in globalThis)) return false;
  const synth = globalThis.speechSynthesis;
  const speak = () => {
    synth.cancel();
    synth.resume();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.volume = 1;
    const voices = synth.getVoices();
    utterance.voice = voices.find((voice) => voice.lang === lang) ?? voices.find((voice) => voice.lang.startsWith(lang.slice(0, 2))) ?? null;
    synth.speak(utterance);
    setTimeout(() => {
      if (synth.paused) synth.resume();
    }, 120);
  };

  if (!synth.getVoices().length) {
    synth.onvoiceschanged = speak;
    setTimeout(speak, 120);
  } else {
    speak();
  }
  return true;
};

export const cancelSpeech = () => {
  if (Capacitor.isNativePlatform()) {
    void TextToSpeech.stop().catch(() => undefined);
    return;
  }

  if (!('speechSynthesis' in globalThis)) return;
  globalThis.speechSynthesis.cancel();
};

export const pauseSpeech = () => {
  if (Capacitor.isNativePlatform()) {
    void TextToSpeech.stop().catch(() => undefined);
    return;
  }

  if (!('speechSynthesis' in globalThis)) return;
  globalThis.speechSynthesis.pause();
};

export const resumeSpeech = () => {
  if (Capacitor.isNativePlatform()) return;

  if (!('speechSynthesis' in globalThis)) return;
  globalThis.speechSynthesis.resume();
};
