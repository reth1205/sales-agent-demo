import { Show } from 'solid-js';
import { getOpenOpportunity } from '../selectors';
import type { Account } from '../types';

function VisitContext(props: { account: Account }) {
  const opportunity = () => getOpenOpportunity(props.account.id);
  return (
    <div class="context-box">
      <strong>{props.account.summary}</strong>
      <Show when={opportunity()}>
        {(item) => <span>{item().name}: {item().stage}, {item().probability}% probability</span>}
      </Show>
    </div>
  );
}

export default VisitContext;
