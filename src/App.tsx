import { Navigate, useLocation, useNavigate } from '@solidjs/router';
import { onCleanup, onMount, Show } from 'solid-js';
import type { JSX } from 'solid-js';
import BottomNavigation from './components/BottomNavigation';
import { setupMobileNotificationListeners } from './mobileNotifications';
import { state } from './store';
import { actions } from './store';

function App(props: { children?: JSX.Element }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = () => location.pathname === '/';

  onMount(() => {
    void setupMobileNotificationListeners({
      onForegroundNotification: (notification) => {
        actions.showToast(notification.title ? `${notification.title}: ${notification.body ?? ''}` : 'Notification received.');
      },
      onNotificationAction: (notification, targetRoute) => {
        const payload = notification as unknown as {
          notification?: {
            data?: {
              assistantNotificationId?: string;
              type?: string;
              visitId?: string;
            };
            extra?: {
              assistantNotificationId?: string;
              type?: string;
              visitId?: string;
            };
          };
        };
        const data = payload.notification?.data ?? payload.notification?.extra;

        void actions.cancelItineraryReminderNotifications();

        if (data?.type === 'postMeetingDebrief' && data.visitId) {
          actions.triggerPostMeetingDebrief(data.visitId, 'meetingTimer');
        }

        if (data?.assistantNotificationId) {
          actions.openAssistantNotification(data.assistantNotificationId);
        }

        if (targetRoute?.startsWith('/')) {
          navigate(targetRoute);
          return;
        }

        actions.showToast('Notification opened.');
      },
    });
    if (state.session.isAuthenticated) {
      void actions.cancelItineraryReminderNotifications();
    }
    const reconcileMeetingDemo = () => actions.reconcileMeetingDemoProgress();
    document.addEventListener('visibilitychange', reconcileMeetingDemo);
    window.addEventListener('focus', reconcileMeetingDemo);
    onCleanup(() => {
      document.removeEventListener('visibilitychange', reconcileMeetingDemo);
      window.removeEventListener('focus', reconcileMeetingDemo);
    });
  });

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

export {
  ClientsPage,
  DashboardPage,
  LoginPage,
  QuestionnairePage,
  ReportingPage,
  SchedulePage,
  SettingsPage,
} from './views';

export default App;
