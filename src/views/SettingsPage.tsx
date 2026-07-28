import { createSignal, onMount, Show } from 'solid-js';
import Header from '../components/Header';
import { DemoCleanupSettings, InterviewQuestionsSettings } from '../components/SettingsPanels';
import {
  getMobileNotificationRegistration,
  registerForMobileNotifications,
  subscribeMobileNotificationRegistration,
} from '../mobileNotifications';
import { actions, state } from '../store';

function SettingsPage() {
  const [pushRegistration, setPushRegistration] = createSignal(getMobileNotificationRegistration());
  const [isRegisteringPush, setIsRegisteringPush] = createSignal(false);

  onMount(() => {
    const unsubscribe = subscribeMobileNotificationRegistration(setPushRegistration);
    return unsubscribe;
  });

  const registerPush = async () => {
    setIsRegisteringPush(true);
    const next = await registerForMobileNotifications();
    setPushRegistration(next);
    setIsRegisteringPush(false);
    actions.showToast(next.localPermission === 'granted' || next.token ? 'Mobile notifications enabled.' : next.lastError ?? 'Notification registration updated.');
  };

  return (
    <div class="content-stack">
      <Header title="Settings" subtitle="Demo controls and questionnaire setup" />
      <section class="panel">
        <div class="section-title">
          <div>
            <span class="eyebrow">Mobile app</span>
            <h2>Notifications</h2>
            <p>
              {pushRegistration().isNative
                ? `Platform: ${pushRegistration().platform}. Local: ${pushRegistration().localPermission}. Remote push: ${pushRegistration().permission}.`
                : 'Available after installing the Capacitor app on a device.'}
            </p>
          </div>
        </div>
        <Show when={pushRegistration().token}>
          <div class="context-box">
            <strong>Device token</strong>
            <p class="token-preview">{pushRegistration().token}</p>
          </div>
        </Show>
        <Show when={pushRegistration().lastError}>
          <div class="context-box warning-box">
            <strong>Notification status</strong>
            <p>{pushRegistration().lastError}</p>
          </div>
        </Show>
        <button class="primary-action wide" disabled={isRegisteringPush()} onClick={registerPush}>
          {isRegisteringPush() ? 'Registering...' : 'Enable mobile push notifications'}
        </button>
      </section>
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
      <DemoCleanupSettings />
      <InterviewQuestionsSettings />
      <section class="panel">
        <h3>Session</h3>
        <button class="secondary-action wide" onClick={() => actions.logout()}>Sign out</button>
      </section>
    </div>
  );
}

export default SettingsPage;
