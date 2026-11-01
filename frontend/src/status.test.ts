import { describe as suite, expect, it } from 'vitest';
import { describe } from './status';

suite('describe()', () => {
  it('says pressed', () => {
    expect(describe({ pressed: true, updatedAt: '' })).toEqual({ text: 'Button pressed', className: 'pressed' });
  });
  it('says not pressed', () => {
    expect(describe({ pressed: false, updatedAt: '' })).toEqual({ text: 'Button not pressed', className: 'released' });
  });
});
