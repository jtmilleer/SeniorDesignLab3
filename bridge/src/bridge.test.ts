import type { LedCommand } from '@morsekey/shared';
import { describe, expect, it } from 'vitest';
import { Bridge } from './bridge';
import { FakeBoard } from './fake-board';
import type { BackendClient } from './ports';

class FakeBackend implements BackendClient {
  events: boolean[] = [];
  queue: LedCommand[] = [];
  async postEvent(pressed: boolean): Promise<void> {
    this.events.push(pressed);
  }
  async takeCommands(): Promise<LedCommand[]> {
    const out = this.queue;
    this.queue = [];
    return out;
  }
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('bridge', () => {
  it('forwards a press and a release to the backend', async () => {
    const board = new FakeBoard();
    const backend = new FakeBackend();
    new Bridge(board, backend);

    board.press();
    board.release();
    await tick();

    expect(backend.events).toEqual([true, false]);
  });

  it('sends an LED command from the backend to the board', async () => {
    const board = new FakeBoard();
    const backend = new FakeBackend();
    const bridge = new Bridge(board, backend);

    backend.queue.push({ type: 'led', on: true });
    await bridge.pollOnce();
    expect(board.led).toBe(true);

    backend.queue.push({ type: 'led', on: false });
    await bridge.pollOnce();
    expect(board.led).toBe(false);
  });

  it('ignores garbage on the serial line', async () => {
    const board = new FakeBoard();
    const backend = new FakeBackend();
    const logs: string[] = [];
    new Bridge(board, backend, { log: (m) => logs.push(m) });

    (board as unknown as { listener: (s: string) => void }).listener('garbage\n$B,1,1*00\n');
    await tick();

    expect(backend.events).toEqual([]);
    expect(logs.length).toBe(2);
  });
});
