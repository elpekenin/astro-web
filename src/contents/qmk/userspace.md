---
datetime: 2023-04-06T12:00:00Z
title: "Userspace documentation #QMK"
tags:
  - qmk
ogImage: ""
---


# WORK IN PROGRESS !!

---
# ⚠️ NOTE ⚠️

*Any code/explanation in here may not be updated with the current state of my repo whenever you read this, bear that in mind. However, file names/location shouldn't change much and should be easy to find. Code-wise, chances are stuff is added without removing (**but perhaps moving**) the functionality explained here.*

---

## Index

## GitHub repository
If you are reading this, you probably come from there, but just in case: The code can be found at the `pekelop` branch of my fork [here](https://github.com/elpekenin/qmk_firmware/tree/pekelop/users/elpekenin)

Examples for all if these features can be found at my [custom keyboard](https://github.com/elpekenin/qmk_firmware/tree/pekelop/keyboards/elpekenin/access) and my [keymap](https://github.com/elpekenin/qmk_firmware/tree/pekelop/keyboards/elpekenin/access/keymaps/elpekenin) for it

## One Hand Mode (**WIP**)
The goal for this feature is to add a new *RGB Matrix* animation which only lights a single LED, used as a "marker" so that you can then virtually press the selected key. This will allow for accessibility, because the direction in which the LED moves and the trigger of the press is completely customizable (code does just the bare minimum), thus you can change which events trigger moving around and pressing, eg using different pointing devices, or a set of keys(arrows).

Config:
 - Add `ONE_HAND = yes` to your **rules.mk**

## Quantum Painter over XAP
XAP bindings that expose Quantum Painter's drawing and `get_geometry` functions.

Config:
 - Will automatically get added if you have both XAP and Quantum Painter enabled
 - You can disable it when both features are enabled by adding `QP_XAP = no`
 - Selecting a display, font or image relies on doing `load_display(device_handle)` for every screen, load and fonts are added to an array when loaded in `graphics.c`

If you want some QGF images, I have a collection of converted Material Design Icons (and scripts to generate them from folders) in [this repo](https://github.com/elpekenin/mdi-icons-qgf)

## Touch screen driver
Custom code to interact with my XPT2046-based touchscreen modules, the code is designed such that other SPI sensors should be somewhat easy to integrate. In a similar philosophy to the one-hand mode, this code does the bare minimum: **read the sensor**, what to do based on it... up to your imagination.

Config:
  - Add `TOUCH_SCREEN = yes` to your **rules.mk**

## `custom_spi_master.h`
This has a drawback however, we need a dedicated SPI driver because we have to change pins(CS/DC) controlling the screens while a data transmision is going, so updating those outputs requires sending data to the register(s) via SPI, which would also be received by the screens in an un-desirable way.
Thus, I've made some patches to both `qp_comms_spi.c` and created a `custom_spi_master.h` to get things working.


## `sipo_pins.h`
A set of macros and functions that allow using SerialIn-ParallelOut shift registers (supports daisy chaining) to control several "virtual GPIO". With this, you can generate an arbitrary amount of output signals using 3 GPIOs on the MCU (SCK, MOSI, CS).

My use-case for this is driving a multi-SPI-screen setup with fewer pins. This requires:
- [custom_spi_master](#custom_spi_masterh): one bus is used for the displays and the second one for the registers. This way, we can change CS/DC signals while talking to the display without messing communications up due to sending data on that bus.
- Patches to `qp_comms_spi.c` (or manually creating a new vtable with tons of duplication), to use the multi-bus driver instead of QMK's built-in `spi_master.h`. This code uses "tradicional" names, like `SPI_SCK_PIN`, for the screens, while the register ones prepend `REGISTER_` to them. Then arrays are created combining the two, where position(id) 0 belongs to screens and 1 to registers.

Usage:
  - Add `SIPO_PINS = yes` to your **rules.mk**
  - Configure the amount of pins you'll use `#define N_SIPO_PINS <N_Pins>`
  - Create your "pin" name(s) with the macro: `configure_sipo_pins(<NAME1>, <NAME2>, ...)`
  - Change a pin's state by doing:
    - Manually set state: `set_sipo_pin(<pin_name>, true)` or `set_sipo_pin(<pin_name>, false)`
    - Aliases: `sipo_pin_high(<pin_name>)` or `sipo_pin_low(<pin_name>)`
  - Send the status to the registers: `write_sipo_state()`

## `user_features.h`
Defines `enabled_features_t get_enabled_features(void)`, whose return value is a union which contains whether some features where enabled on this compilation or not 

Usage:
  - Always `SRC +=`ed, don't have to enable it
  - Call the function
  - Read states with `features.xap` or whichever you are interested in

## Quantum Painter
### Auto-include assets
TODO: Document this

### `graphics.h`
This file contains several stuff:
  - Macros (`load_display`, `load_font` and `load_image`) which:
    - Load the assets into RAM, using QP's API
    - Save them on arrays (`qp_devices_pekenin` - avoid name collision with `qp_internal.c`, `qp_fonts`, `qp_images`), as a common place to find everything
    - Print (if QP_DEBUG is enabled) the name of the asset being loaded. Eg: *"Loading ili9163 at position [0]"*
  - Scrolling text API. `defer_exec` to draw moving strings
    - Create a new scrolling text with `draw_scrolling_text(device, x, y, font, *str, n_chars, delay)` or the `_recolor` counterpart. As you can see, this is pretty similar to `qp_drawtext` but also takes the amount of chars to be drawn and delay between moving one step to the left. The state (`scrolling_text_state_t`) contains another value which is the amount of spaces to draw before repeating the string, this is currently not exposed and gets a hardcoded value on the function's body.**Uses `malloc`** to keep a copy of the string, as the original may "die" while this is running
    - Extend an existing text's content (mainly meant for accessing this over XAP, as message size is limited): `extend_scrolling_text(token, *new_str)`. It takes the token which identifies the scrolling and the string to be appended. **Uses `realloc`**
    - Stop a text with `stop_scrolling_text(token)`. **Uses `free`**

### Images
If you want some pre-converted QGF images, I have a collection of Material Design Icons (and the scripts to generate them from folders) in [this repo](https://github.com/elpekenin/mdi-icons-qgf)
