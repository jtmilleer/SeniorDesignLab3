import type { ButtonState } from '@morsekey/shared';

// Pure function: easy to test without a browser.
export function describe(state: ButtonState): { text: string; className: 'pressed' | 'released' } {
  return state.pressed
    ? { text: 'Button pressed', className: 'pressed' }
    : { text: 'Button not pressed', className: 'released' };
}
