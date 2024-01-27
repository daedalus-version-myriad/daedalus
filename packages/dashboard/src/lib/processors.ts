export function isUnequal<T extends object>(current: T, original: T, fields: (keyof T)[]) {
    return fields.some((field) => JSON.stringify(current[field]) !== JSON.stringify(original[field]));
}
