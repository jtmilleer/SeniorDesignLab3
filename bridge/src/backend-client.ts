import type { LedCommand } from '@morsekey/shared';
import type { BackendClient } from './ports';

export class HttpBackendClient implements BackendClient {
  constructor(private readonly baseUrl: string) {}

  async postEvent(pressed: boolean): Promise<void> {
    const res = await fetch(`${this.baseUrl}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pressed }),
    });
    if (!res.ok) throw new Error(`POST /events failed: ${res.status}`);
  }

  async takeCommands(): Promise<LedCommand[]> {
    const res = await fetch(`${this.baseUrl}/commands`);
    if (!res.ok) throw new Error(`GET /commands failed: ${res.status}`);
    return (await res.json()) as LedCommand[];
  }
}
