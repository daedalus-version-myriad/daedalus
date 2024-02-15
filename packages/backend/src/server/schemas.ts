import { z } from "zod";

export const snowflake = z.string().regex(/^[1-9][0-9]{16,19}$/, "Discord IDs must be 17-20 digit numbers.");

const fieldData = z.object({
    name: z.string(),
    value: z.string(),
    inline: z.boolean(),
});

const embedData = z.object({
    colorMode: z.enum(["guild", "member", "user", "fixed"]),
    color: z.number().int("Colors must be integers.").min(0, "Colors must not be negative.").max(0xffffff, "Colors must not exceed #FFFFFF."),
    author: z.object({ name: z.string(), iconURL: z.string(), url: z.string() }),
    title: z.string(),
    description: z.string(),
    url: z.string(),
    fields: fieldData.array().max(25, "Only up to 25 fields per embed are allowed."),
    image: z.object({ url: z.string() }),
    thumbnail: z.object({ url: z.string() }),
    footer: z.object({ text: z.string(), iconURL: z.string() }),
    showTimestamp: z.boolean(),
});

export const baseMessageData = z.object({
    content: z.string(),
    embeds: embedData.array().max(10, "Only up to 10 embeds per message are allowed."),
});

export const giveawayBase = z.object({
    channel: snowflake.nullable(),
    message: baseMessageData,
    requiredRoles: snowflake.array(),
    requiredRolesAll: z.boolean(),
    blockedRoles: snowflake.array(),
    blockedRolesAll: z.boolean(),
    bypassRoles: snowflake.array(),
    bypassRolesAll: z.boolean(),
    stackWeights: z.boolean(),
    weights: z.object({ role: snowflake.nullable(), weight: z.number().int().min(1) }).array(),
    winners: z.number().int().min(1),
    allowRepeatWinners: z.boolean(),
});
