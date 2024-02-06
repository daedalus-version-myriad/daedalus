export function fuzzy(string: string, query: string) {
    if (!query) return true;

    query = query.toLowerCase();
    string = string.toLowerCase();

    let index = 0;

    for (const char of string) {
        if (char === query.charAt(index)) index++;
        if (index >= query.length) return true;
    }

    return false;
}
