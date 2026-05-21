import { useNavigate } from '@solidjs/router';
import { Check, MapPin, UserRound } from 'lucide-solid';
import { actions, state } from '../store';

function LoginPage() {
  const navigate = useNavigate();
  const login = () => {
    actions.login();
    navigate('/dashboard');
  };

  return (
    <section class="login-card">
      <div class="brand-mark">
        <MapPin size={30} />
      </div>
      <h1>Sales Agent</h1>
      <p>Field visit assistant for mobile sales teams.</p>
      <div class="agent-preview">
        <UserRound size={20} />
        <div>
          <strong>{state.crm.agent.name}</strong>
          <span>{state.crm.agent.territory}</span>
        </div>
      </div>
      <button class="primary-action" onClick={login}>
        <Check size={18} />
        Sign in as Sofia
      </button>
    </section>
  );
}

export default LoginPage;
