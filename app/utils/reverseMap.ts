export function reverseMap<T, R>(array: T[], callbackfn: (item: T) => R) {
    return array.map((_item, i, array) =>
        callbackfn(array[array.length - i - 1]),
    )
}
