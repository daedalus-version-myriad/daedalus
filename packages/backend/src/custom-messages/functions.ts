import type { Guild, GuildMember, Role, User } from "discord.js";

export type CustomMessageContext = { member?: GuildMember | null; user?: User | null; role?: Role | null; guild?: Guild | null };
export type Value = string | number | Value[];
export type FN = { arity: number | [number, number]; apply: (ctx: CustomMessageContext, ...args: Value[]) => Value; fetch?: string[] };

function raise(error: string): Value {
    throw error;
}

const functions: Record<"member" | "user" | "role" | "guild" | "global", Record<string, FN>> = {
    member: {
        avatar: { arity: 0, apply: (ctx) => ctx.member!.displayAvatarURL() },
        nickname: { arity: 0, apply: (ctx) => ctx.member!.displayName },
        "booster?": { arity: 0, apply: (ctx) => (ctx.member!.premiumSince ? 1 : 0) },
    },
    user: {
        mention: { arity: 0, apply: (ctx) => ctx.user!.toString() },
        "display-name": { arity: 0, apply: (ctx) => ctx.user!.displayName },
        username: { arity: 0, apply: (ctx) => ctx.user!.username },
        tag: { arity: 0, apply: (ctx) => ctx.user!.tag },
        discriminator: { arity: 0, apply: (ctx) => ctx.user!.discriminator },
        banner: { arity: 0, apply: (ctx) => ctx.user!.bannerURL() ?? "" },
        "bot?": { arity: 0, apply: (ctx) => (ctx.user!.bot ? 1 : 0) },
        "user-avatar": { arity: 0, apply: (ctx) => ctx.user!.displayAvatarURL() },
    },
    role: {
        "role-icon": { arity: 0, apply: (ctx) => ctx.role!.iconURL() ?? "" },
        "role-members": { arity: 0, apply: (ctx) => ctx.role!.members.size },
        "role-name": { arity: 0, apply: (ctx) => ctx.role!.name },
        "hoist?": { arity: 0, apply: (ctx) => (ctx.role!.hoist ? 1 : 0) },
    },
    guild: {
        server: { arity: 0, apply: (ctx) => ctx.guild!.name },
        members: { arity: 0, apply: (ctx) => ctx.guild!.members.cache.size, fetch: ["members"] },
        boosts: { arity: 0, apply: (ctx) => ctx.guild!.premiumSubscriptionCount ?? 0 },
        tier: { arity: 0, apply: (ctx) => ctx.guild!.premiumTier },
        "server-icon": { arity: 0, apply: (ctx) => ctx.guild!.iconURL() ?? "" },
        "server-banner": { arity: 0, apply: (ctx) => ctx.guild!.bannerURL() ?? "" },
        "server-splash": { arity: 0, apply: (ctx) => ctx.guild!.splashURL() ?? "" },
        bots: { arity: 0, apply: (ctx) => ctx.guild!.members.cache.filter((x) => x.user.bot).size, fetch: ["members"] },
        humans: { arity: 0, apply: (ctx) => ctx.guild!.members.cache.filter((x) => !x.user.bot).size, fetch: ["members"] },
        boosters: { arity: 0, apply: (ctx) => ctx.guild!.members.cache.filter((x) => x.premiumSince).size, fetch: ["members"] },
    },
    global: {
        "?": { arity: [2, 3], apply: (_, x, y, z) => (x ? y : z ?? "") },
        "!=": {
            arity: [2, Infinity],
            apply(_, ...args) {
                for (let i = 0; i < args.length - 1; i++) for (let j = i + 1; j < args.length; j++) if (args[i] === args[j]) return 0;
                return 1;
            },
        },
        random: { arity: [1, Infinity], apply: (_, ...args) => args[Math.floor(Math.random() * args.length)] },
        list: { arity: [0, Infinity], apply: (_, ...args) => args },
        "!": { arity: 1, apply: (_, x) => (x ? 0 : 1) },
        length: { arity: 1, apply: (_, x) => (Array.isArray(x) ? x.length : raise("`{length x}` can only be used on a list.")) },
        ordinal: {
            arity: 1,
            apply(_, x) {
                if (typeof x !== "number") throw "`{ordinal #}` can only be used on a number.";
                if (!Number.isInteger(x)) throw "`{ordinal #}` can only be used on an integer.";

                const n = Math.abs(x);

                if (n === 0 || (n > 10 && n < 20)) return `${x}th`;
                if (n % 10 === 1) return `${x}st`;
                if (n % 10 === 2) return `${x}nd`;
                if (n % 10 === 3) return `${x}rd`;
                return `${x}th`;
            },
        },
        join: { arity: 2, apply: (_, x, y) => [x].flat().join(`${y}`) },
        "+": { arity: [1, Infinity], apply: (_, ...x) => x.map((k) => +k).reduce((x, y) => x + y) },
        "-": { arity: [1, Infinity], apply: (_, ...x) => x.map((k) => +k).reduce((x, y) => x - y) },
        "*": { arity: [1, Infinity], apply: (_, ...x) => x.map((k) => +k).reduce((x, y) => x * y) },
        "/": { arity: [1, Infinity], apply: (_, ...x) => x.map((k) => +k).reduce((x, y) => x / y) },
        "\\": { arity: [1, Infinity], apply: (_, ...x) => x.map((k) => +k).reduce((x, y) => Math.floor(x / y)) },
        "#": {
            arity: [1, Infinity],
            apply: (_, ...x) =>
                x.length === 1
                    ? Array.isArray(x[0])
                        ? x[0].length
                        : raise("`{# x}` can only be used on a list.")
                    : x
                          .slice(1)
                          .map((k) => +k)
                          .reduce((x, y) => (Array.isArray(x) ? x[y] : raise("`{# x ...}` can only be used so long as all indexed elements are lists.")), x[0]),
        },
        "%": { arity: [1, Infinity], apply: (_, ...x) => x.map((k) => +k).reduce((x, y) => x % y) },
        "^": { arity: [1, Infinity], apply: (_, ...x) => x.map((k) => +k).reduce((x, y) => x ** y) },
        "&&": { arity: [1, Infinity], apply: (_, ...x) => x.reduce((x, y) => x && y) },
        "||": { arity: [1, Infinity], apply: (_, ...x) => x.reduce((x, y) => x || y) },
        "++": { arity: [1, Infinity], apply: (_, ...x) => x.map((k) => (Array.isArray(k) ? k : [k])).flat() },
        "=": { arity: [1, Infinity], apply: (_, ...x) => (new Set(x.map((k) => JSON.stringify(k))).size === 1 ? 1 : 0) },
        ">": { arity: [1, Infinity], apply: (_, ...x) => (x.map((k, i) => i === x.length - 1 || +k > +x[i + 1]).every((k) => k) ? 1 : 0) },
        ">=": { arity: [1, Infinity], apply: (_, ...x) => (x.map((k, i) => i === x.length - 1 || +k >= +x[i + 1]).every((k) => k) ? 1 : 0) },
        "<": { arity: [1, Infinity], apply: (_, ...x) => (x.map((k, i) => i === x.length - 1 || +k < +x[i + 1]).every((k) => k) ? 1 : 0) },
        "<=": { arity: [1, Infinity], apply: (_, ...x) => (x.map((k, i) => i === x.length - 1 || +k <= +x[i + 1]).every((k) => k) ? 1 : 0) },
    },
};

export default functions;

export const flatFMap = Object.fromEntries(Object.values(functions).flatMap((x) => Object.entries(x)));
