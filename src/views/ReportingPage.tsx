import { Check, WifiOff } from 'lucide-solid';
import { For, Show } from 'solid-js';
import DailyProgressWidget from '../components/DailyProgressWidget';
import Header from '../components/Header';
import { state } from '../store';

function ReportingPage() {
  const completed = () => state.visits.filter((visit) => visit.status === 'Completed').length;
  const pendingSync = () => state.queue.length;
  return (
    <div class="content-stack">
      <Header title="Reporting" subtitle="Daily activity and sync status" />
      <DailyProgressWidget />
      <section class="panel">
        <div class="metric-grid">
          <div><span>Completed visits</span><strong>{completed()}/{state.visits.length}</strong></div>
          <div><span>Open tasks</span><strong>{state.crm.tasks.length}</strong></div>
          <div><span>Pending sync</span><strong>{pendingSync()}</strong></div>
          <div><span>Streak</span><strong>{state.crm.agent.streakDays} days</strong></div>
        </div>
      </section>
      <section class="panel">
        <h3>Milestones</h3>
        <Show when={state.progress.milestones.length} fallback={<p>No milestone reached yet.</p>}>
          <For each={state.progress.milestones}>
            {(milestone) => <div class="list-row"><strong>{milestone}</strong><Check size={18} /></div>}
          </For>
        </Show>
      </section>
      <section class="panel">
        <h3>Sync queue</h3>
        <Show when={state.queue.length} fallback={<p>All CRM updates are synced.</p>}>
          <For each={state.queue}>
            {(item) => <div class="list-row"><div><strong>{item.summary.eventUpdate.outcome}</strong><span>{new Date(item.createdAt).toLocaleString()}</span></div><WifiOff size={18} /></div>}
          </For>
        </Show>
      </section>
    </div>
  );
}

export default ReportingPage;
