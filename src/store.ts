import { createStore, produce } from 'solid-js/store';
import { cancelMobileNotifications, sendMobileNotification } from './mobileNotifications';
import {
  accountCoverageMetrics,
  accounts,
  activities,
  agentPerformanceSnapshots,
  contacts,
  defaultInterviewQuestions,
  demoAgent,
  demoLocation,
  fieldAgents,
  historicalTrends,
  initialTasks,
  managerInsights,
  opportunities,
  territoryMetrics,
  visits,
} from './data';
import { assistantTiming, buildMapDemoSteps, buildNavigationUrl, buildObjectiveInterviewQuestions, buildPreMeetingBriefing, cancelSpeech, getActiveQuestions, getDistanceMeters, interpretVisitAnswers, makeId, pauseSpeech, resumeSpeech, speakText } from './services';
import type {
  AssistantNotification,
  BehaviorKpiUpdate,
  InterviewQuestion,
  LocationPoint,
  MapDemoStep,
  OfflineQueueItem,
  PostMeetingExtraction,
  PreMeetingBriefing,
  ProgressState,
  ReportingTab,
  ReviewSummary,
  SalesforceWritebackStatus,
  Task,
} from './types';

type AppState = {
  session: {
    isAuthenticated: boolean;
  };
  location: {
    current: LocationPoint;
    permission: 'idle' | 'granted' | 'denied';
    isDemo: boolean;
  };
  crm: {
    agent: typeof demoAgent;
    accounts: typeof accounts;
    contacts: typeof contacts;
    opportunities: typeof opportunities;
    activities: typeof activities;
    tasks: Task[];
  };
  manager: {
    agents: typeof fieldAgents;
    performance: typeof agentPerformanceSnapshots;
    insights: typeof managerInsights;
    trends: typeof historicalTrends;
    accountCoverage: typeof accountCoverageMetrics;
    territories: typeof territoryMetrics;
  };
  visits: typeof visits;
  settings: {
    questions: InterviewQuestion[];
    offlineMode: boolean;
  };
  progress: ProgressState;
  queue: OfflineQueueItem[];
  assistant: {
    isDemoMode: boolean;
    notifications: AssistantNotification[];
    briefings: PreMeetingBriefing[];
    extractions: PostMeetingExtraction[];
    writebacks: SalesforceWritebackStatus[];
    kpis: BehaviorKpiUpdate[];
  };
  ui: {
    activeVisitPromptId?: string;
    activeAssistantNotificationId?: string;
    toast?: string;
    selectedClientId?: string;
    selectedMapAccountId?: string;
    selectedMapVisitId?: string;
    visitBriefingAccountId?: string;
    activeRecommendationId?: string;
    isCoverageLayerVisible: boolean;
    dismissedRecommendationIds: string[];
    mapDemo: {
      isRunning: boolean;
      isPaused: boolean;
      isMoving: boolean;
      movementProgress: number;
      voiceMessage?: string;
      currentStepIndex: number;
      steps: MapDemoStep[];
    };
    meetingDemo: {
      isRunning: boolean;
      visitId?: string;
      progress: number;
      elapsedSeconds: number;
      durationSeconds: number;
      endsAt?: string;
    };
    selectedManagerAgentId?: string;
    reportingTab: ReportingTab;
    dismissedManagerInsightIds: string[];
  };
  questionnaire: {
    visitId?: string;
    mode: 'manual' | 'voice';
    snapshot: InterviewQuestion[];
    answers: Record<string, string>;
    review?: ReviewSummary;
    currentQuestionIndex: number;
  };
};

const load = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const initialProgress: ProgressState = { percent: 0, milestones: [] };
const itineraryReminderStorageKey = 'sales-demo-itinerary-reminder-scheduled-at';
const itineraryReminderDelaySeconds = 10;
const itineraryReminderCount = 1;
const legacyItineraryReminderCount = 36;
const itineraryReminderBaseId = 'itinerary-reminder';
const storageKeys = [
  'sales-demo-visits',
  'sales-demo-progress',
  'sales-demo-questions',
  'sales-demo-queue',
  'sales-demo-tasks',
  'sales-demo-offline',
  'sales-demo-reporting-tab',
  'sales-demo-dismissed-manager-insights',
  'sales-demo-dismissed-recommendations',
  'sales-demo-assistant-notifications',
  'sales-demo-assistant-briefings',
  'sales-demo-assistant-extractions',
  'sales-demo-assistant-writebacks',
  'sales-demo-assistant-kpis',
  itineraryReminderStorageKey,
];

const initialMapDemoState = () => ({
  isRunning: false,
  isPaused: false,
  isMoving: false,
  movementProgress: 0,
  voiceMessage: undefined,
  currentStepIndex: 0,
  steps: [] as MapDemoStep[],
});

const initialMeetingDemoState = () => ({
  isRunning: false,
  visitId: undefined,
  progress: 0,
  elapsedSeconds: 0,
  durationSeconds: assistantTiming.demo.postMeetingWindowSeconds,
  endsAt: undefined,
});

const loadVisitsWithDefaults = () => {
  const storedVisits = load('sales-demo-visits', visits);
  const nextVisits = visits.map((defaultVisit) => {
    const storedVisit = storedVisits.find((visit) => visit.id === defaultVisit.id || visit.accountId === defaultVisit.accountId);
    if (!storedVisit) return defaultVisit;
    return {
      ...defaultVisit,
      status: storedVisit.status,
      startedAt: storedVisit.startedAt,
      finishedAt: storedVisit.finishedAt,
      durationMinutes: storedVisit.durationMinutes,
      outcome: storedVisit.outcome,
      notes: storedVisit.notes,
      pendingSync: storedVisit.pendingSync,
    };
  });
  save('sales-demo-visits', nextVisits);
  return nextVisits;
};

let mapDemoTimer: ReturnType<typeof setInterval> | undefined;
let preMeetingDemoTimer: ReturnType<typeof setTimeout> | undefined;
let postMeetingDemoTimer: ReturnType<typeof setInterval> | undefined;
let notificationAudioContext: AudioContext | undefined;

const clearMapDemoTimer = () => {
  if (!mapDemoTimer) return;
  clearInterval(mapDemoTimer);
  mapDemoTimer = undefined;
};

const clearAssistantDemoTimers = () => {
  if (preMeetingDemoTimer) {
    clearTimeout(preMeetingDemoTimer);
    preMeetingDemoTimer = undefined;
  }
  if (postMeetingDemoTimer) {
    clearInterval(postMeetingDemoTimer);
    postMeetingDemoTimer = undefined;
  }
  setState('ui', 'meetingDemo', initialMeetingDemoState());
};

