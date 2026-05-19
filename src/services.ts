import type { Account, InterviewQuestion, LocationPoint, Opportunity, ReviewSummary, Task } from './types';

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

export const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;

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
