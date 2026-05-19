import type { Account, ActivityEvent, Agent, Contact, InterviewQuestion, Opportunity, ScheduledVisit } from './types';

export const demoAgent: Agent = {
  id: 'agent-1',
  name: 'Sofia Rivera',
  territory: 'Mexico City West',
  streakDays: 4,
};

export const demoLocation = {
  latitude: 19.4328,
  longitude: -99.1334,
};

export const accounts: Account[] = [
  {
    id: 'acct-acme',
    name: 'Acme Corporation',
    industry: 'Retail Distribution',
    address: 'Av. Paseo de la Reforma 222, Juarez, Mexico City',
    latitude: 19.4308,
    longitude: -99.1571,
    summary: 'Expanding regional distribution and evaluating route optimization software.',
    status: 'Expansion candidate',
    risks: ['Procurement cycle is slow'],
  },
  {
    id: 'acct-globex',
    name: 'Globex Manufacturing',
    industry: 'Industrial Manufacturing',
    address: 'Rio Lerma 167, Cuauhtemoc, Mexico City',
    latitude: 19.4269,
    longitude: -99.1692,
    summary: 'Operations team needs better demand visibility for field sales.',
    status: 'Negotiation',
    risks: ['Budget approval depends on CFO review'],
  },
  {
    id: 'acct-initech',
    name: 'Initech Solutions',
    industry: 'Technology Services',
    address: 'Durango 205, Roma Norte, Mexico City',
    latitude: 19.4197,
    longitude: -99.1647,
    summary: 'Existing customer interested in automating follow-up tasks.',
    status: 'Active customer',
    risks: [],
  },
];

export const contacts: Contact[] = [
  { id: 'ct-1', accountId: 'acct-acme', name: 'Mariana Torres', role: 'Sales Director', phone: '+52 55 1000 1200', email: 'mariana@acme.example' },
  { id: 'ct-2', accountId: 'acct-globex', name: 'Javier Morales', role: 'Operations VP', phone: '+52 55 1000 1300', email: 'javier@globex.example' },
  { id: 'ct-3', accountId: 'acct-initech', name: 'Lucia Ramos', role: 'Customer Success Lead', phone: '+52 55 1000 1400', email: 'lucia@initech.example' },
];

export const opportunities: Opportunity[] = [
  { id: 'opp-1', accountId: 'acct-acme', name: 'Route Intelligence Pilot', stage: 'Discovery', amount: 42000, probability: 35, nextStep: 'Confirm decision timeline' },
  { id: 'opp-2', accountId: 'acct-globex', name: 'Manufacturing Field CRM', stage: 'Proposal', amount: 78000, probability: 55, nextStep: 'Review budget next week' },
  { id: 'opp-3', accountId: 'acct-initech', name: 'Service Automation Add-on', stage: 'Closed Won', amount: 26000, probability: 100, nextStep: 'Schedule onboarding' },
];

export const visits: ScheduledVisit[] = [
  { id: 'visit-1', accountId: 'acct-acme', time: '09:30', address: accounts[0].address, latitude: accounts[0].latitude, longitude: accounts[0].longitude, radiusMeters: 500, status: 'Scheduled' },
  { id: 'visit-2', accountId: 'acct-globex', time: '12:00', address: accounts[1].address, latitude: accounts[1].latitude, longitude: accounts[1].longitude, radiusMeters: 450, status: 'Scheduled' },
  { id: 'visit-3', accountId: 'acct-initech', time: '15:00', address: accounts[2].address, latitude: accounts[2].latitude, longitude: accounts[2].longitude, radiusMeters: 450, status: 'Completed', outcome: 'Renewal expansion confirmed', durationMinutes: 35 },
];

export const activities: ActivityEvent[] = [
  { id: 'act-1', accountId: 'acct-acme', title: 'Intro call', date: '2026-05-12', notes: 'Customer asked for mobile workflow examples.' },
  { id: 'act-2', accountId: 'acct-globex', title: 'Proposal sent', date: '2026-05-10', notes: 'Budget and timeline are the main blockers.' },
  { id: 'act-3', accountId: 'acct-initech', title: 'Implementation check-in', date: '2026-05-09', notes: 'Team requested follow-up automation.' },
];

export const defaultInterviewQuestions: InterviewQuestion[] = [
  { id: 'q-1', prompt: 'How did the meeting go?', isActive: true, order: 1, category: 'meeting', answerType: 'text' },
  { id: 'q-2', prompt: 'Was the customer available?', isActive: true, order: 2, category: 'meeting', answerType: 'yesNo' },
  { id: 'q-3', prompt: 'How long did the visit last?', isActive: true, order: 3, category: 'meeting', answerType: 'duration' },
  { id: 'q-4', prompt: 'Did you discuss any new sales opportunities?', isActive: true, order: 4, category: 'opportunity', answerType: 'text' },
  { id: 'q-5', prompt: 'Was there any change in the opportunity stage?', isActive: true, order: 5, category: 'opportunity', answerType: 'text' },
  { id: 'q-6', prompt: 'Did any account information change?', isActive: true, order: 6, category: 'account', answerType: 'text' },
  { id: 'q-7', prompt: 'Would you like me to create a follow-up task?', isActive: true, order: 7, category: 'followUp', answerType: 'text' },
  { id: 'q-8', prompt: 'Should I schedule another meeting?', isActive: true, order: 8, category: 'followUp', answerType: 'yesNo' },
  { id: 'q-9', prompt: 'Do you want to assign any action items?', isActive: true, order: 9, category: 'followUp', answerType: 'text' },
];
