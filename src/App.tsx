import { Navigate, useLocation } from '@solidjs/router';
import { Show } from 'solid-js';
import type { JSX } from 'solid-js';
import BottomNavigation from './components/BottomNavigation';
import { state } from './store';

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
