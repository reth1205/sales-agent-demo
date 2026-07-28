import { A, useParams } from '@solidjs/router';
import { Match, onMount, Show, Switch } from 'solid-js';
import Header from '../components/Header';
import QuestionnaireStepper from '../components/QuestionnaireStepper';
import ReviewPanel from '../components/ReviewPanel';
import { getVisitAccount } from '../selectors';
import { actions, state } from '../store';

function QuestionnairePage() {
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
      <Header title="Post Interview" subtitle="Passive listening and objective check" />
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
                <p>{currentVisit().time}</p>
              </div>
            </section>
            <Switch>
              <Match when={currentVisit().status === 'Scheduled' || currentVisit().status === 'InProgress'}>
                <section class="panel">
                  <h2>Listening locked</h2>
                  <p>Finish the customer interview before starting post-interview listening.</p>
                  <A class="primary-action wide" href="/schedule">Back to Schedule</A>
                </section>
              </Match>
              <Match when={currentVisit().status === 'Completed' && !state.questionnaire.review}>
                <section class="panel">
                  <h2>Visit completed</h2>
                  <p>The post-interview checklist has already been submitted for this visit.</p>
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

export default QuestionnairePage;