const announceMapDemo = (message: string) => {
  setState('ui', 'mapDemo', 'voiceMessage', message);
  speakText(message, 'en-US');
};

const playNotificationSound = () => {
  try {
    notificationAudioContext ??= new AudioContext();
    const context = notificationAudioContext;
    const playTone = (frequency: number, startOffset: number) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + startOffset + 0.22);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + startOffset);
      oscillator.stop(context.currentTime + startOffset + 0.24);
    };
    playTone(880, 0);
    playTone(1175, 0.16);
  } catch {
    // Browsers can block audio until user interaction; the visual notification still works.
  }
};

const dashboardRoute = '/dashboard';

const itineraryReminderIds = (count = itineraryReminderCount) =>
  Array.from({ length: count }, (_, index) => `${itineraryReminderBaseId}-${index + 1}`);
const legacyItineraryReminderIds = () => itineraryReminderIds(legacyItineraryReminderCount);

const notifyMobile = (notification: {
  id: string;
  title: string;
  body: string;
  route?: string;
  visitId?: string;
  accountId?: string;
  assistantNotificationId?: string;
  type?: string;
  scheduleAt?: Date;
}) => {
  void sendMobileNotification(notification);
};

export const [state, setState] = createStore<AppState>({
  session: load('sales-demo-session', { isAuthenticated: false }),
  location: { current: demoLocation, permission: 'idle', isDemo: true },
  crm: {
    agent: demoAgent,
    accounts: [...accounts],
    contacts: [...contacts],
    opportunities: [...opportunities],
    activities: [...activities],
    tasks: load('sales-demo-tasks', initialTasks),
  },
  manager: {
    agents: [...fieldAgents],
    performance: [...agentPerformanceSnapshots],
    insights: [...managerInsights],
    trends: [...historicalTrends],
    accountCoverage: [...accountCoverageMetrics],
    territories: [...territoryMetrics],
  },
  visits: loadVisitsWithDefaults(),
  settings: {
    questions: load('sales-demo-questions', defaultInterviewQuestions),
    offlineMode: load('sales-demo-offline', false),
  },
  progress: load('sales-demo-progress', initialProgress),
  queue: load('sales-demo-queue', [] as OfflineQueueItem[]),
  assistant: {
    isDemoMode: true,
    notifications: load('sales-demo-assistant-notifications', [] as AssistantNotification[]),
    briefings: load('sales-demo-assistant-briefings', [] as PreMeetingBriefing[]),
    extractions: load('sales-demo-assistant-extractions', [] as PostMeetingExtraction[]),
    writebacks: load('sales-demo-assistant-writebacks', [] as SalesforceWritebackStatus[]),
    kpis: load('sales-demo-assistant-kpis', [] as BehaviorKpiUpdate[]),
  },
  ui: {
    activeAssistantNotificationId: undefined,
    selectedClientId: undefined,
    selectedMapAccountId: undefined,
    selectedMapVisitId: undefined,
    visitBriefingAccountId: undefined,
    activeRecommendationId: undefined,
    isCoverageLayerVisible: false,
    dismissedRecommendationIds: load('sales-demo-dismissed-recommendations', [] as string[]),
    mapDemo: initialMapDemoState(),
    meetingDemo: initialMeetingDemoState(),
    selectedManagerAgentId: fieldAgents[0]?.id,
    reportingTab: load('sales-demo-reporting-tab', 'overview' as ReportingTab),
    dismissedManagerInsightIds: load('sales-demo-dismissed-manager-insights', [] as string[]),
  },
  questionnaire: {
    mode: 'manual',
    snapshot: [],
    answers: {},
    currentQuestionIndex: 0,
  },
});

const persistVisits = () => save('sales-demo-visits', state.visits);
const persistProgress = () => save('sales-demo-progress', state.progress);
const persistQuestions = () => save('sales-demo-questions', state.settings.questions);
const persistQueue = () => save('sales-demo-queue', state.queue);
const persistTasks = () => save('sales-demo-tasks', state.crm.tasks);
const persistReportingTab = () => save('sales-demo-reporting-tab', state.ui.reportingTab);
const persistDismissedManagerInsights = () => save('sales-demo-dismissed-manager-insights', state.ui.dismissedManagerInsightIds);
const persistDismissedRecommendations = () => save('sales-demo-dismissed-recommendations', state.ui.dismissedRecommendationIds);
const persistAssistant = () => {
  save('sales-demo-assistant-notifications', state.assistant.notifications);
  save('sales-demo-assistant-briefings', state.assistant.briefings);
  save('sales-demo-assistant-extractions', state.assistant.extractions);
  save('sales-demo-assistant-writebacks', state.assistant.writebacks);
  save('sales-demo-assistant-kpis', state.assistant.kpis);
};

const addProgress = (amount: number) => {
  setState('progress', produce((progress) => {
    progress.percent = Math.min(100, progress.percent + amount);
    const milestones = [
      { value: 25, label: 'Great Start!' },
      { value: 50, label: 'You are on track!' },
      { value: 75, label: 'Excellent field activity!' },
      { value: 100, label: 'Daily Mission Complete!' },
    ];
    milestones.forEach((milestone) => {
      if (progress.percent >= milestone.value && !progress.milestones.includes(milestone.label)) {
        progress.milestones.push(milestone.label);
      }
    });
  }));
  persistProgress();
};

const getVisitContext = (visitId: string) => {
  const visit = state.visits.find((item) => item.id === visitId);
  if (!visit) return undefined;
  const account = state.crm.accounts.find((item) => item.id === visit.accountId);
  if (!account) return undefined;
  const contactsForAccount = state.crm.contacts.filter((contact) => contact.accountId === account.id);
  const opportunity = state.crm.opportunities.find((item) => item.accountId === account.id);
  const tasksForAccount = state.crm.tasks.filter((task) => task.accountId === account.id);
  const activitiesForAccount = state.crm.activities.filter((activity) => activity.accountId === account.id);
  return { visit, account, contactsForAccount, opportunity, tasksForAccount, activitiesForAccount };
};

const upsertBriefing = (briefing: PreMeetingBriefing) => {
  const index = state.assistant.briefings.findIndex((item) => item.visitId === briefing.visitId);
  if (index >= 0) {
    setState('assistant', 'briefings', index, briefing);
  } else {
    setState('assistant', 'briefings', state.assistant.briefings.length, briefing);
  }
};

