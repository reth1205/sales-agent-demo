export type VisitStatus =
  | 'Scheduled'
  | 'InProgress'
  | 'InterviewFinished'
  | 'Questionnaire'
  | 'Completed';

export type QuestionCategory = 'meeting' | 'opportunity' | 'account' | 'followUp';
export type AnswerType = 'text' | 'yesNo' | 'duration';

export type Agent = {
  id: string;
  name: string;
  territory: string;
  streakDays: number;
};

export type Account = {
  id: string;
  name: string;
  industry: string;
  address: string;
  latitude: number;
  longitude: number;
  summary: string;
  status: string;
  risks: string[];
};

export type Contact = {
  id: string;
  accountId: string;
  name: string;
  role: string;
  phone: string;
  email: string;
};

export type Opportunity = {
  id: string;
  accountId: string;
  name: string;
  stage: string;
  amount: number;
  probability: number;
  nextStep: string;
};

export type ActivityEvent = {
  id: string;
  accountId: string;
  title: string;
  date: string;
  notes: string;
};

export type ScheduledVisit = {
  id: string;
  accountId: string;
  time: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: VisitStatus;
  durationMinutes?: number;
  outcome?: string;
  notes?: string;
  pendingSync?: boolean;
};

export type Task = {
  id: string;
  accountId: string;
  title: string;
  dueDate: string;
  owner: string;
  status: 'Open' | 'Completed';
};

export type InterviewQuestion = {
  id: string;
  prompt: string;
  isActive: boolean;
  order: number;
  category: QuestionCategory;
  answerType: AnswerType;
};

export type LocationPoint = {
  latitude: number;
  longitude: number;
};

export type ProgressState = {
  percent: number;
  milestones: string[];
};

export type ReviewSummary = {
  visitId: string;
  extractedNotes: string;
  eventUpdate: {
    outcome: string;
    durationMinutes: number;
    notes: string;
  };
  opportunityUpdate?: {
    opportunityId: string;
    stage: string;
    probability: number;
    nextStep: string;
  };
  accountUpdate: {
    accountId: string;
    status: string;
    risks: string[];
    notes: string;
  };
  tasks: Task[];
  attachments: string[];
};

export type OfflineQueueItem = {
  id: string;
  createdAt: string;
  visitId: string;
  summary: ReviewSummary;
};
