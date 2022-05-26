export function formatNoDecimals(value: string) {
    return value.split('.')[0]
}

/**
 * If value is `301.0` it returns `301`
 */
export function format(value: string) {
    const [integer, decimal] = value.split('.')
    if (decimal === '0') return integer
    return value
}

/**
 * Turns `100.4327437238` in `100.43` (when decimals is `2`)
 */
export function formatMaxDecimals(value: string, decimals = 2) {
    const [integer, decimal] = value.split('.')
    if (!decimal) return integer
    return `${integer}.${decimal.substring(0, decimals)}`
}
