import { describe, expect, it } from 'vitest';
import { checksum, encodeFrame, FrameError, LineReader, parseFrame } from './frame';

// The same example frames are used in firmware/test/test_frame.c.
const PRESSED = '$B,17,1*75\n';

describe('frame', () => {
  it('computes the XOR checksum', () => {
    expect(checksum('B,17,1')).toBe(0x75);
  });

  it('encodes the example frame', () => {
    expect(encodeFrame({ type: 'B', seq: 17, value: 1 })).toBe(PRESSED);
  });

  it('parses the example frame', () => {
    expect(parseFrame(PRESSED)).toEqual({ type: 'B', seq: 17, value: 1 });
  });

  it('round-trips every type', () => {
    for (const type of ['B', 'L', 'A'] as const) {
      const f = { type, seq: 65535, value: 0 };
      expect(parseFrame(encodeFrame(f))).toEqual(f);
    }
  });

  it('rejects a bad checksum', () => {
    expect(() => parseFrame('$B,17,1*00\n')).toThrow(FrameError);
  });

  it('rejects garbage', () => {
    expect(() => parseFrame('hello')).toThrow(FrameError);
  });

  it('splits a stream into lines, even when a frame arrives in pieces', () => {
    const r = new LineReader();
    expect(r.push('$B,17,')).toEqual([]);
    expect(r.push('1*75\n$B,18,0*7')).toEqual(['$B,17,1*75\n']);
    expect(r.push('B\n')).toEqual(['$B,18,0*7B\n']);
  });
});
