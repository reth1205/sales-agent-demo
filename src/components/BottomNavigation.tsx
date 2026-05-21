import { A } from '@solidjs/router';
import { CalendarDays, ClipboardList, Home, Settings, UsersRound } from 'lucide-solid';
import { For } from 'solid-js';

function BottomNavigation() {
  const links = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/clients', label: 'Clients', icon: UsersRound },
    { href: '/schedule', label: 'Schedule', icon: CalendarDays },
    { href: '/reporting', label: 'Report', icon: ClipboardList },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav class="bottom-nav" aria-label="Main navigation">
      <For each={links}>
        {(item) => {
          const Icon = item.icon;
          return (
            <A href={item.href} activeClass="active" class="nav-link">
              <Icon size={20} />
              <span>{item.label}</span>
            </A>
          );
        }}
      </For>
    </nav>
  );
}

export default BottomNavigation;
