import { z } from "zod";

export const snowflake = z.string().regex(/^[1-9][0-9]{16,19}$/);

const fieldData = z.object({
    name: z.string(),
    value: z.string(),
    inline: z.boolean(),
});

const embedData = z.object({
    colorMode: z.enum(["guild", "member", "user", "fixed"]),
    color: z.number().int().min(0).max(0xffffff),
    author: z.object({ name: z.string(), iconURL: z.string(), url: z.string() }),
    title: z.string(),
    description: z.string(),
    url: z.string(),
    fields: fieldData.array().max(25),
    image: z.object({ url: z.string() }),
    thumbnail: z.object({ url: z.string() }),
    footer: z.object({ text: z.string(), iconURL: z.string() }),
    showTimestamp: z.boolean(),
});

export const baseMessageData = z.object({
    content: z.string(),
    embeds: embedData.array().max(10),
});
