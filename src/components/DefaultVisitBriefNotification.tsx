import { BellRing, ChevronRight, MapPinned } from 'lucide-solid';
import { Show } from 'solid-js';
import { getNextScheduledVisit, getVisitAccount } from '../selectors';
import { actions, state } from '../store';

function DefaultVisitBriefNotification() {
  const visit = () => getNextScheduledVisit();
  const account = () => {
    const currentVisit = visit();
    return currentVisit ? getVisitAccount(currentVisit) : undefined;
  };
  const hasVisibleAssistantNotification = () => state.assistant.notifications
    .some((item) => (item.status === 'unread' || item.id === state.ui.activeAssistantNotificationId) && item.status !== 'dismissed');
  const shouldShow = () => Boolean(
    visit()
    && account()
    && !state.ui.selectedMapAccountId
    && !state.ui.visitBriefingAccountId
    && !state.ui.activeAssistantNotificationId
    && !hasVisibleAssistantNotification()
    && !state.ui.mapDemo.isRunning
    && !state.ui.meetingDemo.isRunning,
  );
  const openBrief = () => {
    const currentVisit = visit();
    if (!currentVisit) return;
    actions.openPreVisitAisaBriefing(currentVisit.id);
  };

  return (
    <Show when={shouldShow()}>
      <section class="assistant-top-notification arrival default-brief-notification" aria-live="polite">
        <div class="assistant-top-icon">
          <BellRing size={18} />
        </div>
        <button class="assistant-top-copy" onClick={openBrief}>
          <span class="eyebrow">Client brief ready</span>
          <strong>{account()?.name ?? 'Your next customer'} is ready for your visit prep.</strong>
          <span>Review brief and simulate route</span>
        </button>
        <MapPinned size={16} class="assistant-top-chevron" />
        <ChevronRight size={16} class="assistant-top-chevron" />
      </section>
    </Show>
  );
}

export default DefaultVisitBriefNotification;
