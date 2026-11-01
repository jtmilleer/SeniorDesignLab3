import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app';

const port = Number(process.env.PORT ?? 3000);
// Default: <repo>/data/morsekey.db, whatever folder you start the server from.
const dbPath = process.env.DB_PATH ?? fileURLToPath(new URL('../../data/morsekey.db', import.meta.url));
mkdirSync(dirname(dbPath), { recursive: true });

const app = buildApp({ dbPath });
app.listen({ port, host: '0.0.0.0' }).then(() => {
  console.log(`backend listening on http://localhost:${port} (database: ${dbPath})`);
});
