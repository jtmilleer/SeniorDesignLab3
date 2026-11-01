import type { ButtonState } from '@morsekey/shared';
import { describe } from './status';

const badge = document.getElementById('badge') as HTMLElement;
const updated = document.getElementById('updated') as HTMLElement;

function render(state: ButtonState): void {
  const { text, className } = describe(state);
  badge.textContent = text;
  badge.className = `badge ${className}`;
  updated.textContent = `last change: ${state.updatedAt} (UTC)`;
}

// First paint: ask for the current state once.
fetch('/state')
  .then((res) => res.json() as Promise<ButtonState>)
  .then(render)
  .catch(() => {});

// After that the backend pushes every change (server-sent events).
// TODO(student): show a "connection lost" message when the backend goes away,
// and think about what the page should show while it is disconnected.
const source = new EventSource('/live');
source.onmessage = (event) => render(JSON.parse(event.data) as ButtonState);