const upsertNotification = (notification: AssistantNotification) => {
  const index = state.assistant.notifications.findIndex((item) => item.id === notification.id);
  if (index >= 0) {
    setState('assistant', 'notifications', index, notification);
  } else {
    setState('assistant', 'notifications', state.assistant.notifications.length, notification);
  }
  if (notification.status === 'unread') {
    notifyMobile({
      id: `assistant-${notification.id}`,
      title: notification.title,
      body: notification.message,
      route: dashboardRoute,
      visitId: notification.visitId,
      accountId: notification.accountId,
      assistantNotificationId: notification.id,
      type: notification.type,
    });
  }
};

const createDefaultWriteback = (review: ReviewSummary): SalesforceWritebackStatus | undefined => {
  const extraction = review.extraction;
  if (!extraction) return undefined;
  const now = new Date().toISOString();
  return {
    id: makeId('writeback'),
    visitId: review.visitId,
    accountId: extraction.accountId,
    extractionId: extraction.id,
    status: state.settings.offlineMode ? 'pending' : 'synced',
    createdAt: now,
    updatedAt: now,
    steps: [
      { id: 'account', label: 'Account', status: 'synced' },
      { id: 'opportunity', label: 'Opportunity', status: review.opportunityUpdate ? 'synced' : 'pending' },
      { id: 'tasks', label: 'Tasks', status: review.tasks.length ? 'synced' : 'pending' },
      { id: 'calendar', label: 'Calendar event', status: extraction.futureMeetingDate ? 'synced' : 'pending' },
      { id: 'kpi', label: 'Manager KPI sync', status: 'synced' },
    ],
  };
};

