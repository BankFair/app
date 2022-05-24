export function formatNoDecimals(value: string) {
    return value.split('.')[0]
}

export function format(value: string) {
    const [integer, decimal] = value.split('.')
    if (decimal === '0') return integer
    return value
}

export function formatMaxDecimals(value: string, decimals = 2) {
    const [integer, decimal] = value.split('.')
    return `${integer}.${decimal.substring(0, decimals).padEnd(decimals, '0')}`
}
