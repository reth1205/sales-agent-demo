import CustomerMapSummarySheet from '../components/CustomerMapSummarySheet';
import MapView from '../components/MapView';
import MapDemoControls from '../components/MapDemoControls';
import NearbyRecommendationBanner from '../components/NearbyRecommendationBanner';

function DashboardPage() {
  return (
    <>
      <MapView />
      <div class="dashboard-overlay top">
        <MapDemoControls />
      </div>
      <NearbyRecommendationBanner />
      <CustomerMapSummarySheet />
    </>
  );
}

export default DashboardPage;
