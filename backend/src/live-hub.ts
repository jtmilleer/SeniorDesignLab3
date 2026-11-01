// Pushes state changes to every browser that has the page open
// (server-sent events: one-way, the browser reconnects by itself).
export interface Sink {
  write(chunk: string): unknown;
}

export class LiveHub {
  private sinks = new Set<Sink>();

  add(sink: Sink): void {
    this.sinks.add(sink);
  }

  remove(sink: Sink): void {
    this.sinks.delete(sink);
  }

  get size(): number {
    return this.sinks.size;
  }

  publish(data: unknown): void {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const sink of this.sinks) sink.write(message);
  }
}
