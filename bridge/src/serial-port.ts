import type { BoardPort } from './ports';

// A real serial port (the ESP32 over USB). Loaded on demand so the simulator
// and the tests do not need the serial library at all.
export async function openSerialPort(path: string, baudRate = 115200): Promise<BoardPort> {
  const { SerialPort } = await import('serialport');
  const port = new SerialPort({ path, baudRate });
  return {
    write: (data) => void port.write(data),
    onData: (callback) => port.on('data', (buf: Buffer) => callback(buf.toString('utf8'))),
    close: () => void port.close(),
  };
}
