import type { LedCommand } from '@morsekey/shared';

// The bridge talks to the board through this interface, so the same bridge
// code runs against a real serial port or against the simulator.
export interface BoardPort {
  write(data: string): void;
  onData(callback: (chunk: string) => void): void;
  close(): void;
}

// ...and to the backend through this one (real HTTP, or a fake in tests).
export interface BackendClient {
  postEvent(pressed: boolean): Promise<void>;
  takeCommands(): Promise<LedCommand[]>;
}
