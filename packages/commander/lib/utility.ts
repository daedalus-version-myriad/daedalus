import { trpc } from "../../api/index.js";
import { getColor, timeinfo } from "../../bot-utils/index.js";
import { secrets } from "../../config/index.js";
import {
    ChannelType,
    ChatInputCommandInteraction,
    Guild,
    GuildMember,
    Role,
    User,
    type APIEmbed,
    type APIRole,
    type BaseMessageOptions,
    type CategoryChildChannel,
    type GuildBasedChannel,
} from "discord.js";

export type Unit = {
    id: string;
    name: string[];
    dimension: string;
    scale: number;
    offset?: number;
};

export const units = [
    { id: "Meters", name: ["m", "meter", "metre", "meters", "metres"], dimension: "length", scale: 1 },
    {
        id: "Millimeters",
        name: ["mm", "millimeter", "millimetre", "millimeters", "millimetres"],
        dimension: "length",
        scale: 0.001,
    },
    {
        id: "Centimeters",
        name: ["cm", "centimeter", "centimetre", "centimeters", "centimetres"],
        dimension: "length",
        scale: 0.01,
    },
    {
        id: "Decimeters",
        name: ["dm", "decimeter", "decimetre", "decimeters", "decimetres"],
        dimension: "length",
        scale: 0.1,
    },
    {
        id: "Kilometers",
        name: ["km", "kilometer", "kilometre", "kilometers", "kilometres"],
        dimension: "length",
        scale: 1000,
    },
    { id: "Inches", name: ["in", "inch", "inches"], dimension: "length", scale: 0.0254 },
    { id: "Links", name: ["link", "links"], dimension: "length", scale: 0.201168 },
    { id: "Feet", name: ["ft", "foot", "feet"], dimension: "length", scale: 0.3048 },
    { id: "Yards", name: ["yd", "yard", "yards"], dimension: "length", scale: 0.9144 },
    {
        id: "Rods",
        name: ["rod", "rods", "perch", "perches", "pole", "poles", "lug", "lugs"],
        dimension: "length",
        scale: 5.0292,
    },
    { id: "Chains", name: ["chain", "chains"], dimension: "length", scale: 20.1168 },
    { id: "Furlongs", name: ["furlong", "furlongs"], dimension: "length", scale: 201.168 },
    { id: "Miles", name: ["mi", "mile", "miles"], dimension: "length", scale: 1609.344 },
    { id: "Nautical Miles", name: ["sm", "nautical-mile", "nautical-miles"], dimension: "length", scale: 1852 },
    {
        id: "Astronomical Units",
        name: ["ae", "au", "astronomical-unit", "astronomical-units"],
        dimension: "length",
        scale: 149597870700,
    },
    {
        id: "Light Years",
        name: ["lj", "ly", "light-year", "light-years"],
        dimension: "length",
        scale: 9460700000000000,
    },
    { id: "Parsecs", name: ["pc", "parsec", "parsecs"], dimension: "length", scale: 30857000000000000 },
    {
        id: "Square Meters",
        name: ["sqm", "m2", "square-meter", "square-meters", "square-metre", "square-metres"],
        dimension: "area",
        scale: 1,
    },
    { id: "Ares", name: ["a", "are", "ares"], dimension: "area", scale: 100 },
    { id: "Acres", name: ["acre", "acres"], dimension: "area", scale: 4046.873 },
    { id: "Hectares", name: ["ha", "hectare", "hectares"], dimension: "area", scale: 10000 },
    {
        id: "Square Inches",
        name: ["sqin", "in2", "square-inch", "square-inches"],
        dimension: "area",
        scale: 0.00064516,
    },
    { id: "Square Feet", name: ["sqft", "ft2", "square-foot", "square-feet"], dimension: "area", scale: 0.093 },
    {
        id: "Square Yards",
        name: ["sqyd", "yd2", "square-yard", "square-yards"],
        dimension: "area",
        scale: 0.836,
    },
    {
        id: "Square Miles",
        name: ["sqmi", "mi2", "square-mile", "square-miles"],
        dimension: "area",
        scale: 2590000,
    },
    {
        id: "Cubic Meters",
        name: ["cbm", "m3", "cubic-meter", "cubic-meters", "cubic-metre", "cubic-metres"],
        dimension: "volume",
        scale: 1,
    },
    { id: "Liters", name: ["l", "liter", "liters", "litre", "litres"], dimension: "volume", scale: 0.001 },
    {
        id: "Milliliters",
        name: ["ml", "milliliter", "milliliters", "millilitre", "millilitres"],
        dimension: "volume",
        scale: 0.000001,
    },
    {
        id: "Centiliters",
        name: ["cl", "centiliter", "centiliters", "centilitre", "centilitres"],
        dimension: "volume",
        scale: 0.00001,
    },
    {
        id: "Deciliters",
        name: ["dl", "deciliter", "deciliters", "decilitre", "decilitres"],
        dimension: "volume",
        scale: 0.0001,
    },
    {
        id: "Hectoliters",
        name: ["hl", "hectoliter", "hectoliters", "hectolitre", "hectolitres"],
        dimension: "volume",
        scale: 0.1,
    },
    {
        id: "Cubic Inches",
        name: ["cuin", "cbin", "in3", "cubic-inch", "cubic-inches"],
        dimension: "volume",
        scale: 0.000016387,
    },
    {
        id: "Cubic Feet",
        name: ["cuft", "cbft", "ft3", "cubic-foot", "cubic-feet"],
        dimension: "volume",
        scale: 0.028316736,
    },
    {
        id: "Cubic Yards",
        name: ["cuyd", "cbyd", "yd3", "cubic-yard", "cubic-yards"],
        dimension: "volume",
        scale: 0.764551872,
    },
    { id: "Acre-Feet", name: ["acre-ft", "acre-foot", "acre-feet"], dimension: "volume", scale: 1233.4868904 },
    { id: "Teaspoons", name: ["tsp", "teaspoon", "teaspoons"], dimension: "volume", scale: 0.000005 },
    { id: "Tablespoons", name: ["tbsp", "tablespoon", "tablespoons"], dimension: "volume", scale: 0.000015 },
    {
        id: "U.S. Fluid Ounces",
        name: ["floz", "ozfl", "fluid-ounce", "fluid-ounces"],
        dimension: "volume",
        scale: 0.0000295735296,
    },
    { id: "U.S. Cups", name: ["cup", "cups"], dimension: "volume", scale: 0.00023659 },
    { id: "U.S. Liquid Gills", name: ["gill", "gills"], dimension: "volume", scale: 0.000118295 },
    { id: "U.S. Liquid Pints", name: ["p", "pt", "pint", "pints"], dimension: "volume", scale: 0.00047318 },
    { id: "U.S. Liquid Quarts", name: ["qt", "quart", "quarts"], dimension: "volume", scale: 0.00094636 },
    { id: "U.S. Liquid Gallons", name: ["gal", "gallon", "gallons"], dimension: "volume", scale: 0.00189272 },
    { id: "Radians", name: ["rad", "radian", "radians"], dimension: "angle", scale: 57.29577951308232 },
    { id: "Degrees", name: ["deg", "degree", "degrees"], dimension: "angle", scale: 1 },
    {
        id: "Arcminutes",
        name: ["arcmin", "arcminute", "arcminutes"],
        dimension: "angle",
        scale: 0.016666666666666666,
    },
    {
        id: "Arcseconds",
        name: ["arcsec", "arcsecond", "arcseconds"],
        dimension: "angle",
        scale: 0.0002777777777777778,
    },
    { id: "Gradians", name: ["grad", "gradian", "gradians"], dimension: "angle", scale: 0.9 },
    { id: "Turns", name: ["turn", "turns"], dimension: "angle", scale: 360 },
    { id: "Hour Angles", name: ["hour-angle", "hour-angles"], dimension: "angle", scale: 15 },
    { id: "Compass Points", name: ["compass-point", "compass-points"], dimension: "angle", scale: 11.25 },
    {
        id: "Milliradians",
        name: ["millirad", "milliradian", "milliradians"],
        dimension: "angle",
        scale: 0.05729577951308232,
    },
    {
        id: "Binary Degrees",
        name: ["bindeg", "binary-degree", "binary-degrees"],
        dimension: "angle",
        scale: 1.40625,
    },
    { id: "Seconds", name: ["s", "sec", "second", "secs", "seconds"], dimension: "time", scale: 1 },
    { id: "Minutes", name: ["min", "mins", "minute", "minutes"], dimension: "time", scale: 60 },
    { id: "Hours", name: ["h", "hr", "hour", "hrs", "hours"], dimension: "time", scale: 3600 },
    { id: "Days", name: ["d", "day", "days"], dimension: "time", scale: 86400 },
    { id: "Weeks", name: ["wk", "wks", "week", "weeks"], dimension: "time", scale: 604800 },
    { id: "Years", name: ["y", "yr", "year", "yrs", "years"], dimension: "time", scale: 31557600 },
    { id: "Milliseconds", name: ["ms", "millisecond", "milliseconds"], dimension: "time", scale: 0.001 },
    {
        id: "Kilometers per Hour",
        name: ["kph", "km/h", "kilometer-per-hour", "kilometre-per-hour", "kilometers-per-hour", "kilometres-per-hour"],
        dimension: "speed",
        scale: 16.666666666666668,
    },
    {
        id: "Miles per Hour",
        name: ["mph", "mile-per-hour", "miles-per-hour"],
        dimension: "speed",
        scale: 0.536448,
    },
    {
        id: "Meters per Second",
        name: ["mps", "m/s", "meter-per-second", "meters-per-second", "metre-per-second", "metres-per-second"],
        dimension: "speed",
        scale: 1,
    },
    {
        id: "Feet per Second",
        name: ["ftps", "ft/s", "foot-per-second", "feet-per-second"],
        dimension: "speed",
        scale: 0.3048,
    },
    {
        id: "Nautical Miles per Hour (Knots)",
        name: ["knot", "knots", "nautical-mile-per-hour", "nautical-miles-per-hour"],
        dimension: "speed",
        scale: 0.5144444444444445,
    },
    { id: "Kilograms", name: ["kg", "kilogram", "kilograms"], dimension: "mass", scale: 1000 },
    { id: "Grams", name: ["g", "gram", "grams"], dimension: "mass", scale: 1 },
    { id: "Grains", name: ["gr", "grain", "grains"], dimension: "mass", scale: 0.06479891 },
    { id: "Drams", name: ["dr", "dram", "drams"], dimension: "mass", scale: 1.7718451953125 },
    { id: "Ounces", name: ["oz", "ounce", "ounces"], dimension: "mass", scale: 28.349523125 },
    { id: "Pounds", name: ["lb", "lbs", "pound", "pounds"], dimension: "mass", scale: 453.59237 },
    {
        id: "Hundredweights",
        name: ["cwt", "hundredweight", "hundredweights"],
        dimension: "mass",
        scale: 45359.237,
    },
    {
        id: "Imperial Tons",
        name: ["ton", "tons", "imperial-ton", "imperial-tons"],
        dimension: "mass",
        scale: 907184.74,
    },
    {
        id: "Metric Tonnes",
        name: ["tonne", "tonnes", "metric-ton", "metric-tonne", "metric-tons", "metric-tonnes"],
        dimension: "mass",
        scale: 1000000,
    },
    { id: "Pascals", name: ["pa", "pascal", "pascals"], dimension: "pressure", scale: 1 },
    { id: "Bars", name: ["bar", "bars"], dimension: "pressure", scale: 100000 },
    {
        id: "Pounds per Square Inch (PSI)",
        name: ["psi", "pound-per-square-inch", "pounds-per-square-inch"],
        dimension: "pressure",
        scale: 6894.8,
    },
    { id: "Kelvin", name: ["k", "kelvin"], dimension: "temperature", scale: 1 },
    { id: "Celsius", name: ["c", "celsius"], dimension: "temperature", scale: 1, offset: 273.15 },
    {
        id: "Fahrenheit",
        name: ["f", "fahrenheit"],
        dimension: "temperature",
        scale: 0.5555555555555556,
        offset: 459.67,
    },
    { id: "Rankine", name: ["r", "rankine"], dimension: "temperature", scale: 0.5555555555555556 },
] satisfies Unit[];

