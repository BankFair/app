export function jsonParse<Return>(
    value: any,
    defaultValue?: Return,
): Return | null {
    try {
        return JSON.parse(value)
    } catch {
        return defaultValue || null
    }
}
