export function className<T>(props: { [key in keyof T]?: boolean }) {
    return Object.keys(props)
        .filter((key) => props[key as keyof T])
        .join(' ')
}
