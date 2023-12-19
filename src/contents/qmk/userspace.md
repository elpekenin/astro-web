---
datetime: 2023-06-05T15:00:00Z
title: "Userspace documentation #QMK"
featured: true
tags:
- qmk
ogImage: ""
---

---
# ⚠️ NOTE ⚠️

*Bear in mind, any code/explanation here may not be up to date with the current state of my repo when reading this. However, filenames and locations shouldn't change much and should remain easy to find. New functionality will be added but may not be documented, things explained below (most likely) won't be removed but chances are they get moved around, though.*

If you are reading this, you probably know already, but code using these features can be found on my [keyboard](https://github.com/elpekenin/access_kb) repository.
  * Under the `firmware` folder
  * See `build.json` to see how the compilation of my code is setup (`src` contains the source for my custom build-tool)
    * The compilation works using a custom tool of mine: [qmk_build](https://github.com/elpekenin/qmk_build)
  * Code can be found at `users/elpekenin` (very minimal stuff on `keyboards/elpekenin/access/keymaps/elpekenin`)
    * Actual code on `src`, and headers under `include`. Both these folders have a (imo) very intuitive layout, so it should be easy navitagin through them
    * Makefiles on `mk` (check `rules.mk` to see the overall build process)
    * Python code to code-gen some C at compile time at `scripts`
    * `painter` contains some assets(fonts, images) to be used on screens

## *Last update: 19-Dec-2023*
---

# Index

# Custom logging (`elpekenin/logging.h`)
Made a "framework" inspired by Python's `logging` module

It defines several message levels:
  * `LOG_NONE`
  * `LOG_TRACE`
  * `LOG_DEBUG`
  * `LOG_INFO`
  * `LOG_WARN`
  * `LOG_ERROR`

And features to be logged:
  * `UNKNOWN` - fallback for anything not listed underneath
  * `LOGGER`
  * `QP`
  * `SCROLL_TXT`
  * `SIPO`
  * `SPLIT`
  * `SPI`
  * `TOUCH`
  * `HASH`

Such that messages can be logged with:
```c
void logging(feature_t feature, log_level_t level, const char *msg, ...);
```

Furthermore, every message is logged with a custom format (which you can change at runtime). The available specifiers are:
  * `%F` - Name of the feature that raised the message, eg: `SPLIT`
  * `%LL` - Message's level (long), eg: `TRACE`
  * `%LS` - Message's level (short), eg: `T`
  * `%M` - Actual message (will be formatted from `msg` and `...`, as you would expect from `printf`)
  * `%T` - Current time (`char *log_time(void);` is implemented weakly)

For example, a format of `"[%F] (%LL) -- %M | %T"` would yield messages like:
```
[SPLIT] (TRACE) -- Hello world | 3s
```

You can get/set the current level for each feature, eg: to enable/silence certain messages after something goes right/wrong.

---

All of this machinery is just a fancy wrapper to call `printf` under the hood.

`printf` itself is also hacked, such that its "backend"(how each `char` is printed) does:
  * IF QP is enabled, draw text on a [screen](#logging-on-screen-loggingbackendsqph)
  * If XAP is enabled, send logging over it. [XAP's Log specification](https://github.com/qmk/qmk_firmware/blob/xap/docs/xap_0.3.0.md#log-message---0x00)
  * When `printf` is called from the slave half of a split keyboard, it gets send to master (to be able to see it thru USB) over custom communication
  * Keeps the implementation provided by QMK (`sendchar`) which will either be a no-op or console's endpoint

# Utils
Various functions that may be useful to reuse across different files. The most relevant stuff here are a couple of string-manipulation functions and a fairly limited hash-map implementation

# Quantum Painter, QP for short (`elpekenin/painter/`)
You may want to read the feature's [documentation](https://docs.qmk.fm/#/quantum_painter) first

## Drawing, and some helpers (`elpekenin/painter/graphics.h`)
### All assets available dynamically
See [here](#2-auto-include-assets-qp_resourcesh)

### Programmatic access to resources (instead of variables)
  * Loading (`load_display`, `load_font` and `load_image`) will:
    * Get fonts/images into RAM, using QP's API (`qp_load_*_mem`)
    * Log the name of and index the asset being loaded.
      <div style="padding-left:30px" /> Eg: "Loading ili9163 at position [0]"
  * You can later get these resources with
    * `qp_get_<resource>_by_index`
    * `qp_get_<resource>_by_name`
      * Note: Names are stringifications of variable names, you might use "private" loading API instead (`_load_<resource>`)
    * There's also `qp_get_num_<resouces>` in case it might be needed in the future

### Scrolling text API ✨ (`elpekenin/painter/graphics.c`)
<span style="margin-right: 30%"></span>🔴Uses `malloc`, `realloc` and `free`🔴

Using `defer_exec` to draw moving strings, similar to `qp_animate`. 

**<u>Note</u>:** The state (`scrolling_text_state_t`) contains the amount of spaces to draw before repeating the string, this is currently not part of the API and gets a hardcoded value on the function's body.

  * Create a new scrolling text
  ```c
  // API is very similar to qp_drawtext[_recolor] but also takes the amount of chars to write each time, and delay between steps

  deferred_token draw_scrolling_text(painter_device_t device, uint16_t x, uint16_t y, painter_font_handle_t font, const char *str, uint8_t n_chars, uint32_t delay);

  deferred_token draw_scrolling_text_recolor(painter_device_t device, uint16_t x, uint16_t y, painter_font_handle_t font, const char *str, uint8_t n_chars, uint32_t delay, uint8_t hue_fg, uint8_t sat_fg, uint8_t val_fg, uint8_t hue_bg, uint8_t sat_bg, uint8_t val_bg);
  ``` 
  * Make a task's text longer (mainly meant for drawing long strings over XAP):
  ```c
  void extend_scrolling_text(deferred_token scrolling_token, const char *str);
  ```
  * Cancel a running task
  ```c
  void stop_scrolling_text(deferred_token scrolling_token);
  ```

### Small drawing functions (`elpekenin/painter/graphics.c`)
There are some other functionalities here:
  - Small code to compute days, hours, minutes, seconds from `timer_read32` and drawing them on a screen (not broken into a function)
  - This function does what its name suggests, based on [#19542](https://github.com/qmk/qmk_firmware/pull/19542)
  ```c
  void draw_commit(painter_device_t device);
  ```
  - This one iterates over [`enabled_features_t`](#user_featuresh) to draw its contents. Its body is generated by [features.py](#enabled-features-featurespy)
  ```c
  void draw_features(painter_device_t device);
  ```
  
These last two functions will show latest information on slave side (without reflashing it) thanks to [data sync](#user_transactionsh) 
   
Output:
  
  ![](/content-images/qmk/features_draw.png)

## Logging on screen (`logging/backends/qp.h`)
Inspired on @tzarc's work, this extends the function called by `print` to render each `char` with a custom implementation.

We keep track of logging messages on a buffer to then draw them on a display. I extended @tzarc's functionality by allowing longer lines to be stored and drawing them (when needed) with my [`scrolling texts API`](#scrolling-text-api-✨)

A task on `elpekenin.c` takes care to periodically call the `render` function in order to re-draw when needed.

Usage:
  1. Configure the buffer size (or don't, and fallback to my default values)
  ```c
  #define LOG_N_LINES <Number>
  #define LOG_N_CHARS <Number>
  ```
  1. Determine the screen where to draw
  ```c
  set_qp_logging_device(display);
  ```
  

## QGF-converted database (and scripts)
If you want some pre-converted QGF images, I have a collection of Material Design Icons (and the scripts to mass-convert folders) in [this repo](https://github.com/elpekenin/mdi-icons-qgf)

---

# XAP

In case you haven't heard of it, this is a Work In Progress feature aimed for bidirectional communication between your keyboard and PC, you can track it on [PR#13733](https://github.com/qmk/qmk_firmware/pull/13733), and its documentation can be found on that same branch (`xap`) of the repo, under the `docs` folder.

## Draw from the PC (`elpekenin/painter/xap.c`)
XAP bindings that expose display-related functions over XAP.

Messages' definition can be found at `xap.hjson`

Usage:
  1. Will automatically get added if you have both XAP and Quantum Painter enabled
  2. You can disable it, even if both features are enabled
  ```makefile
  # rules.mk
  # --------
  QP_XAP = no
  ```
  3. Code relies on having the assets in the arrays mentioned on [Quantum Painter - Macros](#macros)
  4. Send XAP messages from PC to execute this code. [Here](https://github.com/elpekenin/qmk_xap) is my fork of [qmk_xap](https://github.com/qmk/qmk_xap) (which is official QMK's XAP client)

## Send info to the PC (`elpekenin/xap.h`)
Helper functions to send information about some events to the XAP client, such as:
  * Rebooting the board or jumping to bootloader
  * Key events (presses/released) which could be used to make usage stats
  * [Touch screen](#touch_driverh) state

---

# Codegen (`scripts/`)
Generate **C** code from **Python** scripts that get run during compilation.

Some of these features are not configured via `rules.mk`, thus can't easily be disabled (you'd need to tweak the Makefile yourself).

## 1. Enabled features: `scripts/features.py`
Defines `enabled_features_t` which is a struct containing whether some features are enabled on this compilation or not.

Usage:
  1. Tweak its configuration (if you want to) at the very top of the script
    * Add or remove elements from `FEATURES` to modify which of them are tracked
    * Use `SHORT_NAMES` to define aliases. Note: These are only used on the `draw_features` function, not on the `struct`'s attributes names
  2. Read the state
  ```c
  enabled_features_t get_enabled_features(void);
  ```
  3. Check a particular feature. Note: all names are `lower_snake_case`.
  ```c
  if (features.rgb_matrix) {
      printf("RGB Matrix is enabled!\n");
  }
  ```

## 2. Auto-include assets: `scripts/qp_resources.py`
Creates:
  * `generated_qp_resources.h`, header that `#include`'s all QGF/QFF files found, and gets `#include`'d by `graphics.h`
  * `generated_qp_resouces.c`, defines `load_qp_resources` which calls `load_font` and `load_image` [macros](#macros) on every asset found
  * `generated_qp_resources.mk` which has the `SRC +=` lines for them

Usage: Code will locate your files at `painter/fonts` and `painter/images` on the keyboard, keymap, and userspace folders. No need to configure anything

## 3. Keycode names: `scripts/keycode_str.py`
⚠️ Does not currently support `.json` keymaps

Parses your keymap file (based on `KEYMAP_PATH` variable), finding the keycodes you've mapped on your layers, providing:
```c
const char *get_keycode_str_at(uint8_t layer, uint8_t row, uint8_t col)
``` 
Which will return `"KC_A"` for the positon where you had `KC_A` and so on. I.e. stringification of the keymap contents.

---

# Touchscreens (`elpekenin/touch.h`)
Custom code to interact with my XPT2046-based touchscreen modules, the code is designed such that other SPI sensors should be somewhat easy to integrate. 

This code does the bare minimum, **reads the sensor**.

Feel free to elaborate on that information: compute movements (even integrate on pointing device), detect gestures from those movements, etc. This is left as an exercise for the reader.

Usage:
  1. Enable it
  ```makefile
  # rules.mk
  # --------
  TOUCH_SCREEN = yes
  ```
  2. Configure a `touch_driver_t` according to your sensor, mine is:
  ```c
  static const touch_driver_t ili9341_touch_driver = {
      .width = _ILI9341_WIDTH,
      .height = _ILI9341_HEIGHT,
      .scale_x = 0.07,
      .scale_y = -0.09,
      .offset_x = -26,
      .offset_y = 345,
      .rotation = (ILI9341_ROTATION + 2) % 4,
      .upside_down = false,
      .spi_config = {
          .chip_select_pin = ILI9341_TOUCH_CS_PIN,
          .divisor = TOUCH_SPI_DIV,
          .lsb_first = false,
          .mode = TOUCH_SPI_MODE,
          .irq_pin = NO_PIN,
          .x_cmd = 0xD0,
          .y_cmd = 0x90
      },
  };
  touch_device_t ili9341_touch = &ili9341_touch_driver;
  ```
  3. Initialize it
  ```c
  touch_spi_init(ili9341_touch);
  ```
  4. Read
  ```c
  touch_report_t ili9341_touch_report = get_spi_touch_report(ili9341_touch, false);
  ```

  ### Note
   `scale` and `offset` values are used to calibrate the display. Reading does some mats for both coords
  ```c
  coord = (scale * raw_reading) + offset;
  ```
  With these arguments you should be able to map whichever range of values the raw data is, to: `(0, 0) - (width, height)`

  There is no code or explanation on how to do this, I simply checked what the raw data was on each of the 4 corners, to locate the two that got read as `(small_x, small_y)` and `(big_x, big_y)` discarding `(big_x, small_y)` and `(small_x, big_y)`. With these two corners i took the average of 3-5 readings and made a lineal adjustment to scale them down to the size of my display.

---

# Multi-bus SPI (`elpekenin/spi_custom.h`)
"Small" changes to QMK's built-in SPI driver (abstractions over `ChibiOS`'s functions), so that we can use multiple SPI instances at the same time.

---

# "Virtual pins" to control several signals (`elpekenin/sipo.h`)
A set of macros and functions that allow using SerialIn-ParallelOut shift registers (supports daisy chaining) to control several "virtual GPIO". With this, you can generate an arbitrary amount of output signals using 3 GPIOs on the MCU (SCK, MOSI, CS).

My use-case for this is driving a multi-screen setup with fewer pins. This requires:
- [custom_spi_master](#custom_spi_masterh): one bus is used for the displays and the second one for the registers. This way, we can change CS/DC signals while talking to the display without messing communications up due to sending data on that bus.
- Patches to `qp_comms_spi.c` (or manually creating a new vtable with tons of duplication), to use the multi-bus driver instead of QMK's built-in `spi_master.h`. This code uses "tradicional" names, like `SPI_SCK_PIN`, for the screens, while the register ones prepend `REGISTER_` to them. Then arrays are created combining the two, where position(id) 0 belongs to screens and 1 to registers.

Usage:
  1. Enable it
  ```makefile
  # rules.mk
  # --------
  SIPO_PINS = yes
  ```
  2. Configure the amount of pins you will use, to allocate a buffer accordingly
  ```c
  #define N_SIPO_PINS <Number>
  ```
  3. Create your "pin" name(s) -- This is a macro, place it outside any function
  ```c
  configure_sipo_pins(<NAME_1>, <NAME_2>, ...);
  ```
  4. Control pin state
  ```c
  // Change status in buffer
  set_sipo_pin(<pin_name>, <value>);

  // Aliases
  sipo_buffer_high(<pin_name>);
  sipo_buffer_low(<pin_name>);

  // Flush state
  send_sipo_state();

  // Change state and flush it
  sipo_write_high(<pin_name>);
  sipo_write_low(<pin_name>); 
  ```

---

# Split messaging (`elpekenin/split/transactions.h`)
A couple of custom transactions, with a `init` function to schedule some "workers" that periodically execute them.

---

# Keylogger (`elpekenin/keylog.h`)
Inspired by @drashna's code, this provides a way of storing/showing recent presses as a string. Obviously, depends on [`get_keycode_str_at`](#3-keycode-names-keycode_strpy)

Usage:
  1. Enable it
  ```makefile
  # rules.mk
  # --------
  KEYLOG_ENABLE = yes
  ```

  2. `keylog_process` will be called for processing after a key is pressed/released. You can define some "prettifying" replacements (pointer gets redirected to another address, original isn't changed).

  3. My code will also change the log's color based on WPM(if enabled), you can tweak the colors (or completely get rid of them) and the WPM values at which they change by editing `graphics.c`. I didn't setup any `#define` for this 

Congratz!
![](/content-images/qmk/keylog.jpg)


# TODO's
  * `user_rgb_matrix_indicators` documentation
  * ? `hash_map` documentation