#include "frame.h"

#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

uint8_t frame_checksum(const char *s, size_t n) {
    uint8_t x = 0;
    for (size_t i = 0; i < n; i++) {
        x ^= (uint8_t)s[i];
    }
    return x;
}

size_t frame_encode(char *buf, size_t cap, const frame_t *f) {
    char body[FRAME_MAX_LEN];
    int n = snprintf(body, sizeof body, "%c,%u,%d", f->type, (unsigned)f->seq, f->value);
    if (n < 0 || (size_t)n >= sizeof body) {
        return 0;
    }
    int total = snprintf(buf, cap, "$%s*%02X\n", body, frame_checksum(body, (size_t)n));
    if (total < 0 || (size_t)total >= cap) {
        return 0;
    }
    return (size_t)total;
}

int frame_parse(const char *line, frame_t *out) {
    size_t n = strlen(line);
    while (n > 0 && (line[n - 1] == '\n' || line[n - 1] == '\r')) {
        n--;
    }
    if (n < 8 || line[0] != '$') {
        return FRAME_ERR_FORMAT;
    }
    const char *star = memchr(line, '*', n);
    if (star == NULL || (size_t)(line + n - star) != 3 || !isxdigit((unsigned char)star[1]) ||
        !isxdigit((unsigned char)star[2])) {
        return FRAME_ERR_FORMAT;
    }

    size_t blen = (size_t)(star - (line + 1));
    if (blen < 5 || blen >= FRAME_MAX_LEN) {
        return FRAME_ERR_FORMAT;
    }
    char body[FRAME_MAX_LEN];
    memcpy(body, line + 1, blen);
    body[blen] = '\0';

    if (!isupper((unsigned char)body[0]) || body[1] != ',') {
        return FRAME_ERR_FORMAT;
    }
    char *end;
    long seq = strtol(body + 2, &end, 10);
    if (end == body + 2 || *end != ',' || seq < 0 || seq > 65535) {
        return FRAME_ERR_FORMAT;
    }
    char *vstart = end + 1;
    long value = strtol(vstart, &end, 10);
    if (end == vstart || *end != '\0') {
        return FRAME_ERR_FORMAT;
    }

    unsigned want = (unsigned)strtoul(star + 1, NULL, 16);
    if (frame_checksum(body, blen) != want) {
        return FRAME_ERR_CHECKSUM;
    }

    out->type = body[0];
    out->seq = (uint16_t)seq;
    out->value = (int)value;
    return FRAME_OK;
}
