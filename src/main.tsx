import { Route, Router } from '@solidjs/router';
import { render } from 'solid-js/web';
import 'leaflet/dist/leaflet.css';
import App, { ClientsPage, DashboardPage, LoginPage, QuestionnairePage, ReportingPage, SchedulePage, SettingsPage } from './App';
import './styles.css';

const root = document.getElementById('root');

render(
  () => (
    <Router root={App}>
      <Route path="/" component={LoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/clients" component={ClientsPage} />
      <Route path="/schedule" component={SchedulePage} />
      <Route path="/visits/:visitId/questionnaire" component={QuestionnairePage} />
      <Route path="/reporting" component={ReportingPage} />
      <Route path="/settings" component={SettingsPage} />
    </Router>
  ),
  root!,
);
