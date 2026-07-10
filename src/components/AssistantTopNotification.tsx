import { BellRing, Bot, ChevronRight, Clock, X } from 'lucide-solid';
import { For, Show } from 'solid-js';
import { getVisitAccount } from '../selectors';
import { actions, state } from '../store';
import type { AssistantNotification } from '../types';

function AssistantTopNotification() {
  const notifications = () => state.assistant.notifications
    .filter((item) => item.status === 'unread' || item.id === state.ui.activeAssistantNotificationId)
    .filter((item) => item.status !== 'dismissed')
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
  const visit = (notification: AssistantNotification) => state.visits.find((item) => item.id === notification.visitId);
  const account = (notification: AssistantNotification) => {
    const currentVisit = visit(notification);
    return currentVisit ? getVisitAccount(currentVisit) : undefined;
  };
  const isEta = (notification: AssistantNotification) => notification.type === 'destinationEta';
  const isArrival = (notification: AssistantNotification) => notification.type === 'arrivalBriefing' || notification.type === 'preMeetingBriefing';
  const isDebrief = (notification: AssistantNotification) => notification.type === 'postMeetingDebrief';
  const openNotification = (notification: AssistantNotification) => {
    if (isEta(notification)) return;
    actions.openAssistantNotification(notification.id);
  };
  const notificationClass = (notification: AssistantNotification) => {
    if (isDebrief(notification)) return 'assistant-top-notification post';
    if (isArrival(notification)) return 'assistant-top-notification arrival';
    return 'assistant-top-notification';
  };

  return (
    <Show when={notifications().length}>
      <div class="assistant-notification-stack" aria-live="polite">
        <For each={notifications()}>
          {(active) => (
            <section class={notificationClass(active)}>
              <div class="assistant-top-icon">
                {isEta(active) ? <Clock size={18} /> : isArrival(active) ? <BellRing size={18} /> : <Bot size={18} />}
              </div>
              <button class="assistant-top-copy" onClick={() => openNotification(active)}>
                <span class="eyebrow">{isEta(active) ? 'Route alert' : isArrival(active) ? 'Arrival detected' : 'AI debrief ready'}</span>
                <strong>
                  {isEta(active)
                    ? `You are 15 minutes away from your destination with ${account(active)?.name ?? 'your customer'}.`
                    : isArrival(active)
                      ? `Looks like you're almost at ${account(active)?.name ?? 'Global Retail'}.`
                      : `You can now capture the debrief for ${account(active)?.name ?? 'the visit'}.`}
                </strong>
                <span>{isEta(active) ? 'I will notify you on arrival' : isArrival(active) ? "See what matters today" : 'Open voice capture'}</span>
              </button>
              <button class="icon-button" title="Dismiss assistant alert" onClick={() => actions.dismissAssistantNotification(active.id)}>
                <X size={16} />
              </button>
              <Show when={!isEta(active)}>
                <ChevronRight size={16} class="assistant-top-chevron" />
              </Show>
            </section>
          )}
        </For>
      </div>
    </Show>
  );
}

export default AssistantTopNotification;
