# Interface Control Document (ICD)

> Starter version, with the button and LED slice filled in as a worked example.
> Replace and extend it for your own project. Freeze it early in Week 1; later
> changes go through a reviewed merge request and a line in the change log.

## 1. Serial frames (board <-> bridge)

Line-based text, 115200 baud, 8N1.

```
$<type>,<seq>,<value>*<checksum>\n
```

| Field    | Meaning |
| -------- | ------- |
| type     | One capital letter (see table below) |
| seq      | Sender's own counter, 0 to 65535, wraps around |
| value    | Integer. For B and L: 1 = pressed / LED on, 0 = released / LED off |
| checksum | Two hex digits: XOR of every character between `$` and `*` |

| Type | Direction        | Meaning | Example |
| ---- | ---------------- | ------- | ------- |
| B    | board -> computer | Button edge: 1 = pressed, 0 = released | `$B,17,1*75` |
| L    | computer -> board | LED command: 1 = on, 0 = off | `$L,3,1*..` |
| A    | board -> computer | Acknowledges an L frame; value = the seq of the L frame received | `$A,4,3*..` |

Receivers drop frames with a bad checksum or an unknown format and carry on.
The board also prints boot messages on the same port; they are not frames and
are ignored the same way.

## 2. Backend API (bridge and page <-> backend)

| Method | Path        | Body / result | Purpose |
| ------ | ----------- | ------------- | ------- |
| POST   | `/events`   | `{ "pressed": true }` -> 201 with the new state | Bridge reports a button edge |
| GET    | `/state`    | `{ "pressed": false, "updatedAt": "..." }` | Current button state |
| GET    | `/events`   | List of recent edges, newest first | History |
| GET    | `/commands` | `[ { "type": "led", "on": true } ]` | Bridge polls for LED commands (each is handed over once) |
| GET    | `/live`     | Server-sent events, one message per state change | Live updates for the page |

Bad request bodies get `400`.

## 3. Database (SQLite)

| Table          | Columns |
| -------------- | ------- |
| `button_events` | `id` (PK), `pressed` (0/1), `created_at` |
| `button_state`  | `id` (always 1), `pressed` (0/1), `updated_at` |

## 4. LED behavior

The backend drives the LED: it turns on when the backend receives a press and
off when it receives a release. If the backend is down, the LED does not change.

## 5. Team decisions

_Write yours here, one line each: where Morse encoding and decoding runs, what
the board does on a delete message, buffering, retries and acknowledgements._

## Change log

| Version | Date | Change |
| ------- | ---- | ------ |
| 1.0     |      | Starter version |
