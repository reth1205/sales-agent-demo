import { Layers } from 'lucide-solid';
import AssistantNotificationSheet from '../components/AssistantNotificationSheet';
import AssistantTopNotification from '../components/AssistantTopNotification';
import ClientVisitStartDialog from '../components/ClientVisitStartDialog';
import DefaultVisitBriefNotification from '../components/DefaultVisitBriefNotification';
import MapView from '../components/MapView';
import MeetingSimulationBanner from '../components/MeetingSimulationBanner';
import RouteSimulationBanner from '../components/RouteSimulationBanner';
import VisitStatusPrompt from '../components/VisitStatusPrompt';
import { actions, state } from '../store';

function DashboardPage() {
  return (
    <>
      <MapView />
      <div class="dashboard-overlay top">
        <DefaultVisitBriefNotification />
        <AssistantTopNotification />
        <RouteSimulationBanner />
        <MeetingSimulationBanner />
        <div class="map-utility-row">
          <button
            class={state.ui.isCoverageLayerVisible ? 'secondary-action compact-action selected-tool' : 'secondary-action compact-action'}
            onClick={() => actions.toggleCoverageLayer()}
          >
            <Layers size={16} />
            Coverage
          </button>
          {state.ui.isCoverageLayerVisible && (
            <div class="coverage-legend">
              <span><i class="range-dot" /> Range</span>
              <span><i class="grid-dot" /> Grid</span>
            </div>
          )}
        </div>
      </div>
      <VisitStatusPrompt />
      <ClientVisitStartDialog />
      <AssistantNotificationSheet />
    </>
  );
}

export default DashboardPage;
