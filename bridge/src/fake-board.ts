import { encodeFrame, FrameError, LineReader, parseFrame } from '@morsekey/shared';
import type { BoardPort } from './ports';

// The simulator: a pretend ESP32 that speaks the same frames as the firmware.
// Build and test the rest of the stack with it before the real board works.
//
// TODO(student): add fault injection (bad checksum, dropped frame, garbage
// bytes, a release that never arrives) so you can test the failure cases.
export class FakeBoard implements BoardPort {
  led = false;
  private seq = 0;
  private listener: (chunk: string) => void = () => {};
  private readonly lines = new LineReader();
  private demo?: ReturnType<typeof setInterval>;

  // ---- what the person at the board does ----
  press(): void {
    this.send(1);
  }

  release(): void {
    this.send(0);
  }

  // Presses for `holdMs` every `everyMs`, so the page has something to show.
  startDemo(everyMs = 3000, holdMs = 1000): void {
    this.demo = setInterval(() => {
      this.press();
      setTimeout(() => this.release(), holdMs);
    }, everyMs);
  }

  // ---- BoardPort: what the bridge sees ----
  onData(callback: (chunk: string) => void): void {
    this.listener = callback;
  }

  write(data: string): void {
    for (const line of this.lines.push(data)) {
      try {
        const frame = parseFrame(line);
        if (frame.type === 'L') {
          this.led = frame.value === 1;
          // Acknowledge: value = the sequence number of the command we received.
          this.listener(encodeFrame({ type: 'A', seq: this.seq++, value: frame.seq }));
        }
      } catch (err) {
        if (!(err instanceof FrameError)) throw err;
      }
    }
  }

  close(): void {
    if (this.demo) clearInterval(this.demo);
  }

  private send(value: 0 | 1): void {
    this.listener(encodeFrame({ type: 'B', seq: this.seq++, value }));
  }
}
