import { WifiOff } from 'lucide-solid';
import { For, Show } from 'solid-js';
import Header from '../components/Header';
import VisitActions from '../components/VisitActions';
import VisitContext from '../components/VisitContext';
import { getVisitAccount } from '../selectors';
import { getDistanceMeters } from '../services';
import { state } from '../store';

function SchedulePage() {
  return (
    <div class="content-stack">
      <Header title="Schedule" subtitle="Today visits and completion flow" />
      <For each={state.visits}>
        {(visit) => {
          const account = () => getVisitAccount(visit);
          const distance = () => Math.round(getDistanceMeters(state.location.current, { latitude: visit.latitude, longitude: visit.longitude }));
          return (
            <section class="panel visit-detail">
              <div class="section-title">
                <div>
                  <span class={`status-badge ${visit.status.toLowerCase()}`}>{visit.status}</span>
                  <h2>{account()?.name}</h2>
                  <p>{visit.time} · {distance()}m away</p>
                </div>
                <Show when={visit.pendingSync}>
                  <WifiOff size={20} class="offline-icon" />
                </Show>
              </div>
              <p>{visit.address}</p>
              <Show when={account()}>
                {(currentAccount) => <VisitContext account={currentAccount()} />}
              </Show>
              <VisitActions visit={visit} />
            </section>
          );
        }}
      </For>
    </div>
  );
}

export default SchedulePage;
