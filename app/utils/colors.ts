export interface Color {
    r: number
    g: number
    b: number
}
export const rgb = (color: Color) => `rgb(${color.r},${color.g},${color.b})`
export const rgba = (color: Color, opacity: number) =>
    `rgba(${color.r},${color.g},${color.b},${opacity})`

export const COLOR_WHITE: Color = { r: 255, g: 255, b: 255 }
export const COLOR_BLUE_LIGHTER: Color = { r: 208, g: 242, b: 255 }
export const COLOR_BLUE_LIGHT: Color = { r: 116, g: 202, b: 255 }
export const COLOR_BLUE: Color = { r: 24, g: 144, b: 255 }
export const COLOR_BLUE_DARK: Color = { r: 12, g: 83, b: 183 }
export const COLOR_BLUE_DARKER: Color = { r: 4, g: 41, b: 122 }
export const COLOR_GREEN_LIGHTER: Color = { r: 200, g: 250, b: 205 }
export const COLOR_GREEN_LIGHT: Color = { r: 91, g: 229, b: 132 }
export const COLOR_GREEN: Color = { r: 0, g: 171, b: 85 }
export const COLOR_GREEN_DARK: Color = { r: 0, g: 123, b: 85 }
export const COLOR_GREEN_DARKER: Color = { r: 0, g: 82, b: 73 }
export const COLOR_RED_LIGHTER: Color = { r: 255, g: 231, b: 217 }
export const COLOR_RED_LIGHT: Color = { r: 255, g: 164, b: 141 }
export const COLOR_RED: Color = { r: 255, g: 72, b: 66 }
export const COLOR_RED_DARK: Color = { r: 183, g: 33, b: 54 }
export const COLOR_RED_DARKER: Color = { r: 122, g: 12, b: 46 }
export const COLOR_YELLOW_LIGHTER: Color = { r: 255, g: 247, b: 205 }
export const COLOR_YELLOW_LIGHT: Color = { r: 255, g: 225, b: 106 }
export const COLOR_YELLOW: Color = { r: 255, g: 193, b: 7 }
export const COLOR_YELLOW_DARK: Color = { r: 183, g: 129, b: 3 }
export const COLOR_YELLOW_DARKER: Color = { r: 122, g: 79, b: 1 }
export const COLOR_GREY_500: Color = { r: 145, g: 158, b: 171 }
export const COLOR_GREY_600: Color = { r: 99, g: 115, b: 129 }
export const COLOR_GREY_800: Color = { r: 33, g: 43, b: 54 }
export const COLOR_GREY_900: Color = { r: 22, g: 28, b: 36 }

export const rgbWhite = rgb(COLOR_WHITE)
export const rgbBlueLighter = rgb(COLOR_BLUE_LIGHTER)
export const rgbBlueLight = rgb(COLOR_BLUE_LIGHT)
export const rgbBlue = rgb(COLOR_BLUE)
export const rgbBlueDark = rgb(COLOR_BLUE_DARK)
export const rgbBlueDarker = rgb(COLOR_BLUE_DARKER)
export const rgbGreenLighter = rgb(COLOR_GREEN_LIGHTER)
export const rgbGreenLight = rgb(COLOR_GREEN_LIGHT)
export const rgbGreen = rgb(COLOR_GREEN)
export const rgbGreenDark = rgb(COLOR_GREEN_DARK)
export const rgbGreenDarker = rgb(COLOR_GREEN_DARKER)
export const rgbRedLighter = rgb(COLOR_RED_LIGHTER)
export const rgbRedLight = rgb(COLOR_RED_LIGHT)
export const rgbRed = rgb(COLOR_RED)
export const rgbRedDark = rgb(COLOR_RED_DARK)
export const rgbRedDarker = rgb(COLOR_RED_DARKER)
export const rgbYellowLighter = rgb(COLOR_YELLOW_LIGHTER)
export const rgbYellowLight = rgb(COLOR_YELLOW_LIGHT)
export const rgbYellow = rgb(COLOR_YELLOW)
export const rgbYellowDark = rgb(COLOR_YELLOW_DARK)
export const rgbYellowDarker = rgb(COLOR_YELLOW_DARKER)
export const rgbGrey500 = rgb(COLOR_GREY_500)
export const rgbGrey600 = rgb(COLOR_GREY_600)
export const rgbGrey800 = rgb(COLOR_GREY_800)
export const rgbGrey900 = rgb(COLOR_GREY_900)

export const COLOR_DISABLED: Color = COLOR_GREY_500
export const disabledContentOpaque = rgba(COLOR_DISABLED, 0.8)
export const disabledContent = rgba(COLOR_DISABLED, 0.8)
export const input = rgba(COLOR_DISABLED, 0.12)

// #region Text
export const COLOR_TEXT_PRIMARY_DARK: Color = COLOR_GREY_800
export const rgbTextPrimaryLight = rgbGrey800
export const rgbTextPrimaryDark = rgbWhite
// #endregion
