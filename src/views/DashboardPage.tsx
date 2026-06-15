import { Layers } from 'lucide-solid';
import CustomerMapSummarySheet from '../components/CustomerMapSummarySheet';
import MapView from '../components/MapView';
import MapDemoControls from '../components/MapDemoControls';
import NearbyRecommendationBanner from '../components/NearbyRecommendationBanner';
import { actions, state } from '../store';

function DashboardPage() {
  return (
    <>
      <MapView />
      <div class="dashboard-overlay top">
        <MapDemoControls />
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
      <NearbyRecommendationBanner />
      <CustomerMapSummarySheet />
    </>
  );
}

export default DashboardPage;
