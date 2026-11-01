import { HttpBackendClient } from './backend-client';
import { Bridge } from './bridge';
import { FakeBoard } from './fake-board';
import { openSerialPort } from './serial-port';

// Usage:
//   npm run dev:sim -w bridge                      simulator, no hardware needed
//   npm start -w bridge -- --port /dev/ttyUSB0     real ESP32
const args = process.argv.slice(2);
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';
const log = (m: string) => console.log(`[bridge] ${m}`);

async function main(): Promise<void> {
  let board;
  if (args.includes('--sim')) {
    const fake = new FakeBoard();
    fake.startDemo();
    board = fake;
    log('using the simulator: a press every 3 s, held for 1 s');
  } else {
    const i = args.indexOf('--port');
    if (i < 0 || !args[i + 1]) {
      console.error('Pass --sim, or --port <serial port>, e.g. --port /dev/ttyUSB0');
      process.exit(1);
    }
    board = await openSerialPort(args[i + 1]);
    log(`serial port ${args[i + 1]} open`);
  }

  const bridge = new Bridge(board, new HttpBackendClient(backendUrl), { log });
  bridge.start();
  log(`forwarding to ${backendUrl}`);
}

void main();
