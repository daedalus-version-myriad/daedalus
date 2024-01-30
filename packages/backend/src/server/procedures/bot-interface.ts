import { logEvents } from "@daedalus/logging";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/db";
import { tables } from "../../db/index";
import { snowflake } from "../schemas";
import { proc } from "../trpc";

export default {
    getColor: proc.input(snowflake).query(async ({ input: guild }) => {
        const [entry] = await db.select({ color: tables.guildSettings.embedColor }).from(tables.guildSettings).where(eq(tables.guildSettings.guild, guild));
        return entry?.color ?? 0x009688;
    }),
    getLogLocation: proc
        .input(z.object({ guild: snowflake, channels: snowflake.array(), event: z.string() }))
        .output(z.object({ type: z.enum(["webhook", "channel"]), value: z.string() }).nullable())
        .query(async ({ input: { guild, channels, event } }) => {
            const category = logEvents[event].category;

            const [settings] = await db.select().from(tables.guildLoggingSettings).where(eq(tables.guildLoggingSettings.guild, guild));
            if (!settings) return null;

            if (channels.some((ch) => settings.ignoredChannels.includes(ch))) return null;

            const entries = Object.fromEntries(
                (
                    await db
                        .select()
                        .from(tables.guildLoggingSettingsItems)
                        .where(
                            and(
                                eq(tables.guildLoggingSettingsItems.guild, guild),
                                or(eq(tables.guildLoggingSettingsItems.key, event), eq(tables.guildLoggingSettingsItems.key, category)),
                            ),
                        )
                ).map(({ key, ...data }) => [key, data]),
            );

            if (!(entries[event]?.enabled ?? true) || !(entries[category]?.enabled ?? false)) return null;

            for (const obj of [entries[event], entries[category], settings])
                if (obj?.useWebhook) {
                    if (obj.webhook) return { type: "webhook", value: obj.webhook };
                } else if (obj?.channel) return { type: "channel", value: obj.channel };

            return null;
        }),
} as const;
