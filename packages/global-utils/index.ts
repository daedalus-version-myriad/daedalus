export enum DurationStyle {
    Blank,
    For,
    Until,
}

const formatTimescales: [string, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
];

export function formatDuration(duration: number, style = DurationStyle.For): string {
    if (duration === Infinity) return "indefinitely";

    duration = Math.round(duration / 1000);

    if (duration < 0) {
        const core = _formatDuration(-duration);
        if (style === DurationStyle.Blank) return `negative ${core}`;
        if (style === DurationStyle.For) return `for negative ${core}`;
        if (style === DurationStyle.Until) return `until ${core} ago`;
    }

    if (duration === 0) {
        if (style === DurationStyle.Blank) return "no time";
        if (style === DurationStyle.For) return "for no time";
        if (style === DurationStyle.Until) return "until right now";
    }

    const core = _formatDuration(duration);
    if (style === DurationStyle.Blank) return core;
    if (style === DurationStyle.For) return `for ${core}`;
    if (style === DurationStyle.Until) return `until ${core} from now`;

    return "??";
}

function _formatDuration(duration: number): string {
    if (duration === Infinity) return "indefinitely";

    const parts: string[] = [];

    for (const [name, scale] of formatTimescales) {
        if (duration >= scale) {
            const amount = Math.floor(duration / scale);
            duration %= scale;

            parts.push(`${amount} ${name}${amount === 1 ? "" : "s"}`);
        }
    }

    return parts.join(" ");
}

const parseTimescales = [
    [1, 604800000],
    [3, 86400000],
    [5, 3600000],
    [8, 60000],
    [11, 1000],
];

export function parseDuration(string: string, allow_infinity = true) {
    if (string === "forever" || string === "-") {
        if (allow_infinity) return Infinity;
        else throw "Enter a non-infinite time.";
    }

    const match = string.match(/^(\d+\s*w(eeks?)?\s*)?(\d+\s*d(ays?)?\s*)?(\d+\s*h((ou)?rs?)?\s*)?(\d+\s*m(in(ute)?s?)?\s*)?(\d+\s*s(ec(ond)?s?)?\s*)?$/);

    if (!match) throw "Invalid format for date (e.g. 20h, 3 days 12 hours, forever).";

    let duration = 0;

    for (const [index, scale] of parseTimescales) {
        const submatch = match[index]?.match(/\d+/);
        if (submatch) duration += parseInt(submatch[0]) * scale;
    }

    return duration;
}

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
