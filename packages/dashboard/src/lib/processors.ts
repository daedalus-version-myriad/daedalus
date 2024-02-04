export function removeIndex<T>(array: T[], index: number) {
    return [...array.slice(0, index), ...array.slice(index + 1)];
}

export function clone<T>(array: T[], index: number) {
    return [...array.slice(0, index), structuredClone(array[index]), ...array.slice(index)];
}

export function swap<T>(array: T[], x: number, y: number) {
    if (x === y) return array;
    if (x > y) return swap(array, y, x);

    return [...array.slice(0, x), array[y], ...array.slice(x + 1, y), array[x], ...array.slice(y + 1)];
}

export function applyIndex<T>(array: T[], i: number, fn: (t: T) => T) {
    return [...array.slice(0, i), fn(array[i]), ...array.slice(i + 1)];
}
