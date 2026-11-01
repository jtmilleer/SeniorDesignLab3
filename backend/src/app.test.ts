import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from './app';

describe('backend', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp({ dbPath: ':memory:' });
  });
  afterEach(async () => {
    await app.close();
  });

  const post = (pressed: unknown) => app.inject({ method: 'POST', url: '/events', payload: { pressed } });

  it('starts with the button not pressed', async () => {
    const res = await app.inject({ method: 'GET', url: '/state' });
    expect(res.json().pressed).toBe(false);
  });

  it('stores a press and queues "LED on"', async () => {
    const res = await post(true);
    expect(res.statusCode).toBe(201);

    const state = await app.inject({ method: 'GET', url: '/state' });
    expect(state.json().pressed).toBe(true);

    const cmds = await app.inject({ method: 'GET', url: '/commands' });
    expect(cmds.json()).toEqual([{ type: 'led', on: true }]);
  });

  it('stores a release and queues "LED off"', async () => {
    await post(true);
    await app.inject({ method: 'GET', url: '/commands' });
    await post(false);

    const state = await app.inject({ method: 'GET', url: '/state' });
    expect(state.json().pressed).toBe(false);

    const cmds = await app.inject({ method: 'GET', url: '/commands' });
    expect(cmds.json()).toEqual([{ type: 'led', on: false }]);
  });

  it('hands each command over once', async () => {
    await post(true);
    await app.inject({ method: 'GET', url: '/commands' });
    const again = await app.inject({ method: 'GET', url: '/commands' });
    expect(again.json()).toEqual([]);
  });

  it('keeps a history of edges, newest first', async () => {
    await post(true);
    await post(false);
    const res = await app.inject({ method: 'GET', url: '/events' });
    expect(res.json().map((e: { pressed: boolean }) => e.pressed)).toEqual([false, true]);
  });

  it('rejects a bad body with 400', async () => {
    expect((await post('yes')).statusCode).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/events', payload: {} })).statusCode).toBe(400);
  });
});