const map: Record<string, Unit> = Object.fromEntries(units.flatMap((x) => x.name.map((name) => [name.toUpperCase(), x])));

let currencies: Record<string, number> = {};

async function load() {
    currencies = await trpc.getCurrencies.query();
    if (Object.keys(currencies).length === 0) await refresh();
}

load();

async function refresh() {
    const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=${secrets.CURRENCY_API_KEY}`);
    if (!response.ok) return console.error("error loading currencies", await response.text());

    currencies = Object.fromEntries(Object.entries(((await response.json()) as any).data).map(([k, v]: any) => [k, v.value]));
    await trpc.setCurrencies.mutate(currencies);
}

setTimeout(
    () => {
        refresh();
        setInterval(refresh, 86400000);
    },
    86400000 - (Date.now() % 86400000),
);

export async function convert(guild: Guild | null, amount: number, source: string, target: string): Promise<BaseMessageOptions> {
    if (source in map && target in map) {
        const src = map[source];
        const dst = map[target];

        if (src.dimension !== dst.dimension)
            throw `Dimension Mismatch: \`${src.id}\` is a unit of ${src.dimension} but \`${dst.id}\` is a unit of ${dst.dimension}.`;

        return {
            embeds: [
                {
                    title: "**Conversion Result**",
                    color: guild ? await getColor(guild) : 0x009688,
                    fields: [
                        {
                            name: src.id,
                            value: `${Math.round(amount * 10000) / 10000}`,
                            inline: true,
                        },
                        {
                            name: dst.id,
                            value: `${Math.round((((amount + (src.offset ?? 0)) * src.scale) / dst.scale - (dst.offset ?? 0)) * 10000) / 10000}`,
                            inline: true,
                        },
                    ],
                    footer: { text: `units of ${src.dimension}` },
                },
            ],
        };
    }

    if (source in currencies && target in currencies) {
        return {
            embeds: [
                {
                    title: "**Currency Conversion**",
                    color: guild ? await getColor(guild) : 0x009688,
                    fields: [
                        {
                            name: source,
                            value: `${Math.round(amount * 100) / 100}`,
                            inline: true,
                        },
                        {
                            name: target,
                            value: `${Math.round((amount / currencies[source]) * currencies[target] * 100) / 100}`,
                            inline: true,
                        },
                    ],
                    footer: { text: "The conversion rates are only updated daily, so they may not be completely accurate." },
                },
            ],
        };
    }

    throw `Either \`${source}\` or \`${target}\` was not recognized. Please ensure both are common units of the same dimension or both are currencies.`;
}

