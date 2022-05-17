export interface Color {
    r: number
    g: number
    b: number
}
export const rgb = (color: Color) => `rgb(${color.r},${color.g},${color.b})`
export const rgba = (color: Color, opacity: number) =>
    `rgba(${color.r},${color.g},${color.b},${opacity})`

export const COLOR_BLUE: Color = { r: 24, g: 144, b: 255 }
export const rgbBlue = rgb(COLOR_BLUE)

export const COLOR_GREEN: Color = { r: 0, g: 171, b: 85 }
export const rgbGreen = rgb(COLOR_GREEN)

export const COLOR_RED: Color = { r: 255, g: 72, b: 66 }
export const rgbRed = rgb(COLOR_RED)

export const COLOR_DISABLED: Color = { r: 145, g: 158, b: 171 }
export const disabledBackground = rgba(COLOR_DISABLED, 0.24)
export const disabledContentOpaque = rgba(COLOR_DISABLED, 0.8)
export const disabledContent = rgba(COLOR_DISABLED, 0.8)
export const shadow = rgba(COLOR_DISABLED, 0.16)
export const input = rgba(COLOR_DISABLED, 0.12)

// #region Text
const COLOR_TEXT_PRIMARY: Color = { r: 33, g: 43, b: 54 }
export const COLOR_TEXT_SECONDARY: Color = { r: 99, g: 115, b: 129 }
export const rgbTextPrimary = rgb(COLOR_TEXT_PRIMARY)
export const rgbTextSecondary = rgb(COLOR_TEXT_SECONDARY)
export const rgbTextDisabled = rgb(COLOR_TEXT_SECONDARY)
// #endregion
