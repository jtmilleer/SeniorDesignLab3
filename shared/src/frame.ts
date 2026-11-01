// Serial frame format (see docs/icd.md):
//
//   $<type>,<seq>,<value>*<checksum>\n
//
//   type      one letter: B (button edge, board -> computer),
//                         L (LED command, computer -> board),
//                         A (acknowledgement, board -> computer)
//   seq       sequence number of the sender, 0..65535, wraps around
//   value     an integer; for B and L: 1 = pressed / LED on, 0 = released / LED off
//   checksum  two hex digits: XOR of every character between '$' and '*'
//
// Example: "$B,17,1*75\n" = button pressed, sender sequence number 17.
//
// This file and firmware/components/frame/frame.c implement the same format.
// Both are tested against the same example frames.

export type FrameType = 'B' | 'L' | 'A';

export interface Frame {
  type: FrameType;
  seq: number;
  value: number;
}

export class FrameError extends Error {}

const TYPES: readonly string[] = ['B', 'L', 'A'];

export function checksum(body: string): number {
  let x = 0;
  for (let i = 0; i < body.length; i++) x ^= body.charCodeAt(i);
  return x;
}

export function encodeFrame(f: Frame): string {
  const body = `${f.type},${f.seq & 0xffff},${f.value}`;
  const sum = checksum(body).toString(16).toUpperCase().padStart(2, '0');
  return `$${body}*${sum}\n`;
}

export function parseFrame(line: string): Frame {
  const text = line.replace(/[\r\n]+$/, '');
  const m = /^\$([A-Z]),(\d{1,5}),(-?\d{1,6})\*([0-9A-Fa-f]{2})$/.exec(text);
  if (!m) throw new FrameError(`malformed frame: ${JSON.stringify(text)}`);
  const [, type, seq, value, sum] = m;
  const body = `${type},${seq},${value}`;
  if (checksum(body) !== parseInt(sum, 16)) throw new FrameError(`bad checksum: ${JSON.stringify(text)}`);
  if (!TYPES.includes(type)) throw new FrameError(`unknown frame type: ${type}`);
  return { type: type as FrameType, seq: Number(seq), value: Number(value) };
}

// Collects serial bytes and hands back complete lines.
// TODO(student): after garbage bytes, discard everything up to the next '$'
// so one corrupted frame cannot swallow the one that follows it.
export class LineReader {
  private buffer = '';

  push(chunk: string): string[] {
    this.buffer += chunk;
    const lines: string[] = [];
    let i: number;
    while ((i = this.buffer.indexOf('\n')) >= 0) {
      lines.push(this.buffer.slice(0, i + 1));
      this.buffer = this.buffer.slice(i + 1);
    }
    return lines;
  }
}
