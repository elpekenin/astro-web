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

*Any code/explanation in here may not be updated with the current state of my repo whenever you read this, bear that in mind. However, file names/location shouldn't change much and should be easy to find. Code-wise, chances are stuff is added without removing (**but perhaps moving**) the functionality explained here.*

If you are reading this, you probably know already, but just in case: The code can be found at the `pekelop` branch of my fork [here](https://github.com/elpekenin/qmk_firmware/tree/pekelop/users/elpekenin)

Code using these features can be found at the userspace itself, my [custom keyboard](https://github.com/elpekenin/qmk_firmware/tree/pekelop/keyboards/elpekenin/access) and my [keymap](https://github.com/elpekenin/qmk_firmware/tree/pekelop/keyboards/elpekenin/access/keymaps/elpekenin) for it

---

# Index

# Quantum Painter
## 🚧 Auto-include assets
TODO: Move to a scripts outside of CLI and document it

## Drawing, and some helpers: `graphics.h`
### Macros
`load_display`, `load_font` and `load_image` which:
  1. Load the assets into RAM, using QP's API
  1. Save them on arrays (`qp_devices_pekenin` - avoid name collision with `qp_internal.c`, `qp_fonts`, `qp_images`), as a common place to find everything
  1. Print (if QP_DEBUG is enabled) the name of the asset being loaded.

     Eg: "*Loading ili9163 at position [0]*"

### Scrolling text API ✨
Using `defer_exec` to draw moving strings, similar to `qp_animate`. 

🔴Uses `malloc`, `realloc` and `free`🔴 to keep a copy of the string, because original text could be dropped while this is running.

**<u>Note</u>:** The state (`scrolling_text_state_t`) contains the amount of spaces to draw before repeating the string, this is currently not exposed and gets a hardcoded value on the function's body.

  - Create a new scrolling text with `draw_scrolling_text` (or its `_recolor`) counterpart
    - Similar to `qp_drawtext` but also takes the amount of chars to be drawn each step and the delay between them.
    - Returns a token that identifies this task and is used by the rest of the API

  - Extend an existing task's text (mainly meant for drawing long strings this over XAP): `extend_scrolling_text`
  - `stop_scrolling_text` to cancel a running task

### Small drawing functions
There are some smaller functions here:
  - Small code to compute days, hours, minutes, seconds from `timer_read32` and drawing them on a screen
  - `draw_commit` does what its name says, based on `version.h`. PR'ed this on [#19542](https://github.com/qmk/qmk_firmware/pull/19542)
  - `draw_features` iterates over [`enabled_features_t`](#user_featuresh) to draw its contents. Both of these functions will show latest information when called from slave side (without needing a reflash) using [data sync](#user_transactionsh)

## `print` on your screens: `qp_logging.h`
Again, based on @tzarc's work, this replaces the built-in function called by `print` under the hood to render each `char`. On this tweaked version, we maintain the default send-over-USB behaviour, but also keep track of it on a buffer to later draw on a display. Extended his work by allowing a bigger text size and drawing it with my `scrolling` API.

The actual drawing takes place on `graphics.c`, this file simply keeps track of the text.

Usage:
  - Nothing to be enabled
  - Define `LOG_N_LINES` and `LOG_N_CHARS`, or fallback to my default values
  - Use `qp_log_target_device = <your_device>` to determine where the drawing is done

## QGF-converted database (and scripts)
If you want some pre-converted QGF images, I have a collection of Material Design Icons (and the scripts to generate them from folders) in [this repo](https://github.com/elpekenin/mdi-icons-qgf)

---

# XAP
## Draw from the PC: `qp_over_xap.h`
XAP bindings that expose display-related functions over XAP.

Messages' definition can be found at `xap.hjson`

Usage:
 - Will automatically get added if you have both XAP and Quantum Painter enabled
 - You can disable it, even if both features are enabled, by adding `QP_XAP = no`
 - Selecting a display, font or image relies on having the assets loaded, as explained on [Quantum Painter - Macros](#macros)
 - Send messages over XAP, [my fork of qmk_xap](https://github.com/elpekenin/qmk_xap)

## Send info to the PC: `user_xap.h`
Helper functions to send information about some events to the XAP client, such as reboot/bootload, keys being pressed or released (could make some usage stats), or [touch screen](#touch_driverh)'s state.

---

# Codegen
Generate **C** code from **Python** `/scripts` that get run during compilation.

## `user_features.h`
Defines `enabled_features_t` which is a struct that contains whether some features where enabled on this compilation or not.

Usage:
  - You can tweak its behaviour at the very top of `features.py`
    - Add or remove elements from `FEATURES` to modify which of them are checked by the script 
    - Use `SHORT_NAMES` to define aliases (these are only used on the `draw_features` function, not on the `struct`'s attributes names)
  - The script is always run and its outputs `SRC +=`ed, nothing to configure
  - Call `get_enabled_features`
  - Read state with `features.rgb_matrix` or whichever feature you are interested in (all attributes are `lower_snake_case`)

---

# Touchscreens: `touch_driver.h`
Custom code to interact with my XPT2046-based touchscreen modules, the code is designed such that other SPI sensors should be somewhat easy to integrate. 

This code does the bare minimum, **reads the sensor**.

Feel free to elaborate on that information: compute movements (even integrate on pointing device), detect gestures from those movements, etc. This is left as an exercise for the reader.

Usage:
  - Add `TOUCH_SCREEN = yes` to your **rules.mk**
  - Configure a `touch_driver_t` according to your sensor
  - Initialize it with `touch_spi_init`
  - Read with `get_spi_touch_report`
  <!-- - TODO: Document calibration process (?) -->

---

# Multi-bus SPI: `custom_spi_master.h`
"Small" changes to QMK's built-in SPI driver (abstractions over `ChibiOS`'s functions), so that we can use multiple SPI instances at the same time.

---

# "Virtual pins" to control several signals: `sipo_pins.h`
A set of macros and functions that allow using SerialIn-ParallelOut shift registers (supports daisy chaining) to control several "virtual GPIO". With this, you can generate an arbitrary amount of output signals using 3 GPIOs on the MCU (SCK, MOSI, CS).

My use-case for this is driving a multi-screen setup with fewer pins. This requires:
- [custom_spi_master](#custom_spi_masterh): one bus is used for the displays and the second one for the registers. This way, we can change CS/DC signals while talking to the display without messing communications up due to sending data on that bus.
- Patches to `qp_comms_spi.c` (or manually creating a new vtable with tons of duplication), to use the multi-bus driver instead of QMK's built-in `spi_master.h`. This code uses "tradicional" names, like `SPI_SCK_PIN`, for the screens, while the register ones prepend `REGISTER_` to them. Then arrays are created combining the two, where position(id) 0 belongs to screens and 1 to registers.

Usage:
  - Add `SIPO_PINS = yes` to your **rules.mk**
  - Configure the amount of pins you'll use `#define N_SIPO_PINS <N_Pins>`
  - Create your "pin" name(s) with the macro: `configure_sipo_pins(<NAME1>, <NAME2>, ...)`
  - Change a pin's state by doing:
    - Manually set state: `set_sipo_pin(<pin_name>, true)` or `set_sipo_pin(<pin_name>, false)`
    - Aliases: `sipo_pin_high(<pin_name>)` or `sipo_pin_low(<pin_name>)`
  - Send the status to the registers: `write_sipo_state`

---

# Split messaging: `user_transactions.h`
This file has:
  - `transactions_init` configures the function that will trigger upon receiving the custom message on slave side
  - `split_sync_housekeeping`, gets called from `housekeeping_task_user` to send this message periodically
  - `user_data_sync_keymap_callback`, gets called when a message is received


<!-- # One Hand Mode (**abandoned right now**)
The goal for this feature is to add a new *RGB Matrix* animation which only lights a single LED, used as a "marker" so that you can then virtually press the selected key. This will allow for accessibility, because the direction in which the LED moves and the trigger of the press is completely customizable (code does just the bare minimum), thus you can change which events trigger moving around and pressing, eg using different pointing devices, or a set of keys(arrows).

Usage:
 - Add `ONE_HAND = yes` to your **rules.mk** -->