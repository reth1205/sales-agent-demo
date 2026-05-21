import { state } from '../store';

function DailyProgressWidget() {
  return (
    <section class="progress-widget">
      <div class="progress-ring" style={{ '--progress': `${state.progress.percent}%` }}>
        <span>{state.progress.percent}%</span>
      </div>
      <div>
        <strong>Daily progress</strong>
        <p>{state.progress.milestones.at(-1) ?? 'Add visit activity to build momentum.'}</p>
      </div>
    </section>
  );
}

export default DailyProgressWidget;
