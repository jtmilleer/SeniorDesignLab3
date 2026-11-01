import type { ButtonState } from '@morsekey/shared';
import type { Db } from './db';

export interface ButtonEvent {
  id: number;
  pressed: boolean;
  createdAt: string;
}

// Owns the two button tables. Nothing else in the backend writes SQL for them.
export class ButtonRepository {
  constructor(private readonly db: Db) {}

  // Stores one press or release edge and updates the current state.
  record(pressed: boolean): ButtonState {
    const value = pressed ? 1 : 0;
    const tx = this.db.transaction(() => {
      this.db.prepare('INSERT INTO button_events (pressed) VALUES (?)').run(value);
      this.db
        .prepare("UPDATE button_state SET pressed = ?, updated_at = datetime('now') WHERE id = 1")
        .run(value);
    });
    tx();
    return this.current();
  }

  current(): ButtonState {
    const row = this.db.prepare('SELECT pressed, updated_at FROM button_state WHERE id = 1').get() as {
      pressed: number;
      updated_at: string;
    };
    return { pressed: row.pressed === 1, updatedAt: row.updated_at };
  }

  recent(limit = 20): ButtonEvent[] {
    const rows = this.db
      .prepare('SELECT id, pressed, created_at FROM button_events ORDER BY id DESC LIMIT ?')
      .all(limit) as { id: number; pressed: number; created_at: string }[];
    return rows.map((r) => ({ id: r.id, pressed: r.pressed === 1, createdAt: r.created_at }));
  }
}
