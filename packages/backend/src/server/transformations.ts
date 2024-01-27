export function decodeArray(data: string, separator = "/"): string[] {
    return data.split(separator).filter((x) => x);
}
