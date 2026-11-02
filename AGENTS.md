# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Copilot, Cursor, etc.)
working in this repo. Humans: read this too, the same rules apply to you when
you use AI.

## Project

MorseKey: tap Morse on the ESP32 BOOT button, see it decoded on a web page, and
send typed text back to blink on the LED.

```
BOOT button --> firmware (C) --> bridge (TS) --> backend (Node + SQLite) --> web page (TS)
   LED <------- firmware <------- bridge <------- backend
```

| Folder      | What it holds |
| ----------- | ------------- |
| `firmware/` | ESP-IDF app (`main`) and pure C logic with host tests (`components/`, `test/`) |
| `shared/`   | TypeScript frame code and shared types (must match the C frame format) |
| `bridge/`   | Serial-to-HTTP bridge and the board simulator (`fake-board.ts`) |
| `backend/`  | Fastify API, SQLite repository, command queue, live updates |
| `frontend/` | Web page (Vite + TypeScript) |
| `docs/`     | `icd.md` (the contract), `ai-log.md` (AI usage log), ADRs, learning notes |

## Commands

```
npm install
npm run dev:sim          # whole stack with the simulated board
npm test                 # TypeScript tests (shared, backend, bridge, frontend)
npm run typecheck        # the CI lint stage
make -C firmware test    # C logic tests on the laptop
```

Run the tests for every layer you touched before saying a change is done.

## Rules

- **Never push to `main`.** Work on a branch and open a merge request. Main must
  stay green in CI.
- **Keep firmware logic pure C.** No GPIO, timer or UART calls inside
  `components/`; drivers in `main/` call the logic. Logic must be testable on
  the laptop.
- **Validate at the boundary.** Every request body goes through a schema; bad
  input returns `400`.
- **Never commit secrets.** Use GitLab CI variables.
- **Do not invent hardware facts.** Pin numbers, register values and timing
  constants come from the datasheet or measured data, not from memory. Say so
  when you are unsure.
- **Bugs found by hand become tests** (a trace in `data/` or a simulator case).

## Keep the ICD in sync (`docs/icd.md`)

`docs/icd.md` is the contract every layer builds against. If a change touches
any of these, update the ICD **in the same commit/MR**:

- serial frame types, fields, checksums or sequence handling
- backend endpoints, request/response bodies, status codes, live update messages
- database tables or columns
- LED states and behavior
- team decisions (Morse location, delete handling, retries, acks)

Every ICD edit also adds a row to the **Change log** table at the bottom of
`docs/icd.md`:

```
| 1.1     | 2026-11-01 | Added `E` error frame (board -> computer); see section 1 |
```

- Bump the minor version for each change (1.0 -> 1.1 -> 1.2). Bump the major
  version only for a breaking change the whole team agreed on.
- Use the real date (YYYY-MM-DD) and one short line saying what changed and
  which section.
- Once the ICD is frozen, changes need a reviewed merge request. Point this out
  to the user rather than skipping it.

If code and ICD disagree, stop and ask which one is right. Do not silently
change either one to match.

## Log AI usage (`docs/ai-log.md`)

AI is welcome, but every significant use is labeled and logged. As an agent,
you do this **automatically** at the end of a task, without being asked.

### What counts as significant

Log it if the AI did any of these:

- wrote or rewrote code, tests, config or docs that get committed
- designed or chose an approach (state machine, protocol, schema, algorithm)
- reviewed a merge request or found a bug
- explained a datasheet, register or timing detail that the work relies on

Skip trivial uses: a typo fix, a one-line rename, a quick syntax question,
running existing commands.

### How to log

Append one row per significant use to the table in `docs/ai-log.md` (newest at
the bottom). Do not edit or delete other people's rows.

| Column | What to write |
| ------ | ------------- |
| Date | `YYYY-MM-DD` and the project week, e.g. `2026-11-01 (Wk 1)` |
| Who | The student driving the AI (from `git config user.name` if not stated) |
| Tool | Tool and model, e.g. `Claude Code (Opus)`, `ChatGPT`, `Copilot` |
| What I asked | One line summary of the request |
| What I used | What actually went into the repo (files, functions) |
| What I verified or changed | How it was checked: tests run, measured on the board, reviewed by hand, edits made. Write `Not yet verified` if nothing was checked |
| What I learned | One line takeaway, or how to ask better next time |

Be honest. Never claim verification that did not happen. Use `<br>` for line
breaks inside a cell, and escape `|` as `\|`.

### Label the work

- **Commit trailer.** Commits containing AI-assisted work end with:

  ```
  AI-Assisted: <tool> (see docs/ai-log.md)
  ```

- **Issue / MR label.** Remind the user to add the `ai-assisted` label to the
  issue and merge request.
- Include the `docs/ai-log.md` change in the same commit as the work it
  describes.

### End-of-task checklist

1. Tests pass for every layer touched.
2. `docs/icd.md` updated and change log row added, if an interface changed.
3. `docs/ai-log.md` row added, if the AI use was significant.
4. Tell the user what you logged, and remind them about the trailer and label.
