---
datetime: 2023-04-06T17:00:00Z
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

Code using these features can be found at my [custom keyboard](https://github.com/elpekenin/qmk_firmware/tree/pekelop/keyboards/elpekenin/access) and my [keymap](https://github.com/elpekenin/qmk_firmware/tree/pekelop/keyboards/elpekenin/access/keymaps/elpekenin) for it

## Quantum Painter
### Auto-include assets
TODO: Document this

### `graphics.h`
#### Macros
`load_display`, `load_font` and `load_image` which:
  - Load the assets into RAM, using QP's API
  - Save them on arrays (`qp_devices_pekenin` - avoid name collision with `qp_internal.c`, `qp_fonts`, `qp_images`), as a common place to find everything
  - Print (if QP_DEBUG is enabled) the name of the asset being loaded. Eg: *Loading ili9163 at position [0]*

#### Scrolling text API
Using `defer_exec` to draw moving strings, similar to `qp_animate`. 

🔴Uses `malloc`, `realloc` and `free`🔴 to keep a copy of the string, becase original one could "die" while this is running.

**<u>Note</u>:** The state (`scrolling_text_state_t`) contains the amount of spaces to draw before repeating the string, this is currently not exposed and gets a hardcoded value on the function's body.

  - Create a new scrolling text with `draw_scrolling_text(device, x, y, font, *str, n_chars, delay)` or its `_recolor` counterpart
    
    As you can see, this is pretty similar to `qp_drawtext` but also takes the amount of chars to be drawn and delay between moving one step to the left. It returns a token that identifies this task <p>

  - Extend an existing task's text (mainly meant for drawing long strings this over XAP): `extend_scrolling_text(token, *new_str)`
  - Stop a text with `stop_scrolling_text(token)`

#### Other functions
There are some smaller functions here:
  - Small code to compute days, hours, minutes, seconds from `timer_read32` and drawing them on a screen
  - `draw_commit` does what its name says, based on `version.h`. PR'ed this on [#19542](https://github.com/qmk/qmk_firmware/pull/19542)
  - `draw_features` iterates over [`enabled_features_t`](#user_featuresh) to draw its contents. Both of this functions will show laters information when called from slave side (without needing a reflash) using [data sync](#user_transactionsh)

### `qp_logging.h`
Again, based on @tzarc's work, this replaces the built-in function called by `print` under the hood to render each `char`. On this tweaked version, we maintain the default send-over-USB behaviour, but also keep track of it on a buffer to later draw on a display. Extended his work by allowing a bigger text size and drawing it with my `scrolling` API.

The actual drawing takes place on `graphics.c`, this file simply keeps track of the text.

Usage:
  - Nothing to be enabled
  - Define `LOG_N_LINES` and `LOG_N_CHARS`, or fallback to my default values
  - Use `qp_log_target_device = <your_device>` to determine where the drawing is done

### Images
If you want some pre-converted QGF images, I have a collection of Material Design Icons (and the scripts to generate them from folders) in [this repo](https://github.com/elpekenin/mdi-icons-qgf)

<hr style="height:3px;background-color:#FFFFFF;" />

## XAP
### `qp_over_xap.h`
XAP bindings that expose display-related functions over XAP.

Messages' definition can be found at `xap.hjson`

Usage:
 - Will automatically get added if you have both XAP and Quantum Painter enabled
 - You can disable it, even if both features are enabled, by adding `QP_XAP = no`
 - Selecting a display, font or image relies on having the assets loaded, as explained on [Quantum Painter - Macros](#macros)
 - Send messages over XAP, [my fork of qmk_xap](https://github.com/elpekenin/qmk_xap)

### `user_xap.h`
Helper functions to send information about some events to the XAP client, such as reboot/bootload, keys being pressed or released (could make some usage stats), or [touch screen](#touch_driverh)'s state.

<hr style="height:3px;background-color:#FFFFFF;" />

## `user_features.h`
Defines `enabled_features_t get_enabled_features(void)`, whose return value is a union which contains whether some features where enabled on this compilation or not 

Usage:
  - Always `SRC +=`ed, nothing to be enabled
  - Call the function
  - Read states with `features.xap` or whichever you are interested in

<hr style="height:3px;background-color:#FFFFFF;" />

## `touch_driver.h`
Custom code to interact with my XPT2046-based touchscreen modules, the code is designed such that other SPI sensors should be somewhat easy to integrate. In a similar philosophy to the [one-hand mode](#one-hand-mode-abandoned-right-now), this code does the bare minimum: **read the sensor**, what to do based on it... up to your imagination.

Usage:
  - Add `TOUCH_SCREEN = yes` to your **rules.mk**
  - Configure a `touch_driver_t` according to your sensor
  - Initialize it with `touch_spi_init`
  - Read with `get_spi_touch_report`

<hr style="height:3px;background-color:#FFFFFF;" />

## `custom_spi_master.h`
This has a drawback however, we need a dedicated SPI driver because we have to change pins(CS/DC) controlling the screens while a data transmision is going, so updating those outputs requires sending data to the register(s) via SPI, which would also be received by the screens in an un-desirable way.
Thus, I've made some patches to both `qp_comms_spi.c` and created a `custom_spi_master.h` to get things working.

<hr style="height:3px;background-color:#FFFFFF;" />

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
  - Send the status to the registers: `write_sipo_state`

<hr style="height:3px;background-color:#FFFFFF;" />

## `user_transactions.h`
Custom messaging over split comms, contains:
  - `transactions_init` configures the function that will trigger upon receiving the custom message on slave side
  - `split_sync_housekeeping`, gets called from `housekeeping_task_user` to send this message periodically
  - `user_data_sync_keymap_callback`, gets called when a message is received


<hr style="height:3px;background-color:#FFFFFF;" />

## One Hand Mode (**abandoned right now**)
The goal for this feature is to add a new *RGB Matrix* animation which only lights a single LED, used as a "marker" so that you can then virtually press the selected key. This will allow for accessibility, because the direction in which the LED moves and the trigger of the press is completely customizable (code does just the bare minimum), thus you can change which events trigger moving around and pressing, eg using different pointing devices, or a set of keys(arrows).

Usage:
 - Add `ONE_HAND = yes` to your **rules.mk**