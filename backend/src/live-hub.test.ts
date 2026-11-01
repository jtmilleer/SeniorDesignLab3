import { describe, expect, it } from 'vitest';
import { LiveHub } from './live-hub';

describe('LiveHub', () => {
  it('sends a message to every sink and stops after remove()', () => {
    const a: string[] = [];
    const b: string[] = [];
    const sinkA = { write: (s: string) => a.push(s) };
    const sinkB = { write: (s: string) => b.push(s) };
    const hub = new LiveHub();
    hub.add(sinkA);
    hub.add(sinkB);

    hub.publish({ pressed: true });
    hub.remove(sinkB);
    hub.publish({ pressed: false });

    expect(a).toEqual(['data: {"pressed":true}\n\n', 'data: {"pressed":false}\n\n']);
    expect(b).toEqual(['data: {"pressed":true}\n\n']);
  });
});