export function channelBreakdown(channels: any) {
    let count = 0,
        text = 0,
        voice = 0,
        category = 0,
        news = 0,
        stage = 0,
        thread = 0,
        forum = 0;

    (Array.isArray(channels) ? channels : channels.cache).forEach((channel: CategoryChildChannel | GuildBasedChannel) => {
        count++;
        if (!channel) return;

        switch (channel.type) {
            case ChannelType.GuildText:
                text++;
                break;
            case ChannelType.GuildVoice:
                voice++;
                break;
            case ChannelType.GuildCategory:
                category++;
                break;
            case ChannelType.GuildAnnouncement:
                news++;
                break;
            case ChannelType.AnnouncementThread:
            case ChannelType.PublicThread:
            case ChannelType.PrivateThread:
                thread++;
                break;
            case ChannelType.GuildForum:
                forum++;
                break;
            case ChannelType.GuildStageVoice:
                stage++;
                break;
        }
    });

    return `${count} (${[
        text ? `${text} text` : [],
        voice ? `${voice} voice` : [],
        category ? `${category} categor${category === 1 ? "y" : "ies"}` : [],
        news ? `${news} news` : [],
        stage ? `${stage} stage` : [],
        thread ? `${thread} thread${thread === 1 ? "" : "s"}` : [],
        forum ? `${forum} forum${forum === 1 ? "" : "s"}` : [],
    ]
        .flat()
        .join(", ")})`;
}

