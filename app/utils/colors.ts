export interface Color {
    r: number
    g: number
    b: number
}
export const rgb = (color: Color) => `rgb(${color.r},${color.g},${color.b})`
export const opacity = (color: Color, opacity: number) =>
    `rgba(${color.r},${color.g},${color.b},${opacity})`

export const COLOR_BLUE: Color = {
    r: 24,
    g: 144,
    b: 255,
}
export const rgbBlue = rgb(COLOR_BLUE)

export const COLOR_GREEN: Color = {
    r: 0,
    g: 171,
    b: 85,
}
export const rgbGreen = rgb(COLOR_GREEN)

export const COLOR_RED: Color = {
    r: 255,
    g: 72,
    b: 66,
}
export const rgbRed = rgb(COLOR_RED)
