// Serial frame format shared with the computer side (see docs/icd.md and
// shared/src/frame.ts). Pure C: no hardware calls, so it compiles and is
// tested on a laptop with `make test`.
//
//   $<type>,<seq>,<value>*<checksum>\n        e.g. "$B,17,1*75\n"
//
// checksum = XOR of every character between '$' and '*', as two hex digits.
#ifndef FRAME_H
#define FRAME_H

#include <stddef.h>
#include <stdint.h>

#define FRAME_OK            0
#define FRAME_ERR_FORMAT   (-1)
#define FRAME_ERR_CHECKSUM (-2)

// Longest frame body ("B,65535,-100000") plus some room.
#define FRAME_MAX_LEN 32

typedef struct {
    char     type;   // 'B' button edge, 'L' LED command, 'A' acknowledgement
    uint16_t seq;    // sender's sequence number, wraps at 65535
    int      value;  // B and L: 1 = pressed / LED on, 0 = released / LED off
} frame_t;

// XOR of the first n characters of s.
uint8_t frame_checksum(const char *s, size_t n);

// Writes the frame, including the trailing newline and a NUL terminator, into
// buf. Returns the number of bytes before the NUL, or 0 if cap is too small.
size_t frame_encode(char *buf, size_t cap, const frame_t *f);

// Parses one line (a trailing \r\n is ignored). Returns FRAME_OK, or
// FRAME_ERR_FORMAT / FRAME_ERR_CHECKSUM. Does not check that the type is one
// you know: that is up to the caller.
int frame_parse(const char *line, frame_t *out);

#endif
