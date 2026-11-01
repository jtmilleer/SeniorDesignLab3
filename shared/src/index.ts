export * from './frame';

export interface ButtonState {
  pressed: boolean;
  updatedAt: string;
}

// A command the backend wants the board to carry out.
export interface LedCommand {
  type: 'led';
  on: boolean;
}