export async function guildInfo(guild: Guild): Promise<{ embeds: APIEmbed[] }> {
    return {
        embeds: [
            {
                title: `Guild info for ${guild.name}`,
                description: guild.description || undefined,
                color: await getColor(guild),
                image: ((url) => (url ? { url } : undefined))(guild.bannerURL({ size: 4096 })),
                footer: {
                    text: guild.name,
                    icon_url: guild.iconURL({ size: 64 }) || undefined,
                },
                thumbnail: ((url) => (url ? { url } : undefined))(guild.iconURL({ size: 256 })),
                fields: [
                    { name: "ID", value: `\`${guild.id}\`` },
                    { name: "Owner", value: `<@${guild.ownerId}>` },
                    { name: "Creation Date", value: timeinfo(guild.createdAt) },
                    {
                        name: "Channels",
                        value: channelBreakdown(
                            ((await guild.channels.fetch()).toJSON() as GuildBasedChannel[]).concat(
                                (await guild.channels.fetchActiveThreads()).threads.toJSON(),
                            ),
                        ),
                    },
                    {
                        name: "Members",
                        value: guild.memberCount.toString(),
                        inline: true,
                    },
                    ...(await (async () => {
                        let count: number;

                        try {
                            count = (await guild.invites.fetch()).size;
                        } catch {
                            return [];
                        }

                        return [{ name: "Invites", value: `${count}` }];
                    })()),
                    {
                        name: "Roles",
                        value: `${(await guild.roles.fetch()).size}`,
                        inline: true,
                    },
                    {
                        name: "Boosts",
                        value: `${guild.premiumSubscriptionCount ?? 0}`,
                        inline: true,
                    },
                    ...(guild.vanityURLCode
                        ? [
                              {
                                  name: "Vanity Code",
                                  value: (({ code, uses }) => `https://discord.gg/${code} (used ${uses} times)`)(await guild.fetchVanityData()),
                              },
                          ]
                        : []),
                ],
            },
        ],
    };
}

