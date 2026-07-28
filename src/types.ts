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
  type?: string;
  tier?: 'Strategic' | 'Enterprise' | 'Growth' | 'Core';
  lastInteractionDate?: string;
  engagementRisk?: 'Low' | 'Medium' | 'High';
  nextAction?: string;
  isNearbyCandidate?: boolean;
  hasEscalation?: boolean;
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
  startedAt?: string;
  finishedAt?: string;
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
  priority?: 'Low' | 'Medium' | 'High';
  source?: 'demo' | 'questionnaire';
};

export type AssistantNotificationType = 'destinationEta' | 'arrivalBriefing' | 'preMeetingBriefing' | 'postMeetingDebrief';
export type AssistantNotificationStatus = 'unread' | 'opened' | 'dismissed';

export type AssistantNotification = {
  id: string;
  type: AssistantNotificationType;
  visitId: string;
  accountId: string;
  title: string;
  message: string;
  triggerReason: 'demoTimer' | 'destinationStart' | 'simulatedArrival' | 'geofenceArrival' | 'geofenceExit' | 'meetingTimer';
  createdAt: string;
  status: AssistantNotificationStatus;
};

export type PreMeetingBriefing = {
  id: string;
  visitId: string;
  accountId: string;
  generatedAt: string;
  etaMinutes: number;
  executiveSummary: string;
  recentTopics: string[];
  openTaskIds: string[];
  blockers: string[];
  suggestedQuestions: string[];
  keyContactIds: string[];
  opportunitySummary?: string;
  riskLevel: 'Low' | 'Medium' | 'High';
};

export type VisitObjectiveStatus = 'met' | 'partial' | 'missed';

export type VisitObjectiveItem = {
  id: string;
  label: string;
  detail: string;
};

export type VisitObjectiveAssessment = VisitObjectiveItem & {
  status: VisitObjectiveStatus;
  evidence: string;
};

export type ExtractionConfidence = {
  duration: number;
  topics: number;
  opportunity: number;
  tasks: number;
  followUp: number;
};

export type PostMeetingExtraction = {
  id: string;
  visitId: string;
  accountId: string;
  createdAt: string;
  durationMinutes: number;
  topicsDiscussed: string[];
  opportunityUpdate?: {
    opportunityId: string;
    stage: string;
    probability: number;
    nextStep: string;
  };
  completedTaskIds: string[];
  followUpActions: Task[];
  futureMeetingDate?: string;
  missingFields: string[];
  confidence: ExtractionConfidence;
};

export type SalesforceWritebackStep = {
  id: 'account' | 'opportunity' | 'tasks' | 'calendar' | 'kpi';
  label: string;
  status: 'pending' | 'syncing' | 'synced' | 'error';
};

export type SalesforceWritebackStatus = {
  id: string;
  visitId: string;
  accountId: string;
  extractionId: string;
  status: 'pending' | 'syncing' | 'synced' | 'error' | 'retry';
  createdAt: string;
  updatedAt: string;
  steps: SalesforceWritebackStep[];
  errorMessage?: string;
};

export type BehaviorKpiUpdate = {
  id: string;
  visitId: string;
  accountId: string;
  createdAt: string;
  actualDurationMinutes: number;
  captureQuality: number;
  tasksClosed: number;
  tasksCreated: number;
  punctualityScore: number;
  crmCompleteness: number;
};

export type MapPinType = 'scheduledVisit' | 'activeAccount' | 'opportunity' | 'risk' | 'completed';

export type NearbyRecommendation = {
  id: string;
  accountId: string;
  reason: 'highValue' | 'overdueTask' | 'inactiveAccount' | 'scheduleGap' | 'risk';
  message: string;
  score: number;
  distanceMeters: number;
  etaMinutes: number;
};

export type MapDemoStep = {
  id: string;
  label: string;
  accountId: string;
  recommendationId?: string;
  location: LocationPoint;
  message: string;
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
  objectiveChecklist: VisitObjectiveAssessment[];
  extraction?: PostMeetingExtraction;
  writebackId?: string;
};

export type OfflineQueueItem = {
  id: string;
  createdAt: string;
  visitId: string;
  summary: ReviewSummary;
};

export type AgentStatus = 'OnSchedule' | 'AtRisk' | 'Missed' | 'InMeeting' | 'Offline';

export type FieldAgent = Agent & {
  avatarInitials: string;
  status: AgentStatus;
  latitude: number;
  longitude: number;
  currentCustomer?: string;
  completionPercent: number;
  crmCompletionRate: number;
  routeEfficiency: number;
  onTimeArrivalRate: number;
  productiveHours: number;
};

export type AgentPerformanceSnapshot = {
  agentId: string;
  visitsCompleted: number;
  visitsScheduled: number;
  opportunityUpdates: number;
  followUpTasksCompleted: number;
  followUpTasksOpen: number;
  overdueTasks: number;
  averageResponseHours: number;
  crmUpdatesSubmitted: number;
  missedVisits: number;
};

export type ManagerInsight = {
  id: string;
  agentId?: string;
  accountId?: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'coaching' | 'risk' | 'productivity' | 'coverage' | 'crm';
  title: string;
  message: string;
  recommendedAction: string;
};

export type HistoricalTrendPoint = {
  date: string;
  teamCompletion: number;
  crmCompletion: number;
  visitsCompleted: number;
  tasksCompleted: number;
};

export type AccountCoverageMetric = {
  accountId: string;
  lastVisitDaysAgo: number;
  visitsThisWeek: number;
  engagementFrequency: 'High' | 'Medium' | 'Low';
  riskScore: number;
  pipelineHealth: 'Healthy' | 'Watch' | 'AtRisk';
  pipelineAmount: number;
};

export type TerritoryMetric = {
  territory: string;
  visitsCompleted: number;
  travelRatio: number;
  efficiency: number;
};

export type ReportingTab = 'overview' | 'team' | 'accounts' | 'insights';
