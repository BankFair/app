export function inFrame() {
    if (typeof window !== 'object') return false
    if (window !== window.parent) return true
    return false
}
