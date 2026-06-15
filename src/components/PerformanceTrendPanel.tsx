import { TrendingUp } from 'lucide-solid';
import { For } from 'solid-js';
import { state } from '../store';

function PerformanceTrendPanel() {
  const maxVisits = () => Math.max(...state.manager.trends.map((point) => point.visitsCompleted), 1);

  return (
    <section class="panel trend-panel">
      <div class="section-title">
        <div>
          <span class="eyebrow">Trends</span>
          <h3>Daily field execution</h3>
        </div>
        <TrendingUp size={19} />
      </div>
      <div class="trend-chart" aria-label="Seven day performance trend">
        <For each={state.manager.trends}>
          {(point) => (
            <div class="trend-column">
              <div class="trend-bars">
                <i class="team" style={{ height: `${point.teamCompletion}%` }} title={`Team completion ${point.teamCompletion}%`} />
                <i class="crm" style={{ height: `${point.crmCompletion}%` }} title={`CRM completion ${point.crmCompletion}%`} />
                <i class="visits" style={{ height: `${Math.max(10, (point.visitsCompleted / maxVisits()) * 100)}%` }} title={`${point.visitsCompleted} visits`} />
              </div>
              <span>{point.date.slice(5).replace('-', '/')}</span>
            </div>
          )}
        </For>
      </div>
      <div class="trend-legend">
        <span><i class="team" /> Team completion</span>
        <span><i class="crm" /> CRM completion</span>
        <span><i class="visits" /> Visits</span>
      </div>
    </section>
  );
}

export default PerformanceTrendPanel;
