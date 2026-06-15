import { createStore, produce } from 'solid-js/store';
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
import { buildMapDemoSteps, buildNavigationUrl, getActiveQuestions, getDistanceMeters, interpretVisitAnswers, makeId } from './services';
import type { InterviewQuestion, LocationPoint, MapDemoStep, OfflineQueueItem, ProgressState, ReportingTab, ReviewSummary, Task } from './types';

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
  ui: {
    activeVisitPromptId?: string;
    toast?: string;
    selectedClientId?: string;
    selectedMapAccountId?: string;
    selectedMapVisitId?: string;
    activeRecommendationId?: string;
    dismissedRecommendationIds: string[];
    mapDemo: {
      isRunning: boolean;
      isPaused: boolean;
      isMoving: boolean;
      movementProgress: number;
      currentStepIndex: number;
      steps: MapDemoStep[];
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
];

const initialMapDemoState = () => ({
  isRunning: false,
  isPaused: false,
  isMoving: false,
  movementProgress: 0,
  currentStepIndex: 0,
  steps: [] as MapDemoStep[],
});

let mapDemoTimer: ReturnType<typeof window.setInterval> | undefined;

const clearMapDemoTimer = () => {
  if (!mapDemoTimer) return;
  window.clearInterval(mapDemoTimer);
  mapDemoTimer = undefined;
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
  visits: load('sales-demo-visits', visits),
  settings: {
    questions: load('sales-demo-questions', defaultInterviewQuestions),
    offlineMode: load('sales-demo-offline', false),
  },
  progress: load('sales-demo-progress', initialProgress),
  queue: load('sales-demo-queue', [] as OfflineQueueItem[]),
  ui: {
    selectedClientId: undefined,
    selectedMapAccountId: undefined,
    selectedMapVisitId: undefined,
    activeRecommendationId: undefined,
    dismissedRecommendationIds: load('sales-demo-dismissed-recommendations', [] as string[]),
    mapDemo: initialMapDemoState(),
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

export const actions = {
  login() {
    setState('session', 'isAuthenticated', true);
    save('sales-demo-session', state.session);
  },
  logout() {
    setState('session', 'isAuthenticated', false);
    save('sales-demo-session', state.session);
  },
  showToast(message: string) {
    setState('ui', 'toast', message);
    window.setTimeout(() => setState('ui', 'toast', undefined), 2600);
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
  selectMapAccount(accountId: string, visitId?: string) {
    setState('ui', 'selectedMapAccountId', accountId);
    setState('ui', 'selectedMapVisitId', visitId);
  },
  selectMapVisit(visitId: string) {
    const visit = state.visits.find((item) => item.id === visitId);
    if (!visit) return;
    actions.selectMapAccount(visit.accountId, visit.id);
  },
  clearMapSelection() {
    setState('ui', 'selectedMapAccountId', undefined);
    setState('ui', 'selectedMapVisitId', undefined);
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
    window.open(buildNavigationUrl(account), '_blank', 'noopener,noreferrer');
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
      currentStepIndex: 0,
      steps,
    });
    actions.animateMapDemoStep(0);
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
    setState('ui', 'activeRecommendationId', step.recommendationId);
    setState('ui', 'mapDemo', 'isMoving', false);
    setState('ui', 'mapDemo', 'movementProgress', 100);
  },
  animateMapDemoStep(stepIndex: number) {
    clearMapDemoTimer();
    const step = state.ui.mapDemo.steps[stepIndex];
    if (!step) return;
    const start = { ...state.location.current };
    const end = step.location;
    const frames = 22;
    let frame = 0;

    setState('ui', 'selectedMapAccountId', undefined);
    setState('ui', 'selectedMapVisitId', undefined);
    setState('ui', 'activeRecommendationId', undefined);
    setState('ui', 'mapDemo', 'isMoving', true);
    setState('ui', 'mapDemo', 'movementProgress', 0);
    setState('location', { current: start, permission: 'granted', isDemo: true });

    mapDemoTimer = window.setInterval(() => {
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
    }, 110);
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
    setState('ui', 'mapDemo', 'isPaused', (value) => !value);
  },
  stopMapDemo() {
    clearMapDemoTimer();
    setState('ui', 'mapDemo', initialMapDemoState());
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
    }
  },
  startVisit(visitId: string) {
    setState('visits', (visit) => visit.id === visitId, 'status', 'InProgress');
    setState('ui', 'activeVisitPromptId', undefined);
    addProgress(10);
    persistVisits();
    actions.showToast('Visit marked in progress.');
  },
  dismissVisitPrompt() {
    setState('ui', 'activeVisitPromptId', undefined);
  },
  finishInterview(visitId: string) {
    setState('visits', (visit) => visit.id === visitId, 'status', 'InterviewFinished');
    persistVisits();
    actions.showToast('Interview finished. Questionnaire unlocked.');
  },
  beginQuestionnaire(visitId: string, mode: 'manual' | 'voice') {
    setState('visits', (visit) => visit.id === visitId, 'status', 'Questionnaire');
    if (state.questionnaire.visitId === visitId && state.questionnaire.snapshot.length) {
      setState('questionnaire', 'mode', mode);
    } else {
      const snapshot = getActiveQuestions(state.settings.questions);
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
      actions.showToast('Saved to pending sync queue.');
    } else {
      actions.applyReview(review);
      actions.showToast('CRM updated successfully.');
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
    setState('queue', []);
    setState('visits', produce((items) => items.forEach((visit) => {
      visit.pendingSync = false;
    })));
    persistQueue();
    persistVisits();
    actions.showToast('Pending sync completed.');
  },
  clearTasks() {
    setState('crm', 'tasks', []);
    persistTasks();
    actions.showToast('Generated tasks cleared.');
  },
  resetDemoActivity() {
    clearMapDemoTimer();
    setState('visits', visits.map((visit) => ({ ...visit })));
    setState('progress', { ...initialProgress, milestones: [] });
    setState('queue', []);
    setState('crm', 'tasks', initialTasks.map((task) => ({ ...task })));
    setState('ui', {
      activeVisitPromptId: undefined,
      toast: undefined,
      selectedClientId: undefined,
      selectedMapAccountId: undefined,
      selectedMapVisitId: undefined,
      activeRecommendationId: undefined,
      dismissedRecommendationIds: state.ui.dismissedRecommendationIds,
      mapDemo: initialMapDemoState(),
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
    actions.showToast('Demo activity reset.');
  },
  resetApp() {
    clearMapDemoTimer();
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
    setState('ui', {
      activeVisitPromptId: undefined,
      toast: undefined,
      selectedClientId: undefined,
      selectedMapAccountId: undefined,
      selectedMapVisitId: undefined,
      activeRecommendationId: undefined,
      dismissedRecommendationIds: [],
      mapDemo: initialMapDemoState(),
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