export async function ensureCanManageRole({
    _,
    caller,
    member: _member,
    role: _role,
}: {
    _: ChatInputCommandInteraction;
    caller: GuildMember;
    member: User;
    role: Role | APIRole;
}) {
    const member = await _.guild!.members.fetch(_member).catch(() => {
        throw "That user does not appear to be in this server.";
    });

    const role = (await _.guild!.roles.fetch(_role.id))!;

    if (_.guild!.ownerId !== caller.id && role.comparePositionTo(caller.roles.highest) >= 0)
        throw "You can only manage roles that are below your highest role.";

    if (role.comparePositionTo(caller.guild.members.me!.roles.highest) >= 0) throw "The bot cannot manage this role as it is above its highest role.";

    if (role.managed) throw "You cannot manually manage system-bound roles such as bot roles and booster roles.";

    const val = { _, member, role };

    if (_.guild!.ownerId === caller.id) return val;

    const settings = await trpc.getRoleCommandConfig.query(_.guild!.id);

    if (caller.roles.cache.hasAny(...settings.bypassRoles)) return val;

    if (settings.blockByDefault ? !settings.allowedRoles.includes(role.id) : settings.blockedRoles.includes(role.id))
        throw `This server's Daedalus settings forbid management of ${role}.`;

    return val;
}
