import { Show } from 'solid-js';
import Header from '../components/Header';
import { DemoCleanupSettings, InterviewQuestionsSettings } from '../components/SettingsPanels';
import { actions, state } from '../store';

function SettingsPage() {
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
