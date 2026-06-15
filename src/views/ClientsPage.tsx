import { createEffect, createSignal, For, Show } from 'solid-js';
import Header from '../components/Header';
import { formatCurrency } from '../services';
import { state } from '../store';

type ClientTab = 'overview' | 'opportunity' | 'activity' | 'contacts';

const tabs: { id: ClientTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'opportunity', label: 'Deal' },
  { id: 'activity', label: 'Activity' },
  { id: 'contacts', label: 'Contacts' },
];

function ClientsPage() {
  const [selectedId, setSelectedId] = createSignal(state.ui.selectedClientId ?? state.ui.selectedMapAccountId ?? state.crm.accounts[0]?.id);
  const [activeTab, setActiveTab] = createSignal<ClientTab>('overview');
  const selected = () => state.crm.accounts.find((account) => account.id === selectedId()) ?? state.crm.accounts[0];
  const accountContacts = () => state.crm.contacts.filter((contact) => contact.accountId === selected()?.id);
  const accountOpportunity = () => state.crm.opportunities.find((opportunity) => opportunity.accountId === selected()?.id);
  const accountActivities = () => state.crm.activities.filter((activity) => activity.accountId === selected()?.id);

  createEffect(() => {
    if (state.ui.selectedClientId) {
      setSelectedId(state.ui.selectedClientId);
      setActiveTab('overview');
    }
  });

  return (
    <div class="content-stack">
      <Header title="Clients" subtitle="Account context on demand" />
      <div class="horizontal-list">
        <For each={state.crm.accounts}>
          {(account) => (
            <button class={account.id === selected()?.id ? 'pill selected' : 'pill'} onClick={() => {
              setSelectedId(account.id);
              setActiveTab('overview');
            }}>
              {account.name}
            </button>
          )}
        </For>
      </div>

      <section class="panel client-hero-panel">
        <div>
          <span class="eyebrow">{selected()?.industry}</span>
          <h2>{selected()?.name}</h2>
          <p>{selected()?.summary}</p>
        </div>
        <div class="summary-stat-row">
          <div><span>Status</span><strong>{selected()?.status}</strong></div>
          <div><span>Tier</span><strong>{selected()?.tier ?? 'Core'}</strong></div>
          <div><span>Risk</span><strong>{selected()?.engagementRisk ?? 'Low'}</strong></div>
        </div>
      </section>

      <nav class="segmented-control client-tabs" aria-label="Client sections">
        <For each={tabs}>
          {(tab) => (
            <button class={activeTab() === tab.id ? 'selected' : ''} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          )}
        </For>
      </nav>

      <Show when={activeTab() === 'overview'}>
        <section class="panel">
          <h3>Next action</h3>
          <p>{selected()?.nextAction ?? 'Review account context before the next touchpoint.'}</p>
          <Show when={selected()?.risks.length}>
            <div class="risk-list">
              <For each={selected()?.risks ?? []}>
                {(risk) => <span>{risk}</span>}
              </For>
            </div>
          </Show>
        </section>
      </Show>

      <Show when={activeTab() === 'opportunity'}>
        <Show when={accountOpportunity()} fallback={<section class="panel"><p>No active opportunity for this account.</p></section>}>
          {(opportunity) => (
            <section class="panel">
              <h3>Opportunity</h3>
              <div class="list-row">
                <div><strong>{opportunity().name}</strong><span>{opportunity().stage} - {opportunity().probability}%</span></div>
                <strong>{formatCurrency(opportunity().amount)}</strong>
              </div>
              <p>{opportunity().nextStep}</p>
            </section>
          )}
        </Show>
      </Show>

      <Show when={activeTab() === 'activity'}>
        <section class="panel">
          <h3>Recent activity</h3>
          <For each={accountActivities()} fallback={<p>No recent activity.</p>}>
            {(activity) => <div class="timeline-item"><strong>{activity.title}</strong><span>{activity.date}</span><p>{activity.notes}</p></div>}
          </For>
        </section>
      </Show>

      <Show when={activeTab() === 'contacts'}>
        <section class="panel">
          <h3>Contacts</h3>
          <For each={accountContacts()} fallback={<p>No contacts assigned.</p>}>
            {(contact) => <div class="list-row"><div><strong>{contact.name}</strong><span>{contact.role}</span></div><span>{contact.phone}</span></div>}
          </For>
        </section>
      </Show>
    </div>
  );
}

export default ClientsPage;