export const actions = {
  login() {
    setState('session', 'isAuthenticated', true);
    save('sales-demo-session', state.session);
    void actions.scheduleItineraryReminderNotification();
  },
  logout() {
    setState('session', 'isAuthenticated', false);
    save('sales-demo-session', state.session);
    localStorage.removeItem(itineraryReminderStorageKey);
  },
  showToast(message: string) {
    setState('ui', 'toast', message);
    setTimeout(() => setState('ui', 'toast', undefined), 2600);
  },
  async scheduleItineraryReminderNotification(options: { force?: boolean; showToast?: boolean; delaySeconds?: number } = {}) {
    if (!options.force && load<string | undefined>(itineraryReminderStorageKey, undefined)) {
      await cancelMobileNotifications(legacyItineraryReminderIds().slice(itineraryReminderCount));
      return;
    }
    const scheduledVisits = state.visits.filter((visit) => visit.status === 'Scheduled' || visit.status === 'InProgress');
    const firstVisit = scheduledVisits[0];
    const context = firstVisit ? getVisitContext(firstVisit.id) : undefined;
    const delaySeconds = options.delaySeconds ?? itineraryReminderDelaySeconds;
    const initialScheduleAt = new Date(Date.now() + delaySeconds * 1000);
    const reminder = {
      title: 'Your itinerary is ready',
      body: context
        ? `Open Sales Agent to review today's route and start with ${context.account.name}.`
        : "Open Sales Agent to review today's itinerary and start your field demo.",
      route: dashboardRoute,
      visitId: firstVisit?.id,
      accountId: context?.account.id,
      type: 'itineraryReminder',
    };
    await cancelMobileNotifications(legacyItineraryReminderIds());
    const results = await Promise.all(itineraryReminderIds().map((id) => sendMobileNotification({
      ...reminder,
      id,
      scheduleAt: initialScheduleAt,
    })));
    const sent = results.some(Boolean);
    if (sent) save(itineraryReminderStorageKey, initialScheduleAt.toISOString());
    if (options.showToast) {
      actions.showToast(sent ? 'Itinerary push notification scheduled.' : 'Install the mobile app and enable notifications first.');
    }
  },
  async cancelItineraryReminderNotifications() {
    await cancelMobileNotifications(legacyItineraryReminderIds());
    localStorage.removeItem(itineraryReminderStorageKey);
  },
  openAssistantNotification(notificationId: string) {
    const notification = state.assistant.notifications.find((item) => item.id === notificationId);
    if (!notification) return;
    setState('assistant', 'notifications', (item) => item.id === notificationId, 'status', 'opened');
    setState('ui', 'activeAssistantNotificationId', notificationId);
    actions.selectMapAccount(notification.accountId, notification.visitId, { showVisitBriefing: false });
    persistAssistant();
  },
  dismissAssistantNotification(notificationId: string) {
    setState('assistant', 'notifications', (item) => item.id === notificationId, 'status', 'dismissed');
    if (state.ui.activeAssistantNotificationId === notificationId) {
      setState('ui', 'activeAssistantNotificationId', undefined);
    }
    persistAssistant();
  },
  clearAssistantNotification() {
    setState('ui', 'activeAssistantNotificationId', undefined);
  },
  triggerDestinationEta(visitId: string, triggerReason: AssistantNotification['triggerReason'] = 'destinationStart') {
    const context = getVisitContext(visitId);
    if (!context) return;
    const notificationId = `eta-${visitId}`;
    upsertNotification({
      id: notificationId,
      type: 'destinationEta',
      visitId,
      accountId: context.account.id,
      title: 'Route alert',
      message: `You are 15 minutes away from your destination with ${context.account.name}.`,
      triggerReason,
      createdAt: new Date().toISOString(),
      status: 'unread',
    });
    persistAssistant();
    playNotificationSound();
  },
  triggerArrivalBriefing(visitId: string, triggerReason: AssistantNotification['triggerReason'] = 'simulatedArrival') {
    const context = getVisitContext(visitId);
    if (!context) return;
    const notificationId = `arrival-${visitId}`;
    setState('assistant', 'notifications', (item) => item.id === `eta-${visitId}`, 'status', 'dismissed');
    const distance = getDistanceMeters(state.location.current, {
      latitude: context.account.latitude,
      longitude: context.account.longitude,
    });
    const briefing = buildPreMeetingBriefing(
      context.visit,
      context.account,
      context.contactsForAccount,
      context.opportunity,
      context.tasksForAccount,
      context.activitiesForAccount,
      distance,
    );
    upsertBriefing(briefing);
    upsertNotification({
      id: notificationId,
      type: 'arrivalBriefing',
      visitId,
      accountId: context.account.id,
      title: 'You have arrived',
      message: `You have arrived at ${context.account.name}. Open the briefing before starting the visit.`,
      triggerReason,
      createdAt: new Date().toISOString(),
      status: 'unread',
    });
    persistAssistant();
    playNotificationSound();
    actions.showToast('Briefing ready.');
  },
  triggerPreMeetingBriefing(visitId: string, triggerReason: AssistantNotification['triggerReason'] = 'demoTimer') {
    actions.triggerArrivalBriefing(visitId, triggerReason);
  },
  /**
   * Entry point for the "Client brief ready" banner: builds the pre-meeting briefing from the
   * rep's REAL current position (no location mutation, unlike `startClientDestinationDemo`) and
   * opens the AISA sheet in the same tick — same inline-open pattern as
   * `triggerPostMeetingDebrief`, so no approach animation blocks the dialog.
   *
   * Notification id is `previsit-${visitId}` on purpose: `pre-${visitId}` is the id
   * `schedulePreMeetingDemo` guards on for the Map Demo tour, and no creator produces it today.
   */
  openPreVisitAisaBriefing(visitId: string, triggerReason: AssistantNotification['triggerReason'] = 'manualBriefRequest') {
    const context = getVisitContext(visitId);
    if (!context) return;
    const notificationId = `previsit-${visitId}`;
    const distance = getDistanceMeters(state.location.current, {
      latitude: context.account.latitude,
      longitude: context.account.longitude,
    });
    const briefing = buildPreMeetingBriefing(
      context.visit,
      context.account,
      context.contactsForAccount,
      context.opportunity,
      context.tasksForAccount,
      context.activitiesForAccount,
      distance,
    );
    upsertBriefing(briefing);
    upsertNotification({
      id: notificationId,
      type: 'preMeetingBriefing',
      visitId,
      accountId: context.account.id,
      title: `Briefing for ${context.account.name}`,
      message: `AISA prepared the pre-visit briefing for ${context.account.name}.`,
      triggerReason,
      createdAt: new Date().toISOString(),
      status: 'unread',
    });
    persistAssistant();
    setState('ui', 'visitBriefingAccountId', undefined);
    actions.openAssistantNotification(notificationId);
  },
  triggerPostMeetingDebrief(visitId: string, triggerReason: AssistantNotification['triggerReason'] = 'meetingTimer') {
    const context = getVisitContext(visitId);
    if (!context) return;
    const notificationId = `post-${visitId}`;
    upsertNotification({
      id: notificationId,
      type: 'postMeetingDebrief',
      visitId,
      accountId: context.account.id,
      title: 'Post-interview listening ready',
      message: `${context.account.name} is ready for passive listening. Demo: 30 minutes simulated in ${assistantTiming.demo.postMeetingWindowSeconds} sec.`,
      triggerReason,
      createdAt: new Date().toISOString(),
      status: 'unread',
    });
    persistAssistant();
    playNotificationSound();
    actions.showToast('Post-interview listening is ready.');
    actions.openAssistantNotification(notificationId);
  },
  schedulePreMeetingDemo(visitId: string) {
    if (!state.assistant.isDemoMode) return;
    if (state.assistant.notifications.some((item) => item.id === `pre-${visitId}` && item.status !== 'dismissed')) return;
    if (preMeetingDemoTimer) clearTimeout(preMeetingDemoTimer);
    preMeetingDemoTimer = setTimeout(() => {
      preMeetingDemoTimer = undefined;
      actions.triggerPreMeetingBriefing(visitId, 'demoTimer');
    }, assistantTiming.demo.preMeetingLeadSeconds * 1000);
  },
  schedulePostMeetingDemo(visitId: string) {
    if (!state.assistant.isDemoMode) return;
    if (postMeetingDemoTimer) clearInterval(postMeetingDemoTimer);
    const context = getVisitContext(visitId);
    const durationSeconds = assistantTiming.demo.postMeetingWindowSeconds;
    const tickMs = 125;
    const startedAt = Date.now();
    const endsAt = new Date(startedAt + durationSeconds * 1000);
    if (context) {
      notifyMobile({
        id: `assistant-post-${visitId}`,
        title: 'Post-interview listening ready',
        body: `${context.account.name} is ready for passive listening.`,
        route: dashboardRoute,
        visitId,
        accountId: context.account.id,
        type: 'postMeetingDebrief',
        scheduleAt: endsAt,
      });
    }
    const updateMeetingProgress = () => {
      const elapsedSeconds = Math.min(durationSeconds, Math.max(0, Math.round((Date.now() - startedAt) / 1000)));
      const progress = Math.min(elapsedSeconds / durationSeconds, 1);
      setState('ui', 'meetingDemo', {
        isRunning: true,
        visitId,
        progress: Math.round(progress * 100),
        elapsedSeconds,
        durationSeconds,
        endsAt: endsAt.toISOString(),
      });
      if (progress < 1) return;
      if (postMeetingDemoTimer) clearInterval(postMeetingDemoTimer);
      postMeetingDemoTimer = undefined;
      setState('ui', 'meetingDemo', initialMeetingDemoState());
      actions.triggerPostMeetingDebrief(visitId, 'meetingTimer');
    };
    setState('ui', 'meetingDemo', {
      isRunning: true,
      visitId,
      progress: 0,
      elapsedSeconds: 0,
      durationSeconds,
      endsAt: endsAt.toISOString(),
    });
    postMeetingDemoTimer = setInterval(() => {
      updateMeetingProgress();
    }, tickMs);
  },
  reconcileMeetingDemoProgress() {
    const demo = state.ui.meetingDemo;
    if (!demo.isRunning || !demo.visitId || !demo.endsAt) return;
    const endsAt = Date.parse(demo.endsAt);
    if (!Number.isFinite(endsAt)) return;
    const elapsedSeconds = Math.min(demo.durationSeconds, Math.max(0, Math.round((Date.now() - (endsAt - demo.durationSeconds * 1000)) / 1000)));
    const progress = Math.min(elapsedSeconds / demo.durationSeconds, 1);
    if (progress < 1) {
      setState('ui', 'meetingDemo', {
        ...demo,
        progress: Math.round(progress * 100),
        elapsedSeconds,
      });
      return;
    }
    if (postMeetingDemoTimer) clearInterval(postMeetingDemoTimer);
    postMeetingDemoTimer = undefined;
    setState('ui', 'meetingDemo', initialMeetingDemoState());
    actions.triggerPostMeetingDebrief(demo.visitId, 'meetingTimer');
  },
  selectManagerAgent(agentId?: string) {
    setState('ui', 'selectedManagerAgentId', agentId);
  },
  setReportingTab(tab: ReportingTab) {
    setState('ui', 'reportingTab', tab);
    persistReportingTab();
  },
  dismissManagerInsight(insightId: string) {
    if (state.ui.dismissedManagerInsightIds.includes(insightId)) return;
    setState('ui', 'dismissedManagerInsightIds', state.ui.dismissedManagerInsightIds.length, insightId);
    persistDismissedManagerInsights();
  },
  selectClient(accountId?: string) {
    setState('ui', 'selectedClientId', accountId);
  },
  selectMapAccount(accountId: string, visitId?: string, options: { showVisitBriefing?: boolean } = {}) {
    const relatedVisit = visitId ? state.visits.find((visit) => visit.id === visitId) : state.visits.find((visit) => visit.accountId === accountId);
    setState('ui', 'selectedMapAccountId', accountId);
    setState('ui', 'selectedMapVisitId', relatedVisit?.id);
    setState('ui', 'visitBriefingAccountId', options.showVisitBriefing === false ? undefined : accountId);
  },
  selectMapVisit(visitId: string) {
    const visit = state.visits.find((item) => item.id === visitId);
    if (!visit) return;
    actions.selectMapAccount(visit.accountId, visit.id);
  },
  clearMapSelection() {
    setState('ui', 'selectedMapAccountId', undefined);
    setState('ui', 'selectedMapVisitId', undefined);
    setState('ui', 'visitBriefingAccountId', undefined);
  },
  dismissRecommendation(recommendationId: string) {
    if (!state.ui.dismissedRecommendationIds.includes(recommendationId)) {
      setState('ui', 'dismissedRecommendationIds', state.ui.dismissedRecommendationIds.length, recommendationId);
      persistDismissedRecommendations();
    }
    if (state.ui.activeRecommendationId === recommendationId) {
      setState('ui', 'activeRecommendationId', undefined);
    }
  },
  toggleCoverageLayer() {
    setState('ui', 'isCoverageLayerVisible', (value) => !value);
  },
  requestBrowserLocation() {
    if (!navigator.geolocation) {
      actions.useDemoLocation();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState('location', {
          current: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          permission: 'granted',
          isDemo: false,
        });
        actions.checkGeofences();
      },
      () => {
        setState('location', 'permission', 'denied');
        actions.showToast('Location permission denied. Demo location is ready.');
      },
      { enableHighAccuracy: true, timeout: 7000 },
    );
  },
  useDemoLocation() {
    setState('location', { current: demoLocation, permission: 'granted', isDemo: true });
    actions.checkGeofences();
  },
  focusVisitLocation(visitId: string) {
    const visit = state.visits.find((item) => item.id === visitId);
    if (!visit) return;
    setState('location', {
      current: { latitude: visit.latitude, longitude: visit.longitude },
      permission: 'granted',
      isDemo: true,
    });
    actions.checkGeofences();
  },
  focusAccountLocation(accountId: string) {
    const account = state.crm.accounts.find((item) => item.id === accountId);
    if (!account) return;
    const visit = state.visits.find((item) => item.accountId === account.id);
    setState('location', {
      current: { latitude: account.latitude - 0.001, longitude: account.longitude + 0.001 },
      permission: 'granted',
      isDemo: true,
    });
    actions.selectMapAccount(account.id, visit?.id);
    actions.checkGeofences();
  },
  openNavigation(accountId: string) {
    const account = state.crm.accounts.find((item) => item.id === accountId);
    if (!account) return;
    globalThis.open(buildNavigationUrl(account), '_blank', 'noopener,noreferrer');
  },
  /**
   * ~15s route animation toward `accountId`. Single call site: the "Simulate approach" CTA in
   * `AisaBriefingDialog`. It clears `activeAssistantNotificationId` up front, so the AISA sheet
   * closes as the animation starts and the map is visible for its whole run.
   */
  startClientDestinationDemo(accountId: string) {
    clearMapDemoTimer();
    const account = state.crm.accounts.find((item) => item.id === accountId);
    if (!account) return;
    const visit = state.visits.find((item) => item.accountId === account.id);
    const start = { ...state.location.current };
    const end = { latitude: account.latitude, longitude: account.longitude };
    const frames = Math.max(1, Math.round((assistantTiming.demo.preMeetingLeadSeconds * 1000) / 125));
    let frame = 0;

    setState('ui', 'activeAssistantNotificationId', undefined);
    setState('ui', 'activeVisitPromptId', undefined);
    setState('ui', 'visitBriefingAccountId', undefined);

    if (visit) {
      setState('assistant', 'notifications', (item) =>
        item.visitId === visit.id
        && (item.type === 'destinationEta' || item.type === 'arrivalBriefing' || item.type === 'preMeetingBriefing'),
      'status', 'dismissed');
      persistAssistant();
    }

    setState('ui', 'selectedMapAccountId', undefined);
    setState('ui', 'selectedMapVisitId', undefined);
    setState('ui', 'activeRecommendationId', undefined);
    setState('ui', 'mapDemo', {
      isRunning: true,
      isPaused: false,
      isMoving: true,
      movementProgress: 0,
      voiceMessage: `You are 15 minutes away from your destination with ${account.name}.`,
      currentStepIndex: 0,
      steps: [{
        id: `client-demo-${account.id}`,
        label: 'Selected destination',
        accountId: account.id,
        location: end,
        message: `Simulating route to ${account.name}.`,
      }],
    });
    setState('location', { current: start, permission: 'granted', isDemo: true });
    speakText(`You are 15 minutes away from your destination with ${account.name}.`, 'en-US');

    mapDemoTimer = setInterval(() => {
      if (!state.ui.mapDemo.isRunning) {
        clearMapDemoTimer();
        return;
      }
      frame += 1;
      const progress = Math.min(frame / frames, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      setState('location', {
        current: {
          latitude: start.latitude + (end.latitude - start.latitude) * eased,
          longitude: start.longitude + (end.longitude - start.longitude) * eased,
        },
        permission: 'granted',
        isDemo: true,
      });
      setState('ui', 'mapDemo', 'movementProgress', Math.round(progress * 100));

      if (progress >= 1) {
        clearMapDemoTimer();
        setState('location', { current: end, permission: 'granted', isDemo: true });
        setState('ui', 'mapDemo', initialMapDemoState());
        if (visit) {
          // No `triggerArrivalBriefing` here: this animation is now only reachable from the
          // "Simulate approach" CTA inside a briefing the rep has already read, so re-raising an
          // arrivalBriefing notification would reopen the sheet they just closed.
          setState('ui', 'activeVisitPromptId', visit.id);
        }
        actions.showToast(`Arrived near ${account.name}.`);
      }
    }, 125);
  },
  startMapDemo() {
    clearMapDemoTimer();
    const steps = buildMapDemoSteps(state.crm.accounts, state.visits, []);
    if (!steps.length) return;
    setState('ui', 'mapDemo', {
      isRunning: true,
      isPaused: false,
      isMoving: false,
      movementProgress: 0,
      voiceMessage: undefined,
      currentStepIndex: 0,
      steps,
    });
    speakText('Route demo started. I will guide you through each customer stop.', 'en-US');
    actions.animateMapDemoStep(0);
    const firstStep = steps[0];
    const firstVisit = firstStep ? state.visits.find((item) => item.accountId === firstStep.accountId && item.status === 'Scheduled') : undefined;
    if (firstVisit) {
      actions.triggerPreMeetingBriefing(firstVisit.id, 'demoTimer');
    }
    actions.showToast('Map demo started.');
  },
  applyMapDemoStep(stepIndex: number) {
    const step = state.ui.mapDemo.steps[stepIndex];
    if (!step) return;
    const visit = state.visits.find((item) => item.accountId === step.accountId);
    setState('location', {
      current: step.location,
      permission: 'granted',
      isDemo: true,
    });
    setState('ui', 'selectedMapAccountId', step.accountId);
    setState('ui', 'selectedMapVisitId', visit?.id);
    setState('ui', 'visitBriefingAccountId', undefined);
    setState('ui', 'activeRecommendationId', step.recommendationId);
    setState('ui', 'mapDemo', 'isMoving', false);
    setState('ui', 'mapDemo', 'movementProgress', 100);
    const account = state.crm.accounts.find((item) => item.id === step.accountId);
    if (account) {
      announceMapDemo(`You have arrived at your destination. You are visiting ${account.name}.`);
    }
  },
  animateMapDemoStep(stepIndex: number) {
    clearMapDemoTimer();
    const step = state.ui.mapDemo.steps[stepIndex];
    if (!step) return;
    const start = { ...state.location.current };
    const end = step.location;
    const frames = 48;
    let frame = 0;
    const account = state.crm.accounts.find((item) => item.id === step.accountId);
    const visit = state.visits.find((item) => item.accountId === step.accountId && item.status === 'Scheduled');

    setState('ui', 'selectedMapAccountId', undefined);
    setState('ui', 'selectedMapVisitId', undefined);
    setState('ui', 'visitBriefingAccountId', undefined);
    setState('ui', 'activeRecommendationId', undefined);
    setState('ui', 'mapDemo', 'isMoving', true);
    setState('ui', 'mapDemo', 'movementProgress', 0);
    setState('location', { current: start, permission: 'granted', isDemo: true });
    if (account) {
      announceMapDemo(`You are approaching your destination. Next customer visit: ${account.name}.`);
    }
    if (visit) {
      actions.schedulePreMeetingDemo(visit.id);
    }

    mapDemoTimer = setInterval(() => {
      if (!state.ui.mapDemo.isRunning) {
        clearMapDemoTimer();
        return;
      }
      if (state.ui.mapDemo.isPaused) return;

      frame += 1;
      const progress = Math.min(frame / frames, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      setState('location', {
        current: {
          latitude: start.latitude + (end.latitude - start.latitude) * eased,
          longitude: start.longitude + (end.longitude - start.longitude) * eased,
        },
        permission: 'granted',
        isDemo: true,
      });
      setState('ui', 'mapDemo', 'movementProgress', Math.round(progress * 100));

      if (progress >= 1) {
        clearMapDemoTimer();
        actions.applyMapDemoStep(stepIndex);
        actions.checkGeofences();
      }
    }, 125);
  },
  advanceMapDemoStep() {
    if (!state.ui.mapDemo.isRunning) {
      actions.startMapDemo();
      return;
    }
    const nextIndex = Math.min(state.ui.mapDemo.currentStepIndex + 1, state.ui.mapDemo.steps.length - 1);
    setState('ui', 'mapDemo', 'currentStepIndex', nextIndex);
    setState('ui', 'mapDemo', 'isPaused', false);
    actions.animateMapDemoStep(nextIndex);
  },
  pauseMapDemo() {
    if (!state.ui.mapDemo.isRunning) return;
    const willPause = !state.ui.mapDemo.isPaused;
    setState('ui', 'mapDemo', 'isPaused', willPause);
    if (willPause) {
      pauseSpeech();
    } else {
      resumeSpeech();
    }
  },
  stopMapDemo() {
    clearMapDemoTimer();
    clearAssistantDemoTimers();
    cancelSpeech();
    setState('ui', 'mapDemo', initialMapDemoState());
    setState('ui', 'meetingDemo', initialMeetingDemoState());
    setState('ui', 'activeRecommendationId', undefined);
  },
  checkGeofences() {
    const visit = state.visits.find((item) => {
      const distance = getDistanceMeters(state.location.current, {
        latitude: item.latitude,
        longitude: item.longitude,
      });
      return item.status === 'Scheduled' && distance <= item.radiusMeters;
    });
    if (visit) {
      setState('ui', 'activeVisitPromptId', visit.id);
      const context = getVisitContext(visit.id);
      if (context) {
        notifyMobile({
          id: `visit-radius-${visit.id}`,
          title: 'Visit ready to start',
          body: `You are inside the scheduled visit radius for ${context.account.name}.`,
          route: '/dashboard',
          visitId: visit.id,
          accountId: context.account.id,
          type: 'visitRadius',
        });
      }
    }
  },
  startVisit(visitId: string) {
    const context = getVisitContext(visitId);
    setState('visits', (visit) => visit.id === visitId, 'status', 'InProgress');
    setState('visits', (visit) => visit.id === visitId, 'startedAt', new Date().toISOString());
    setState('ui', 'activeVisitPromptId', undefined);
    addProgress(10);
    persistVisits();
    actions.schedulePostMeetingDemo(visitId);
    notifyMobile({
      id: `visit-started-${visitId}`,
      title: 'Visit started',
      body: `${context?.account.name ?? 'Customer visit'} is now in progress.`,
      route: dashboardRoute,
      visitId,
      accountId: context?.account.id,
      type: 'visitStarted',
    });
    actions.showToast('Visit marked in progress.');
  },
  dismissVisitPrompt() {
    setState('ui', 'activeVisitPromptId', undefined);
  },
  finishInterview(visitId: string) {
    const context = getVisitContext(visitId);
    setState('visits', (visit) => visit.id === visitId, 'status', 'InterviewFinished');
    setState('visits', (visit) => visit.id === visitId, 'finishedAt', new Date().toISOString());
    persistVisits();
    actions.schedulePostMeetingDemo(visitId);
    notifyMobile({
      id: `interview-finished-${visitId}`,
      title: 'Interview finished',
      body: `Post-interview listening is unlocked for ${context?.account.name ?? 'this visit'}.`,
      route: dashboardRoute,
      visitId,
      accountId: context?.account.id,
      type: 'interviewFinished',
    });
    actions.showToast('Interview finished. Listening unlocked.');
  },
  beginQuestionnaire(visitId: string, mode: 'manual' | 'voice') {
    setState('visits', (visit) => visit.id === visitId, 'status', 'Questionnaire');
    if (state.questionnaire.visitId === visitId && state.questionnaire.snapshot.length) {
      setState('questionnaire', 'mode', mode);
    } else {
      const visit = state.visits.find((item) => item.id === visitId);
      const account = visit ? state.crm.accounts.find((item) => item.id === visit.accountId) : undefined;
      const opportunity = account ? state.crm.opportunities.find((item) => item.accountId === account.id) : undefined;
      const snapshot = account
        ? buildObjectiveInterviewQuestions(account, opportunity)
        : getActiveQuestions(state.settings.questions);
      setState('questionnaire', {
        visitId,
        mode,
        snapshot,
        answers: {},
        review: undefined,
        currentQuestionIndex: 0,
      });
    }
    persistVisits();
  },
  setQuestionnaireMode(mode: 'manual' | 'voice') {
    setState('questionnaire', 'mode', mode);
  },
  updateAnswer(questionId: string, answer: string) {
    setState('questionnaire', 'answers', questionId, answer);
  },
  nextQuestion() {
    setState('questionnaire', 'currentQuestionIndex', (index) => Math.min(index + 1, Math.max(state.questionnaire.snapshot.length - 1, 0)));
  },
  previousQuestion() {
    setState('questionnaire', 'currentQuestionIndex', (index) => Math.max(index - 1, 0));
  },
  goToQuestion(index: number) {
    setState('questionnaire', 'currentQuestionIndex', Math.max(0, Math.min(index, Math.max(state.questionnaire.snapshot.length - 1, 0))));
  },
  nextVoiceQuestion() {
    actions.nextQuestion();
  },
  buildReview() {
    const visit = state.visits.find((item) => item.id === state.questionnaire.visitId);
    if (!visit) return;
    const account = state.crm.accounts.find((item) => item.id === visit.accountId);
    if (!account) return;
    const opportunity = state.crm.opportunities.find((item) => item.accountId === account.id);
    const hadReview = Boolean(state.questionnaire.review);
    const review = interpretVisitAnswers(visit.id, account, opportunity, state.questionnaire.snapshot, state.questionnaire.answers);
    setState('questionnaire', 'review', review);
    if (review.extraction && !state.assistant.extractions.some((item) => item.id === review.extraction?.id)) {
      setState('assistant', 'extractions', state.assistant.extractions.length, review.extraction);
      persistAssistant();
    }
    if (!hadReview) addProgress(20);
  },
  updateReview(updater: (review: ReviewSummary) => ReviewSummary) {
    const review = state.questionnaire.review;
    if (!review) return;
    setState('questionnaire', 'review', updater(review));
  },
  confirmReview() {
    const review = state.questionnaire.review;
    if (!review) return;
    if (state.settings.offlineMode) {
      const item: OfflineQueueItem = {
        id: makeId('queue'),
        createdAt: new Date().toISOString(),
        visitId: review.visitId,
        summary: review,
      };
      setState('queue', state.queue.length, item);
      setState('visits', (visit) => visit.id === review.visitId, 'pendingSync', true);
      persistQueue();
      notifyMobile({
        id: `crm-queued-${review.visitId}`,
        title: 'CRM update queued',
        body: 'Your post-interview checklist was saved offline and will sync when network mode is restored.',
        route: dashboardRoute,
        visitId: review.visitId,
        accountId: review.accountUpdate.accountId,
        type: 'crmQueued',
      });
      actions.showToast('Saved to pending sync queue.');
    } else {
      actions.applyReview(review);
      notifyMobile({
        id: `crm-updated-${review.visitId}`,
        title: 'CRM updated',
        body: 'Salesforce updates were generated and synced from the post-interview checklist.',
        route: dashboardRoute,
        visitId: review.visitId,
        accountId: review.accountUpdate.accountId,
        type: 'crmSynced',
      });
      actions.showToast('CRM updated successfully.');
    }
    const writeback = createDefaultWriteback(review);
    if (writeback) {
      setState('assistant', 'writebacks', state.assistant.writebacks.length, writeback);
      setState('assistant', 'kpis', state.assistant.kpis.length, {
        id: makeId('kpi'),
        visitId: review.visitId,
        accountId: review.accountUpdate.accountId,
        createdAt: new Date().toISOString(),
        actualDurationMinutes: review.eventUpdate.durationMinutes,
        captureQuality: review.extraction
          ? Math.round(Object.values(review.extraction.confidence).reduce((total, value) => total + value, 0) / 5)
          : 72,
        tasksClosed: review.extraction?.completedTaskIds.length ?? 0,
        tasksCreated: review.tasks.length,
        punctualityScore: 88,
        crmCompleteness: review.extraction?.missingFields.length ? 78 : 96,
      });
      persistAssistant();
    }
    setState('visits', (visit) => visit.id === review.visitId, 'status', 'Completed');
    setState('visits', (visit) => visit.id === review.visitId, 'outcome', review.eventUpdate.outcome);
    setState('visits', (visit) => visit.id === review.visitId, 'durationMinutes', review.eventUpdate.durationMinutes);
    setState('visits', (visit) => visit.id === review.visitId, 'notes', review.eventUpdate.notes);
    addProgress(review.opportunityUpdate ? 15 : 0);
    addProgress(review.tasks.length ? 10 : 0);
    addProgress(review.attachments.length ? 5 : 0);
    persistVisits();
    setState('questionnaire', {
      visitId: undefined,
      mode: state.questionnaire.mode,
      snapshot: [],
      answers: {},
      review: undefined,
      currentQuestionIndex: 0,
    });
  },
  applyReview(review: ReviewSummary) {
    if (review.opportunityUpdate) {
      setState('crm', 'opportunities', (item) => item.id === review.opportunityUpdate?.opportunityId, produce((opportunity) => {
        if (!review.opportunityUpdate) return;
        opportunity.stage = review.opportunityUpdate.stage;
        opportunity.probability = review.opportunityUpdate.probability;
        opportunity.nextStep = review.opportunityUpdate.nextStep;
      }));
    }
    setState('crm', 'accounts', (item) => item.id === review.accountUpdate.accountId, produce((account) => {
      account.status = review.accountUpdate.status;
      account.risks = review.accountUpdate.risks;
    }));
    review.tasks.forEach((task) => setState('crm', 'tasks', state.crm.tasks.length, task));
    setState('visits', (visit) => visit.id === review.visitId, 'pendingSync', false);
    persistTasks();
  },
  syncQueue() {
    state.queue.forEach((item) => actions.applyReview(item.summary));
    const syncedCount = state.queue.length;
    setState('queue', []);
    setState('visits', produce((items) => items.forEach((visit) => {
      visit.pendingSync = false;
    })));
    persistQueue();
    persistVisits();
    notifyMobile({
      id: `queue-synced-${Date.now()}`,
      title: 'Pending sync completed',
      body: `${syncedCount} pending CRM update${syncedCount === 1 ? '' : 's'} synced successfully.`,
      route: dashboardRoute,
      type: 'queueSynced',
    });
    actions.showToast('Pending sync completed.');
  },
  clearTasks() {
    setState('crm', 'tasks', []);
    persistTasks();
    actions.showToast('Generated tasks cleared.');
  },
  resetDemoActivity() {
    clearMapDemoTimer();
    clearAssistantDemoTimers();
    cancelSpeech();
    setState('visits', visits.map((visit) => ({ ...visit })));
    setState('progress', { ...initialProgress, milestones: [] });
    setState('queue', []);
    setState('assistant', {
      isDemoMode: true,
      notifications: [],
      briefings: [],
      extractions: [],
      writebacks: [],
      kpis: [],
    });
    setState('crm', 'tasks', initialTasks.map((task) => ({ ...task })));
    setState('ui', {
      activeVisitPromptId: undefined,
      activeAssistantNotificationId: undefined,
      toast: undefined,
      selectedClientId: undefined,
      selectedMapAccountId: undefined,
      selectedMapVisitId: undefined,
      visitBriefingAccountId: undefined,
      activeRecommendationId: undefined,
      isCoverageLayerVisible: state.ui.isCoverageLayerVisible,
      dismissedRecommendationIds: state.ui.dismissedRecommendationIds,
      mapDemo: initialMapDemoState(),
      meetingDemo: initialMeetingDemoState(),
      selectedManagerAgentId: state.ui.selectedManagerAgentId,
      reportingTab: state.ui.reportingTab,
      dismissedManagerInsightIds: state.ui.dismissedManagerInsightIds,
    });
    setState('questionnaire', {
      visitId: undefined,
      mode: state.questionnaire.mode,
      snapshot: [],
      answers: {},
      review: undefined,
      currentQuestionIndex: 0,
    });
    persistVisits();
    persistProgress();
    persistQueue();
    persistTasks();
    persistAssistant();
    actions.showToast('Demo activity reset.');
  },
  resetApp() {
    clearMapDemoTimer();
    clearAssistantDemoTimers();
    cancelSpeech();
    storageKeys.forEach((key) => localStorage.removeItem(key));
    setState('location', { current: demoLocation, permission: 'idle', isDemo: true });
    setState('crm', {
      agent: demoAgent,
      accounts: accounts.map((account) => ({ ...account, risks: [...account.risks] })),
      contacts: contacts.map((contact) => ({ ...contact })),
      opportunities: opportunities.map((opportunity) => ({ ...opportunity })),
      activities: activities.map((activity) => ({ ...activity })),
      tasks: initialTasks.map((task) => ({ ...task })),
    });
    setState('visits', visits.map((visit) => ({ ...visit })));
    setState('settings', {
      questions: defaultInterviewQuestions.map((question) => ({ ...question })),
      offlineMode: false,
    });
    setState('progress', { ...initialProgress, milestones: [] });
    setState('queue', []);
    setState('assistant', {
      isDemoMode: true,
      notifications: [],
      briefings: [],
      extractions: [],
      writebacks: [],
      kpis: [],
    });
    setState('ui', {
      activeVisitPromptId: undefined,
      activeAssistantNotificationId: undefined,
      toast: undefined,
      selectedClientId: undefined,
      selectedMapAccountId: undefined,
      selectedMapVisitId: undefined,
      visitBriefingAccountId: undefined,
      activeRecommendationId: undefined,
      isCoverageLayerVisible: false,
      dismissedRecommendationIds: [],
      mapDemo: initialMapDemoState(),
      meetingDemo: initialMeetingDemoState(),
      selectedManagerAgentId: fieldAgents[0]?.id,
      reportingTab: 'overview',
      dismissedManagerInsightIds: [],
    });
    setState('questionnaire', {
      visitId: undefined,
      mode: 'manual',
      snapshot: [],
      answers: {},
      review: undefined,
      currentQuestionIndex: 0,
    });
    actions.showToast('App reset complete.');
  },
  toggleOfflineMode() {
    setState('settings', 'offlineMode', (value) => !value);
    save('sales-demo-offline', state.settings.offlineMode);
    if (!state.settings.offlineMode && state.queue.length) actions.syncQueue();
  },
  addQuestion() {
    const nextOrder = Math.max(...state.settings.questions.map((question) => question.order), 0) + 1;
    setState('settings', 'questions', state.settings.questions.length, {
      id: makeId('q'),
      prompt: 'What should be captured from this visit?',
      isActive: true,
      order: nextOrder,
      category: 'meeting',
      answerType: 'text',
    });
    persistQuestions();
  },
  updateQuestion(questionId: string, prompt: string) {
    setState('settings', 'questions', (question) => question.id === questionId, 'prompt', prompt);
    persistQuestions();
  },
  toggleQuestion(questionId: string) {
    const question = state.settings.questions.find((item) => item.id === questionId);
    if (!question) return;
    const activeCount = state.settings.questions.filter((item) => item.isActive).length;
    if (question.isActive && activeCount === 1) {
      actions.showToast('At least one active question is required.');
      return;
    }
    setState('settings', 'questions', (item) => item.id === questionId, 'isActive', (value) => !value);
    persistQuestions();
  },
  removeQuestion(questionId: string) {
    const question = state.settings.questions.find((item) => item.id === questionId);
    if (!question) return;
    const activeCount = state.settings.questions.filter((item) => item.isActive).length;
    if (question.isActive && activeCount === 1) {
      actions.showToast('At least one active question is required.');
      return;
    }
    setState('settings', 'questions', (items) => items.filter((item) => item.id !== questionId).map((item, index) => ({ ...item, order: index + 1 })));
    persistQuestions();
  },
  moveQuestion(questionId: string, direction: -1 | 1) {
    const sorted = [...state.settings.questions].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((question) => question.id === questionId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) return;
    [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
    setState('settings', 'questions', sorted.map((question, orderIndex) => ({ ...question, order: orderIndex + 1 })));
    persistQuestions();
  },
  restoreDefaultQuestions() {
    setState('settings', 'questions', defaultInterviewQuestions.map((question) => ({ ...question })));
    persistQuestions();
  },
};
