import { useNavigate } from '@solidjs/router';
import { Bot, Mic, Sparkles, X } from 'lucide-solid';
import { For, Show } from 'solid-js';
import { getVisitAccount } from '../selectors';
import { actions, state } from '../store';

function AssistantNotificationSheet() {
  const navigate = useNavigate();
  const notification = () => {
    const activeId = state.ui.activeAssistantNotificationId;
    return activeId ? state.assistant.notifications.find((item) => item.id === activeId && item.status !== 'dismissed') : undefined;
  };
  const visit = () => {
    const active = notification();
    return active ? state.visits.find((item) => item.id === active.visitId) : undefined;
  };
  const account = () => {
    const currentVisit = visit();
    return currentVisit ? getVisitAccount(currentVisit) : undefined;
  };
  const briefing = () => {
    const active = notification();
    return active ? state.assistant.briefings.find((item) => item.visitId === active.visitId) : undefined;
  };
  const briefingParagraphs = () => {
    const customerName = account()?.name ?? 'Global Retail';
    return [
      `Looks like you're almost at ${customerName}.`,
      "Before you walk in, here's what matters most today.",
      "Your champion, Sarah Johnson, hasn't responded to the implementation estimate you sent last week.",
      'You still have one overdue follow-up task from five days ago.',
      "Good news: customer engagement has increased this month, and there's a strong opportunity to expand into two additional stores.",
      'The current pipeline value for this account is $95,000.',
      "Don't forget to ask about their Q4 rollout plans. That topic came up in your last two meetings but hasn't been captured in the CRM yet.",
      "After today's visit, your next commitment is a technical review with their IT team next Tuesday.",
    ];
  };
  const openDebrief = () => {
    const currentVisit = visit();
    if (!currentVisit) return;
    actions.beginQuestionnaire(currentVisit.id, 'voice');
    navigate(`/visits/${currentVisit.id}/questionnaire`);
  };
  const isBriefing = () => {
    const active = notification();
    return active?.type === 'arrivalBriefing' || active?.type === 'preMeetingBriefing';
  };

  return (
    <Show when={notification()}>
      {(active) => (
        <section class="bottom-sheet assistant-sheet">
          <div class="sheet-handle" />
          <div class="assistant-sheet-header">
            <div class="assistant-title">
              <Bot size={19} />
              <div>
                <span class="eyebrow">{isBriefing() ? 'AI briefing' : 'Post interview'}</span>
                <h2>{active().title}</h2>
              </div>
            </div>
            <button class="icon-button" title="Close assistant" onClick={() => actions.clearAssistantNotification()}>
              <X size={18} />
            </button>
          </div>

          <Show when={!isBriefing() && active().type !== 'postMeetingDebrief'}>
            <p class="assistant-demo-note">{active().message}</p>
          </Show>

          <Show when={isBriefing() && briefing()}>
            <div class="assistant-briefing-copy">
              <Sparkles size={17} />
              <div>
                <For each={briefingParagraphs()}>
                  {(paragraph) => <p>{paragraph}</p>}
                </For>
              </div>
            </div>
          </Show>

          <Show when={active().type === 'postMeetingDebrief'}>
            <button class="voice-activation-button" onClick={openDebrief} aria-label={`Start post-interview listening for ${account()?.name ?? 'this visit'}`}>
              <span class="voice-activation-rings" aria-hidden="true" />
              <span class="voice-activation-core">
                <Mic size={38} />
              </span>
              <span class="voice-activation-label">Start listening</span>
            </button>
          </Show>

          <Show when={active().type !== 'postMeetingDebrief'}>
            <button class="details-toggle" onClick={() => actions.dismissAssistantNotification(active().id)}>
              Dismiss assistant notification
            </button>
          </Show>
        </section>
      )}
    </Show>
  );
}

export default AssistantNotificationSheet;
