import { Show } from 'solid-js';

function Header(props: { title: string; subtitle?: string }) {
  return (
    <header class="screen-header">
      <div>
        <h1>{props.title}</h1>
        <Show when={props.subtitle}>
          <p>{props.subtitle}</p>
        </Show>
      </div>
      <div class="avatar">SR</div>
    </header>
  );
}

export default Header;
