import Fastify, { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ButtonRepository } from './button-repository';
import { CommandQueue } from './command-queue';
import { openDb, type Db } from './db';
import { LiveHub } from './live-hub';

// What the bridge sends when the board reports a press or a release.
const EventBody = z.object({ pressed: z.boolean() });

export interface AppOptions {
  db?: Db;
  dbPath?: string;
}

export function buildApp(options: AppOptions = {}): FastifyInstance {
  const db = options.db ?? openDb(options.dbPath ?? ':memory:');
  const buttons = new ButtonRepository(db);
  const commands = new CommandQueue();
  const hub = new LiveHub();
  const app = Fastify();

  // Bad request bodies come back as 400, not as a server error.
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof z.ZodError) {
      return reply.code(400).send({ error: 'invalid request', details: err.issues });
    }
    app.log.error(err);
    return reply.code(500).send({ error: 'internal error' });
  });

  // The board reported an edge (via the bridge).
  // The backend stores it, tells the page, and decides what the LED should do:
  // LED on while the button is pressed, off when it is released.
  app.post('/events', async (req, reply) => {
    const { pressed } = EventBody.parse(req.body);
    const state = buttons.record(pressed);
    commands.enqueue({ type: 'led', on: pressed });
    hub.publish(state);
    return reply.code(201).send(state);
  });

  app.get('/state', async () => buttons.current());

  app.get('/events', async () => buttons.recent());

  // The bridge polls this and sends every command to the board.
  app.get('/commands', async () => commands.takeAll());

  // Live updates for the web page.
  app.get('/live', (req, reply) => {
    reply.hijack();
    const res = reply.raw;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(`data: ${JSON.stringify(buttons.current())}\n\n`);
    hub.add(res);
    req.raw.on('close', () => hub.remove(res));
  });

  app.addHook('onClose', async () => {
    db.close();
  });

  return app;
}
