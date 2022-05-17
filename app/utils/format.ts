export function formatFloor(value: string) {
    return value.split('.')[0]
}

export function format(value: string) {
    const [integer, decimal] = value.split('.')
    if (decimal === '0') return integer
    return value
}
