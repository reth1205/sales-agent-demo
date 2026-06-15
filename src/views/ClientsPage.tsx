import { createEffect, createSignal, For, Show } from 'solid-js';
import Header from '../components/Header';
import { formatCurrency } from '../services';
import { state } from '../store';

function ClientsPage() {
  const [selectedId, setSelectedId] = createSignal(state.ui.selectedClientId ?? state.ui.selectedMapAccountId ?? state.crm.accounts[0]?.id);
  const selected = () => state.crm.accounts.find((account) => account.id === selectedId()) ?? state.crm.accounts[0];
  const accountContacts = () => state.crm.contacts.filter((contact) => contact.accountId === selected()?.id);
  const accountOpportunity = () => state.crm.opportunities.find((opportunity) => opportunity.accountId === selected()?.id);
  const accountActivities = () => state.crm.activities.filter((activity) => activity.accountId === selected()?.id);

  createEffect(() => {
    if (state.ui.selectedClientId) setSelectedId(state.ui.selectedClientId);
  });

  return (
    <div class="content-stack">
      <Header title="Clients" subtitle="Assigned CRM context" />
      <div class="horizontal-list">
        <For each={state.crm.accounts}>
          {(account) => (
            <button class={account.id === selected()?.id ? 'pill selected' : 'pill'} onClick={() => setSelectedId(account.id)}>
              {account.name}
            </button>
          )}
        </For>
      </div>
      <section class="panel">
        <span class="eyebrow">{selected()?.industry}</span>
        <h2>{selected()?.name}</h2>
        <p>{selected()?.summary}</p>
        <div class="metric-grid">
          <div><span>Status</span><strong>{selected()?.status}</strong></div>
          <div><span>Risks</span><strong>{selected()?.risks.length || 0}</strong></div>
        </div>
      </section>
      <section class="panel">
        <h3>Contacts</h3>
        <For each={accountContacts()}>
          {(contact) => <div class="list-row"><div><strong>{contact.name}</strong><span>{contact.role}</span></div><span>{contact.phone}</span></div>}
        </For>
      </section>
      <Show when={accountOpportunity()}>
        {(opportunity) => (
          <section class="panel">
            <h3>Opportunity</h3>
            <div class="list-row">
              <div><strong>{opportunity().name}</strong><span>{opportunity().stage} · {opportunity().probability}%</span></div>
              <strong>{formatCurrency(opportunity().amount)}</strong>
            </div>
            <p>{opportunity().nextStep}</p>
          </section>
        )}
      </Show>
      <section class="panel">
        <h3>Recent activity</h3>
        <For each={accountActivities()}>
          {(activity) => <div class="timeline-item"><strong>{activity.title}</strong><span>{activity.date}</span><p>{activity.notes}</p></div>}
        </For>
      </section>
    </div>
  );
}

export default ClientsPage;
