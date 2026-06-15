import { AlertTriangle, CheckCircle, ClipboardCheck, TrendingUp } from 'lucide-solid';
import { getAccountCoverageSummary, getCrmAdoptionScore, getTeamAverageCompletion, getTeamTotals } from '../selectors';
import { formatCurrency, formatPercent } from '../services';
import { state } from '../store';

function ManagerKpiStrip() {
  const totals = () => getTeamTotals();
  const coverage = () => getAccountCoverageSummary();
  const atRiskAgents = () => state.manager.agents.filter((agent) => agent.status === 'AtRisk' || agent.status === 'Missed').length;

  return (
    <section class="manager-kpi-strip">
      <div class="manager-kpi">
        <CheckCircle size={18} />
        <span>Team completion</span>
        <strong>{formatPercent(getTeamAverageCompletion())}</strong>
      </div>
      <div class="manager-kpi">
        <ClipboardCheck size={18} />
        <span>CRM completion</span>
        <strong>{formatPercent(getCrmAdoptionScore())}</strong>
      </div>
      <div class="manager-kpi">
        <AlertTriangle size={18} />
        <span>At risk</span>
        <strong>{atRiskAgents()} agents</strong>
      </div>
      <div class="manager-kpi">
        <TrendingUp size={18} />
        <span>Pipeline touched</span>
        <strong>{formatCurrency(coverage().pipelineTouched)}</strong>
      </div>
      <div class="manager-kpi wide-kpi">
        <ClipboardCheck size={18} />
        <span>Visits completed</span>
        <strong>{totals().visitsCompleted}/{totals().visitsScheduled}</strong>
      </div>
    </section>
  );
}

export default ManagerKpiStrip;
