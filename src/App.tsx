import { A, Navigate, useLocation, useNavigate, useParams } from '@solidjs/router';
import L from 'leaflet';
import { ArrowDown, ArrowUp, CalendarDays, Check, CircleDot, ClipboardList, Home, MapPin, Mic, Plus, RefreshCcw, Save, Settings, Trash2, UserRound, UsersRound, WifiOff } from 'lucide-solid';
import { createEffect, createMemo, createSignal, For, Match, onMount, Show, Switch } from 'solid-js';
import type { JSX } from 'solid-js';
import { actions, state } from './store';
import { formatCurrency, getActiveQuestions, getDistanceMeters, speakText } from './services';
import type { Account, ReviewSummary, ScheduledVisit } from './types';

const getAccount = (accountId: string) => state.crm.accounts.find((account) => account.id === accountId);
const getVisitAccount = (visit: ScheduledVisit) => getAccount(visit.accountId);
const getOpenOpportunity = (accountId: string) => state.crm.opportunities.find((opportunity) => opportunity.accountId === accountId);

function App(props: { children?: JSX.Element }) {
  const location = useLocation();
  const isLogin = () => location.pathname === '/';

  return (
    <Show when={state.session.isAuthenticated || isLogin()} fallback={<Navigate href="/" />}>
      <div class="app-frame">
        <div class="phone-shell">
          <main class={isLogin() ? 'page login-page' : 'page app-page'}>{props.children}</main>
          <Show when={!isLogin()}>
            <BottomNavigation />
          </Show>
          <Show when={state.ui.toast}>
            <div class="toast">{state.ui.toast}</div>
          </Show>
        </div>
      </div>
    </Show>
  );
}

function BottomNavigation() {
  const links = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/clients', label: 'Clients', icon: UsersRound },
    { href: '/schedule', label: 'Schedule', icon: CalendarDays },
    { href: '/reporting', label: 'Report', icon: ClipboardList },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav class="bottom-nav" aria-label="Main navigation">
      <For each={links}>
        {(item) => {
          const Icon = item.icon;
          return (
            <A href={item.href} activeClass="active" class="nav-link">
              <Icon size={20} />
              <span>{item.label}</span>
            </A>
          );
        }}
      </For>
    </nav>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = () => {
    actions.login();
    navigate('/dashboard');
  };

  return (
    <section class="login-card">
      <div class="brand-mark">
        <MapPin size={30} />
      </div>
      <h1>Sales Agent</h1>
      <p>Field visit assistant for mobile sales teams.</p>
      <div class="agent-preview">
        <UserRound size={20} />
        <div>
          <strong>{state.crm.agent.name}</strong>
          <span>{state.crm.agent.territory}</span>
        </div>
      </div>
      <button class="primary-action" onClick={login}>
        <Check size={18} />
        Sign in as Sofia
      </button>
    </section>
  );
}

function Header(props: { title: string; subtitle?: string }) {
  return (
    <header class="screen-header">
      <div>
        <h1>{props.title}</h1>
        <Show when={props.subtitle}>
          <p>{props.subtitle}</p>
        </Show>
      </div>
      <div class="avatar">SR</div>
    </header>
  );
}

function DailyProgressWidget() {
  return (
    <section class="progress-widget">
      <div class="progress-ring" style={{ '--progress': `${state.progress.percent}%` }}>
        <span>{state.progress.percent}%</span>
      </div>
      <div>
        <strong>Daily progress</strong>
        <p>{state.progress.milestones.at(-1) ?? 'Add visit activity to build momentum.'}</p>
      </div>
    </section>
  );
}

