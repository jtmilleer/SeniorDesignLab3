// MorseKey starter firmware (ESP-IDF).
//
//   BOOT button edge  ->  "$B,<seq>,1|0*cc"  to the computer
//   "$L,<seq>,1|0*cc" from the computer  ->  LED on / off, then "$A,..." back
//
// NOT compiled or tested in CI and not yet run on a board: treat it as a
// reference sketch. Check the pin numbers against your board.
// The frame code (components/frame) IS tested on a laptop: make -C firmware test

#include <string.h>

#include "driver/gpio.h"
#include "driver/uart.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/task.h"

#include "frame.h"

#define BUTTON_GPIO GPIO_NUM_0  // BOOT button, active low. Do not hold it during reset.
#define LED_GPIO    GPIO_NUM_2  // Onboard LED on many dev boards: check yours.
#define UART_PORT   UART_NUM_0  // The USB serial port on most dev boards.
#define BAUD_RATE   115200
#define RX_BUF_SIZE 256

static QueueHandle_t button_queue;

// TODO(student): tx_seq is incremented from two tasks (button_task and
// uart_task) with no protection. Make that safe.
static uint16_t tx_seq;

static void send_frame(char type, int value) {
    frame_t f = { .type = type, .seq = tx_seq++, .value = value };
    char buf[FRAME_MAX_LEN + 8];
    size_t n = frame_encode(buf, sizeof buf, &f);
    if (n > 0) {
        uart_write_bytes(UART_PORT, buf, n);
    }
}

// Interrupt: only record the pin level and wake the task. Keep it short.
static void IRAM_ATTR button_isr(void *arg) {
    (void)arg;
    int level = gpio_get_level(BUTTON_GPIO);
    BaseType_t woken = pdFALSE;
    xQueueSendFromISR(button_queue, &level, &woken);
    if (woken) {
        portYIELD_FROM_ISR();
    }
}

static void button_task(void *arg) {
    (void)arg;
    int level;
    for (;;) {
        if (xQueueReceive(button_queue, &level, portMAX_DELAY) == pdTRUE) {
            // TODO(student): debounce before reporting the edge.
            send_frame('B', level == 0 ? 1 : 0);  // active low: 0 = pressed
        }
    }
}

static void handle_line(const char *line) {
    frame_t f;
    if (frame_parse(line, &f) != FRAME_OK) {
        return;  // boot messages and garbage end up here: ignore them
    }
    if (f.type == 'L') {
        gpio_set_level(LED_GPIO, f.value ? 1 : 0);
        send_frame('A', f.seq);  // acknowledge: value = sequence number received
    }
    // TODO(student): decide what the board does with frame types it does not know.
}

static void uart_task(void *arg) {
    (void)arg;
    char line[FRAME_MAX_LEN + 8];
    size_t len = 0;
    uint8_t byte;
    for (;;) {
        if (uart_read_bytes(UART_PORT, &byte, 1, portMAX_DELAY) == 1) {
            if (byte == '\n') {
                line[len] = '\0';
                handle_line(line);
                len = 0;
            } else if (len < sizeof line - 1) {
                line[len++] = (char)byte;
            } else {
                len = 0;  // line too long: start over
            }
        }
    }
}

void app_main(void) {
    esp_log_level_set("*", ESP_LOG_NONE);

    gpio_config_t led = {
        .pin_bit_mask = 1ULL << LED_GPIO,
        .mode = GPIO_MODE_OUTPUT,
    };
    gpio_config(&led);
    gpio_set_level(LED_GPIO, 0);

    gpio_config_t button = {
        .pin_bit_mask = 1ULL << BUTTON_GPIO,
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = GPIO_PULLUP_ENABLE,
        .intr_type = GPIO_INTR_ANYEDGE,
    };
    gpio_config(&button);

    const uart_config_t uart = {
        .baud_rate = BAUD_RATE,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_DEFAULT,
    };
    uart_param_config(UART_PORT, &uart);
    uart_driver_install(UART_PORT, RX_BUF_SIZE * 2, 0, 0, NULL, 0);

    button_queue = xQueueCreate(8, sizeof(int));
    xTaskCreate(button_task, "button", 2048, NULL, 5, NULL);
    xTaskCreate(uart_task, "uart", 3072, NULL, 5, NULL);

    gpio_install_isr_service(0);
    gpio_isr_handler_add(BUTTON_GPIO, button_isr, NULL);
}
