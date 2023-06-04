---
datetime: 2023-04-06T12:00:00Z
title: "3-color e-Ink driver documentation #QMK"
tags:
  - qmk
ogImage: ""
---

# Overview
This driver was made for an IL91874([datasheet](https://cdn-learn.adafruit.com/assets/assets/000/111/701/original/IL91874_DataSheet.pdf?1652393814)) module by Adafruit([product](https://www.adafruit.com/product/4098)). It is just a convenience wrapper around 2x 1bpp surfaces, based on @tzarc's work at [#19997](https://github.com/qmk/qmk_firmware/pull/19997). 

![](/content-images/qmk/eink.svg)

Note that a "surface" is a framebuffer within a `painter_device_t`, so that we can use the API primitives to draw on it easily, instead of manually messing with its bits.

To acommodate for different screens: 
  * Another color (eg: yellow) instead of red along with black and white
  * Different pixel format (ie: whether 1 is black or white, and the like)
 
`eink_panel_dc_reset_painter_device_t` contains `HSV color` and `uint8_t invert_mask`(details on `qp_eink_panel.h`) which are used on `palette_convert` to adjust the values.


## Why things are done this way
The reason to keep a framebuffer is that this IC has to receive the **whole** screen at one go (no partial refresh), so we need to keep a copy of it to be sent later on.

Using 2x 1bpp buffers instead of a 2bpp one is due to how data is handled, black data is sent together, and then red (haven't tested the other way around, it probably works too).

## Where **not** to use this
Screens which pack together the 2 bits for each pixel would need a 2bpp surface instead, as explained above.

If you have a screen with partial refresh, you'd be better of with a driver similar to TFT's one. It doesnt keep a framebuffer but instead streams the changes to the display directly.

For a black/white e-Ink, you should be using something closer to the OLED driver.

## Extra: Data representation
As you can see on the implementation (and it comments), to reduce RAM usabe by a factor or 4 (store 4 pixels instead of a single one on each byte), code using a masking technique where data ends up arranged:

```
     First byte     |     Second byte             Legend
B0C0 B1C1 B2C2 B3C3 | B4C4 B5C5 B6C6 B7C7         ------    
                                                     B#: #th black bit
                                                     C#: #th color bit
```

This is not really **needed**, and we could use 1 byte for pixel, however that would make drawing operations take longer as the internal buffer used by QP would only be able to hold 1/4 the amount of data.