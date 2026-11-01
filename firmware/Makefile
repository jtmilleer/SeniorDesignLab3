# Host build for the pure C logic. The ESP32 build uses ESP-IDF (idf.py).
CC     ?= cc
CFLAGS ?= -std=c99 -Wall -Wextra -Wpedantic -g
INC     = -Icomponents/frame/include

.PHONY: test clean

test: test/test_frame
	./test/test_frame

test/test_frame: test/test_frame.c components/frame/frame.c components/frame/include/frame.h
	$(CC) $(CFLAGS) $(INC) -o $@ test/test_frame.c components/frame/frame.c

clean:
	rm -f test/test_frame