function MapView() {
  let container!: HTMLDivElement;
  let map: L.Map | undefined;
  let markerLayer: L.LayerGroup | undefined;

  const updateMarkers = () => {
    if (!map || !markerLayer) return;
    const layer = markerLayer;
    markerLayer.clearLayers();
    const current = state.location.current;
    const agentIcon = L.divIcon({ className: 'agent-marker', html: '<span></span>', iconSize: [24, 24] });
    L.marker([current.latitude, current.longitude], { icon: agentIcon }).addTo(layer).bindPopup('Sofia Rivera');

    state.visits.forEach((visit) => {
      const account = getVisitAccount(visit);
      const icon = L.divIcon({
        className: `visit-marker ${visit.status.toLowerCase()}`,
        html: '<span></span>',
        iconSize: [22, 22],
      });
      L.marker([visit.latitude, visit.longitude], { icon })
        .addTo(layer)
        .bindPopup(`${account?.name ?? 'Customer'} - ${visit.status}`);
    });
    map.setView([current.latitude, current.longitude], map.getZoom() || 13);
  };

  onMount(() => {
    map = L.map(container, { zoomControl: false }).setView([state.location.current.latitude, state.location.current.longitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    updateMarkers();
    setTimeout(() => map?.invalidateSize(), 80);
  });

  createEffect(() => {
    state.location.current.latitude;
    state.location.current.longitude;
    state.visits.map((visit) => `${visit.id}-${visit.status}-${visit.pendingSync}`).join('|');
    updateMarkers();
  });

  return <div ref={container} class="map-view" />;
}

function VisitStatusPrompt() {
  const visit = () => state.visits.find((item) => item.id === state.ui.activeVisitPromptId);
  const account = () => (visit() ? getVisitAccount(visit()!) : undefined);

  return (
    <Show when={visit()}>
      <section class="bottom-sheet compact-sheet">
        <div class="sheet-handle" />
        <strong>{account()?.name}</strong>
        <p>You are inside the scheduled visit radius.</p>
        <div class="button-row">
          <button class="primary-action" onClick={() => actions.startVisit(visit()!.id)}>Start Visit</button>
          <button class="secondary-action" onClick={() => actions.dismissVisitPrompt()}>Dismiss</button>
        </div>
      </section>
    </Show>
  );
}

export function DashboardPage() {
  const nextVisit = createMemo(() => state.visits.find((visit) => visit.status !== 'Completed') ?? state.visits[0]);
  const navigate = useNavigate();

  const runVisitAction = () => {
    const visit = nextVisit();
    if (visit.status === 'Scheduled') {
      actions.startVisit(visit.id);
    }
    if (visit.status === 'InProgress') {
      actions.finishInterview(visit.id);
    }
    if (visit.status === 'InterviewFinished' || visit.status === 'Questionnaire') {
      actions.beginQuestionnaire(visit.id, 'manual');
      navigate(`/visits/${visit.id}/questionnaire`);
    }
  };

  const dashboardActionLabel = () => {
    const status = nextVisit().status;
    if (status === 'Scheduled') return 'Start Visit';
    if (status === 'InProgress') return 'Finish Interview';
    if (status === 'InterviewFinished') return 'Start Questionnaire';
    if (status === 'Questionnaire') return 'Continue Questionnaire';
    return 'Completed';
  };

  return (
    <>
      <MapView />
      <div class="dashboard-overlay top">
        <DailyProgressWidget />
      </div>
      <div class="dashboard-overlay bottom">
        <section class="visit-card">
          <div>
            <span class="eyebrow">Next visit</span>
            <h2>{getVisitAccount(nextVisit())?.name}</h2>
            <p>{nextVisit().time} · {nextVisit().status}</p>
          </div>
          <div class="visit-card-actions">
            <button class="icon-button" title="Use demo location" onClick={() => actions.focusVisitLocation(nextVisit().id)}>
              <CircleDot size={20} />
            </button>
            <Show when={nextVisit().status !== 'Completed'}>
              <button class="primary-action compact-action" onClick={runVisitAction}>{dashboardActionLabel()}</button>
            </Show>
          </div>
        </section>
        <div class="button-row">
          <button class="secondary-action" onClick={() => actions.requestBrowserLocation()}>Use live location</button>
          <button class="primary-action" onClick={() => actions.useDemoLocation()}>Use demo location</button>
        </div>
      </div>
      <VisitStatusPrompt />
    </>
  );
}

export function ClientsPage() {
  const [selectedId, setSelectedId] = createSignal(state.crm.accounts[0]?.id);
  const selected = () => state.crm.accounts.find((account) => account.id === selectedId()) ?? state.crm.accounts[0];
  const accountContacts = () => state.crm.contacts.filter((contact) => contact.accountId === selected()?.id);
  const accountOpportunity = () => state.crm.opportunities.find((opportunity) => opportunity.accountId === selected()?.id);
  const accountActivities = () => state.crm.activities.filter((activity) => activity.accountId === selected()?.id);

  return (
    <div class="content-stack">
      <Header title="Clients" subtitle="Assigned CRM context" />
      <div class="horizontal-list">
        <For each={state.crm.accounts}>
          {(account) => (
            <button class={account.id === selected()?.id ? 'pill selected' : 'pill'} onClick={() => setSelectedId(account.id)}>
              {account.name}
            </button>
          )}
        </For>
      </div>
      <section class="panel">
        <span class="eyebrow">{selected()?.industry}</span>
        <h2>{selected()?.name}</h2>
        <p>{selected()?.summary}</p>
        <div class="metric-grid">
          <div><span>Status</span><strong>{selected()?.status}</strong></div>
          <div><span>Risks</span><strong>{selected()?.risks.length || 0}</strong></div>
        </div>
      </section>
      <section class="panel">
        <h3>Contacts</h3>
        <For each={accountContacts()}>
          {(contact) => <div class="list-row"><div><strong>{contact.name}</strong><span>{contact.role}</span></div><span>{contact.phone}</span></div>}
        </For>
      </section>
      <Show when={accountOpportunity()}>
        {(opportunity) => (
          <section class="panel">
            <h3>Opportunity</h3>
            <div class="list-row">
              <div><strong>{opportunity().name}</strong><span>{opportunity().stage} · {opportunity().probability}%</span></div>
              <strong>{formatCurrency(opportunity().amount)}</strong>
            </div>
            <p>{opportunity().nextStep}</p>
          </section>
        )}
      </Show>
      <section class="panel">
        <h3>Recent activity</h3>
        <For each={accountActivities()}>
          {(activity) => <div class="timeline-item"><strong>{activity.title}</strong><span>{activity.date}</span><p>{activity.notes}</p></div>}
        </For>
      </section>
    </div>
  );
}

function VisitActions(props: { visit: ScheduledVisit }) {
  const navigate = useNavigate();
  const visit = () => props.visit;

  return (
    <div class="button-grid">
      <button class="secondary-action" onClick={() => actions.focusVisitLocation(visit().id)}>Simulate arrival</button>
      <Show when={visit().status === 'Scheduled'}>
        <button class="primary-action" onClick={() => actions.startVisit(visit().id)}>Start Visit</button>
      </Show>
      <Show when={visit().status === 'InProgress'}>
        <button class="primary-action" onClick={() => actions.finishInterview(visit().id)}>Finish Interview</button>
      </Show>
      <Show when={visit().status === 'InterviewFinished' || visit().status === 'Questionnaire'}>
        <button class="primary-action" onClick={() => { actions.beginQuestionnaire(visit().id, 'manual'); navigate(`/visits/${visit().id}/questionnaire`); }}>Open Questionnaire</button>
      </Show>
    </div>
  );
}

function QuestionnaireStepper() {
  const review = () => state.questionnaire.review;
  const activeQuestion = () => state.questionnaire.snapshot[state.questionnaire.currentQuestionIndex];
  const [speechSupported] = createSignal(Boolean((window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition));
  const progressLabel = () => `Question ${state.questionnaire.currentQuestionIndex + 1} of ${state.questionnaire.snapshot.length}`;
  const progressPercent = () => `${((state.questionnaire.currentQuestionIndex + 1) / Math.max(state.questionnaire.snapshot.length, 1)) * 100}%`;
  const currentAnswer = () => {
    const question = activeQuestion();
    return question ? state.questionnaire.answers[question.id] ?? '' : '';
  };
  const isLastQuestion = () => state.questionnaire.currentQuestionIndex >= state.questionnaire.snapshot.length - 1;

  const listen = () => {
    const SpeechCtor = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      ?? (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    const question = activeQuestion();
    if (!SpeechCtor || !question) return;
    speakText(question.prompt);
    const recognition = new SpeechCtor();
    recognition.lang = 'en-US';
    recognition.onresult = (event: SpeechRecognitionResultEventLike) => {
      const transcript = event.results[0][0].transcript;
      actions.updateAnswer(question.id, transcript);
    };
    recognition.onerror = () => actions.showToast('Voice capture failed. Manual fallback is ready.');
    recognition.start();
  };

  return (
    <Show when={state.questionnaire.visitId && !review()}>
      <section class="panel questionnaire-panel stepper-panel">
        <div class="section-title">
          <div>
            <span class="eyebrow">Post-interview</span>
            <h2>Visit questionnaire</h2>
            <p>{progressLabel()}</p>
          </div>
          <div class="segmented-control">
            <button class={state.questionnaire.mode === 'manual' ? 'selected' : ''} onClick={() => actions.setQuestionnaireMode('manual')}>Manual</button>
            <button class={state.questionnaire.mode === 'voice' ? 'selected' : ''} onClick={() => actions.setQuestionnaireMode('voice')}>Voice</button>
          </div>
        </div>
        <div class="question-progress" aria-label={progressLabel()}>
          <span style={{ width: progressPercent() }} />
        </div>
        <Show when={activeQuestion()} fallback={<p>No active questions are configured.</p>}>
          {(question) => (
            <div class="question-card">
              <span class="eyebrow">{question().category}</span>
              <h2>{question().prompt}</h2>
              <Show when={!currentAnswer()}>
                <p class="empty-answer">No answer captured yet.</p>
              </Show>
              <Show when={state.questionnaire.mode === 'voice'}>
                <Show when={speechSupported()} fallback={<p>Voice recognition is not available in this browser. Manual input is ready below.</p>}>
                  <div class="voice-card compact-voice-card">
                    <Mic size={24} />
                    <button class="primary-action" onClick={listen}>Listen</button>
                  </div>
                </Show>
              </Show>
              <label class="field">
                <span>Answer</span>
                <textarea
                  value={currentAnswer()}
                  onInput={(event) => actions.updateAnswer(question().id, event.currentTarget.value)}
                  rows={question().answerType === 'text' ? 6 : 3}
                />
              </label>
            </div>
          )}
        </Show>
        <div class="question-action-bar">
          <button class="secondary-action" disabled={state.questionnaire.currentQuestionIndex === 0} onClick={() => actions.previousQuestion()}>Previous</button>
          <Show
            when={isLastQuestion()}
            fallback={<button class="primary-action" onClick={() => actions.nextQuestion()}>Next</button>}
          >
            <button class="primary-action" onClick={() => actions.buildReview()}>
              <ClipboardList size={18} />
              Generate review
            </button>
          </Show>
        </div>
      </section>
    </Show>
  );
}

type SpeechRecognitionLike = {
  lang: string;
  onresult: (event: SpeechRecognitionResultEventLike) => void;
  onerror: () => void;
  start: () => void;
};

type SpeechRecognitionResultEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

function ReviewPanel() {
  const review = () => state.questionnaire.review;
  const updateEvent = (field: keyof ReviewSummary['eventUpdate'], value: string) => {
    actions.updateReview((current) => ({
      ...current,
      eventUpdate: {
        ...current.eventUpdate,
        [field]: field === 'durationMinutes' ? Number(value) : value,
      },
    }));
  };

  return (
    <Show when={review()}>
      {(summary) => (
        <section class="panel review-panel">
          <span class="eyebrow">Review summary</span>
          <h2>CRM updates</h2>
          <label class="field">
            <span>Outcome</span>
            <input value={summary().eventUpdate.outcome} onInput={(event) => updateEvent('outcome', event.currentTarget.value)} />
          </label>
          <label class="field">
            <span>Duration minutes</span>
            <input type="number" value={summary().eventUpdate.durationMinutes} onInput={(event) => updateEvent('durationMinutes', event.currentTarget.value)} />
          </label>
          <label class="field">
            <span>Notes</span>
            <textarea rows={4} value={summary().eventUpdate.notes} onInput={(event) => updateEvent('notes', event.currentTarget.value)} />
          </label>
          <Show when={summary().opportunityUpdate}>
            {(opportunity) => <div class="summary-box"><strong>Opportunity</strong><span>{opportunity().stage} · {opportunity().probability}% · {opportunity().nextStep}</span></div>}
          </Show>
          <Show when={summary().tasks.length}>
            <div class="summary-box"><strong>New tasks</strong><span>{summary().tasks.map((task) => task.title).join(', ')}</span></div>
          </Show>
          <button class="primary-action wide" onClick={() => actions.confirmReview()}>
            <Save size={18} />
            Confirm submission
          </button>
        </section>
      )}
    </Show>
  );
}

export function QuestionnairePage() {
  const params = useParams();
  const visit = () => state.visits.find((item) => item.id === params.visitId);
  const account = () => (visit() ? getVisitAccount(visit()!) : undefined);

  onMount(() => {
    const currentVisit = visit();
    if (!currentVisit) return;
    if (currentVisit.status === 'InterviewFinished' || currentVisit.status === 'Questionnaire') {
      actions.beginQuestionnaire(currentVisit.id, state.questionnaire.mode);
    }
  });

  return (
    <div class="content-stack questionnaire-page">
      <Header title="Questionnaire" subtitle="Guided post-interview capture" />
      <Show when={visit()} fallback={
        <section class="panel">
          <h2>Visit not found</h2>
          <p>This visit is no longer available in the demo data.</p>
          <A class="secondary-action wide" href="/schedule">Back to Schedule</A>
        </section>
      }>
        {(currentVisit) => (
          <>
            <section class="panel questionnaire-context">
              <span class={`status-badge ${currentVisit().status.toLowerCase()}`}>{currentVisit().status}</span>
              <div>
                <h2>{account()?.name}</h2>
                <p>{currentVisit().time} Â· {currentVisit().address}</p>
              </div>
              <Show when={account()}>
                {(currentAccount) => <VisitContext account={currentAccount()} />}
              </Show>
            </section>
            <Switch>
              <Match when={currentVisit().status === 'Scheduled' || currentVisit().status === 'InProgress'}>
                <section class="panel">
                  <h2>Questionnaire locked</h2>
                  <p>Finish the customer interview before starting post-interview capture.</p>
                  <A class="primary-action wide" href="/schedule">Back to Schedule</A>
                </section>
              </Match>
              <Match when={currentVisit().status === 'Completed' && !state.questionnaire.review}>
                <section class="panel">
                  <h2>Visit completed</h2>
                  <p>The questionnaire has already been submitted for this visit.</p>
                  <A class="primary-action wide" href="/reporting">View Reporting</A>
                </section>
              </Match>
              <Match when={true}>
                <QuestionnaireStepper />
                <ReviewPanel />
              </Match>
            </Switch>
          </>
        )}
      </Show>
    </div>
  );
}

export function SchedulePage() {
  return (
    <div class="content-stack">
      <Header title="Schedule" subtitle="Today visits and completion flow" />
      <For each={state.visits}>
        {(visit) => {
          const account = () => getVisitAccount(visit);
          const distance = () => Math.round(getDistanceMeters(state.location.current, { latitude: visit.latitude, longitude: visit.longitude }));
          return (
            <section class="panel visit-detail">
              <div class="section-title">
                <div>
                  <span class={`status-badge ${visit.status.toLowerCase()}`}>{visit.status}</span>
                  <h2>{account()?.name}</h2>
                  <p>{visit.time} · {distance()}m away</p>
                </div>
                <Show when={visit.pendingSync}>
                  <WifiOff size={20} class="offline-icon" />
                </Show>
              </div>
              <p>{visit.address}</p>
              <Show when={account()}>
                {(currentAccount) => <VisitContext account={currentAccount()} />}
              </Show>
              <VisitActions visit={visit} />
            </section>
          );
        }}
      </For>
    </div>
  );
}

function VisitContext(props: { account: Account }) {
  const opportunity = () => getOpenOpportunity(props.account.id);
  return (
    <div class="context-box">
      <strong>{props.account.summary}</strong>
      <Show when={opportunity()}>
        {(item) => <span>{item().name}: {item().stage}, {item().probability}% probability</span>}
      </Show>
    </div>
  );
}

export function ReportingPage() {
  const completed = () => state.visits.filter((visit) => visit.status === 'Completed').length;
  const pendingSync = () => state.queue.length;
  return (
    <div class="content-stack">
      <Header title="Reporting" subtitle="Daily activity and sync status" />
      <DailyProgressWidget />
      <section class="panel">
        <div class="metric-grid">
          <div><span>Completed visits</span><strong>{completed()}/{state.visits.length}</strong></div>
          <div><span>Open tasks</span><strong>{state.crm.tasks.length}</strong></div>
          <div><span>Pending sync</span><strong>{pendingSync()}</strong></div>
          <div><span>Streak</span><strong>{state.crm.agent.streakDays} days</strong></div>
        </div>
      </section>
      <section class="panel">
        <h3>Milestones</h3>
        <Show when={state.progress.milestones.length} fallback={<p>No milestone reached yet.</p>}>
          <For each={state.progress.milestones}>
            {(milestone) => <div class="list-row"><strong>{milestone}</strong><Check size={18} /></div>}
          </For>
        </Show>
      </section>
      <section class="panel">
        <h3>Sync queue</h3>
        <Show when={state.queue.length} fallback={<p>All CRM updates are synced.</p>}>
          <For each={state.queue}>
            {(item) => <div class="list-row"><div><strong>{item.summary.eventUpdate.outcome}</strong><span>{new Date(item.createdAt).toLocaleString()}</span></div><WifiOff size={18} /></div>}
          </For>
        </Show>
      </section>
    </div>
  );
}

function InterviewQuestionsSettings() {
  const activeCount = () => getActiveQuestions(state.settings.questions).length;
  const sorted = () => [...state.settings.questions].sort((a, b) => a.order - b.order);

  return (
    <section class="panel">
      <div class="section-title">
        <div>
          <span class="eyebrow">{activeCount()} active</span>
          <h2>Interview questions</h2>
        </div>
        <button class="icon-button" title="Add question" onClick={() => actions.addQuestion()}>
          <Plus size={20} />
        </button>
      </div>
      <For each={sorted()}>
        {(question) => (
          <div class="question-row">
            <label class="toggle-row">
              <input type="checkbox" checked={question.isActive} onChange={() => actions.toggleQuestion(question.id)} />
              <span>{question.isActive ? 'Active' : 'Off'}</span>
            </label>
            <input class="question-input" value={question.prompt} onInput={(event) => actions.updateQuestion(question.id, event.currentTarget.value)} />
            <div class="mini-actions">
              <button class="icon-button" title="Move up" onClick={() => actions.moveQuestion(question.id, -1)}><ArrowUp size={16} /></button>
              <button class="icon-button" title="Move down" onClick={() => actions.moveQuestion(question.id, 1)}><ArrowDown size={16} /></button>
              <button class="icon-button danger" title="Delete" onClick={() => actions.removeQuestion(question.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        )}
      </For>
      <button class="secondary-action wide" onClick={() => actions.restoreDefaultQuestions()}>
        <RefreshCcw size={18} />
        Restore defaults
      </button>
    </section>
  );
}

export function SettingsPage() {
  return (
    <div class="content-stack">
      <Header title="Settings" subtitle="Demo controls and questionnaire setup" />
      <section class="panel">
        <div class="section-title">
          <div>
            <span class="eyebrow">Network simulation</span>
            <h2>Offline mode</h2>
            <p>{state.settings.offlineMode ? 'CRM submissions will be queued.' : 'CRM submissions sync immediately.'}</p>
          </div>
          <label class="switch">
            <input type="checkbox" checked={state.settings.offlineMode} onChange={() => actions.toggleOfflineMode()} />
            <span />
          </label>
        </div>
        <Show when={!state.settings.offlineMode && state.queue.length}>
          <button class="primary-action wide" onClick={() => actions.syncQueue()}>Sync pending updates</button>
        </Show>
      </section>
      <InterviewQuestionsSettings />
      <section class="panel">
        <h3>Session</h3>
        <button class="secondary-action wide" onClick={() => actions.logout()}>Sign out</button>
      </section>
    </div>
  );
}

export default App;
