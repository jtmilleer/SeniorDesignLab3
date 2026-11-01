import { encodeFrame, FrameError, LineReader, parseFrame, type Frame } from '@morsekey/shared';
import type { BackendClient, BoardPort } from './ports';

export interface BridgeOptions {
  pollMs?: number;
  log?: (message: string) => void;
}

// Sits between the board (serial) and the backend (HTTP):
//   board -> backend : button edges, as POST /events
//   backend -> board : LED commands, picked up by polling GET /commands
export class Bridge {
  private readonly lines = new LineReader();
  private seq = 0;
  private timer?: ReturnType<typeof setInterval>;
  private polling = false;
  private readonly log: (message: string) => void;

  constructor(
    private readonly port: BoardPort,
    private readonly backend: BackendClient,
    private readonly options: BridgeOptions = {},
  ) {
    this.log = options.log ?? (() => {});
    this.port.onData((chunk) => this.onSerialData(chunk));
  }

  start(): void {
    this.timer = setInterval(() => void this.pollOnce(), this.options.pollMs ?? 100);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.port.close();
  }

  // Asks the backend for new commands and sends each one to the board.
  async pollOnce(): Promise<void> {
    if (this.polling) return;
    this.polling = true;
    try {
      for (const cmd of await this.backend.takeCommands()) {
        if (cmd.type === 'led') {
          this.port.write(encodeFrame({ type: 'L', seq: this.seq++, value: cmd.on ? 1 : 0 }));
        }
      }
    } catch (err) {
      // TODO(student): when the backend is down, commands taken earlier are
      // already gone, and the LED no longer matches the page. Decide how the
      // bridge should behave while the backend is unreachable.
      this.log(`poll failed: ${String(err)}`);
    } finally {
      this.polling = false;
    }
  }

  private onSerialData(chunk: string): void {
    for (const line of this.lines.push(chunk)) {
      let frame: Frame;
      try {
        frame = parseFrame(line);
      } catch (err) {
        if (err instanceof FrameError) {
          this.log(`dropped bad frame: ${err.message}`);
          continue;
        }
        throw err;
      }
      void this.handle(frame);
    }
  }

  private async handle(frame: Frame): Promise<void> {
    if (frame.type === 'B') {
      try {
        await this.backend.postEvent(frame.value === 1);
      } catch (err) {
        this.log(`POST /events failed: ${String(err)}`);
      }
    } else if (frame.type === 'A') {
      // TODO(student): the board acknowledges each LED command (frame type A,
      // value = the sequence number it received). Pass that on to the backend.
      this.log(`ack for command ${frame.value}`);
    }
  }
}
