import type { LedCommand } from '@morsekey/shared';

// Commands waiting for the bridge to pick them up and send to the board.
//
// TODO(student): takeAll() hands every command over and forgets it. If the
// bridge or the board drops one, it is lost for good, and a lost "LED off"
// leaves the LED stuck on. Keep commands until the board acknowledges them
// (the A frame in the ICD), and decide what happens when it never does.
export class CommandQueue {
  private pending: LedCommand[] = [];

  enqueue(cmd: LedCommand): void {
    this.pending.push(cmd);
  }

  takeAll(): LedCommand[] {
    const out = this.pending;
    this.pending = [];
    return out;
  }
}
