# MorseKey starter

A working, deliberately small slice of the whole stack. Pressing the BOOT
button on the ESP32 lights the LED and flips a badge on a web page; releasing
the button turns both off. Every press and release is stored in a database.

```
BOOT button --> firmware (C) --> bridge (TS) --> backend (Node + SQLite) --> web page (TS)
   LED <------- firmware <------- bridge <------- backend (decides: LED on while pressed)
```

The LED is driven by the backend on purpose: one tap travels all the way up to
the database and all the way back down to the pin. That is the same path your
project uses for everything else.

## Run it without hardware (the simulator)

```
npm install
npm run dev:sim
```

Open <http://localhost:5173>. The simulated board presses the button for one
second every three seconds. Check the database:

```
curl http://localhost:3000/state
curl http://localhost:3000/events
```

## Run the tests

```
npm test                 # TypeScript: shared, backend, bridge, frontend
make -C firmware test    # the C frame code, on your laptop
npm run typecheck        # the "lint" stage in CI
```

## Run it with the real board

1. Install ESP-IDF, then in `firmware/`: `idf.py build flash` (check the pin
   numbers at the top of `main/main.c` against your board first).
2. Close any serial monitor, then start the backend and the page, and run the
   bridge against the board's port:

```
npm run dev:backend
npm run dev:frontend
npm start -w bridge -- --port /dev/ttyUSB0
```

The firmware has not been run on a board by the author of this starter. Expect
to adjust it.

## Where things are

| Folder       | What it holds |
| ------------ | ------------- |
| `firmware/`  | C: frame encoder and parser with tests (`components/frame`), and an ESP-IDF app sketch (`main`) |
| `shared/`    | TypeScript frame code (same format as the C code) and shared types |
| `bridge/`    | Serial-to-HTTP bridge, plus the board simulator (`fake-board.ts`) |
| `backend/`   | Fastify API, SQLite repository, command queue, live updates |
| `frontend/`  | The web page (Vite + TypeScript) |
| `docs/`      | `icd.md`, the Interface Control Document, with this slice filled in |

## What is deliberately left out

Look for `TODO(student)` in the code. The starter shows each pattern once and
leaves these gaps on purpose:

- **Lost release, stuck LED.** The backend forgets a command as soon as the
  bridge takes it (`command-queue.ts`). Use the acknowledgement frame to fix it.
- **Acknowledgements go nowhere.** The board sends `A` frames; the bridge only
  logs them (`bridge.ts`).
- **No debounce** in the firmware (`main.c`).
- **Parser resync.** One corrupt frame should not swallow the next one
  (`frame.ts`).
- **No fault injection** in the simulator (`fake-board.ts`).
- **No "connection lost" message** on the page (`main.ts`).
- **Unprotected sequence counter** shared by two tasks (`main.c`).
- **`docker-compose.yml`** starts only the backend.

None of the Morse logic, the ready/error LED states, the history list, the Save
key, update or delete is here. That is your project.
