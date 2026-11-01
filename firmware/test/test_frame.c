// Host-side unit tests for the frame code. Run with: make -C firmware test
// The example frames are the same ones used in shared/src/frame.test.ts.
#include <assert.h>
#include <stdio.h>
#include <string.h>

#include "frame.h"

static int checks = 0;
#define CHECK(cond) do { checks++; assert(cond); } while (0)

static void test_checksum(void) {
    CHECK(frame_checksum("B,17,1", 6) == 0x75);
}

static void test_encode_example(void) {
    char buf[FRAME_MAX_LEN + 8];
    frame_t f = { .type = 'B', .seq = 17, .value = 1 };
    size_t n = frame_encode(buf, sizeof buf, &f);
    CHECK(n == strlen("$B,17,1*75\n"));
    CHECK(strcmp(buf, "$B,17,1*75\n") == 0);
}

static void test_encode_buffer_too_small(void) {
    char buf[4];
    frame_t f = { .type = 'B', .seq = 17, .value = 1 };
    CHECK(frame_encode(buf, sizeof buf, &f) == 0);
}

static void test_parse_example(void) {
    frame_t f;
    CHECK(frame_parse("$B,17,1*75\n", &f) == FRAME_OK);
    CHECK(f.type == 'B' && f.seq == 17 && f.value == 1);
}

static void test_parse_crlf(void) {
    frame_t f;
    CHECK(frame_parse("$B,17,1*75\r\n", &f) == FRAME_OK);
}

static void test_parse_bad_checksum(void) {
    frame_t f;
    CHECK(frame_parse("$B,17,1*00\n", &f) == FRAME_ERR_CHECKSUM);
}

static void test_parse_garbage(void) {
    frame_t f;
    CHECK(frame_parse("hello", &f) == FRAME_ERR_FORMAT);
    CHECK(frame_parse("", &f) == FRAME_ERR_FORMAT);
    CHECK(frame_parse("$B,17*75\n", &f) == FRAME_ERR_FORMAT);
    CHECK(frame_parse("$B,17,1*7\n", &f) == FRAME_ERR_FORMAT);
}

static void test_round_trip(void) {
    const char types[] = { 'B', 'L', 'A' };
    for (size_t i = 0; i < sizeof types; i++) {
        frame_t in = { .type = types[i], .seq = 65535, .value = 0 };
        frame_t out;
        char buf[FRAME_MAX_LEN + 8];
        CHECK(frame_encode(buf, sizeof buf, &in) > 0);
        CHECK(frame_parse(buf, &out) == FRAME_OK);
        CHECK(out.type == in.type && out.seq == in.seq && out.value == in.value);
    }
}

int main(void) {
    test_checksum();
    test_encode_example();
    test_encode_buffer_too_small();
    test_parse_example();
    test_parse_crlf();
    test_parse_bad_checksum();
    test_parse_garbage();
    test_round_trip();
    printf("all %d checks passed\n", checks);
    return 0;
}
