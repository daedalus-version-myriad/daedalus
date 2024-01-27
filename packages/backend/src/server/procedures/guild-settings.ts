import type { GuildSettings } from "@daedalus/types";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/db";
import { tables } from "../../db/index";
import { snowflake } from "../schemas.ts";
import { decodeArray } from "../transformations.ts";
import { proc } from "../trpc";

export default {
    getSettings: proc.input(z.string()).query(async ({ input: guild }): Promise<GuildSettings> => {
        const data = (await db.select().from(tables.guildSettings).where(eq(tables.guildSettings.guild, guild))).at(0) ?? {
            guild,
            dashboardPermission: "manager",
            embedColor: 0x009688,
            muteRole: null,
            banFooter: "",
            modOnly: false,
            allowedRoles: "",
            blockedRoles: "",
            allowlistOnly: false,
            allowedChannels: "",
            blockedChannels: "",
        };

        return {
            ...data,
            allowedRoles: decodeArray(data.allowedRoles),
            blockedRoles: decodeArray(data.blockedRoles),
            allowedChannels: decodeArray(data.allowedChannels),
            blockedChannels: decodeArray(data.blockedChannels),
        };
    }),
    setSettings: proc
        .input(
            z.object({
                guild: snowflake,
                dashboardPermission: z.enum(["owner", "admin", "manager"]),
                embedColor: z.number().int().min(0).max(0xffffff),
                muteRole: snowflake.nullable(),
                banFooter: z.string().max(1024),
                modOnly: z.boolean(),
                allowedRoles: snowflake.array(),
                blockedRoles: snowflake.array(),
                allowlistOnly: z.boolean(),
                allowedChannels: snowflake.array(),
                blockedChannels: snowflake.array(),
            }),
        )
        .mutation(async ({ input: { guild, ...data } }) => {
            const mapped = {
                ...data,
                allowedRoles: data.allowedRoles.join("/"),
                blockedRoles: data.blockedRoles.join("/"),
                allowedChannels: data.allowedChannels.join("/"),
                blockedChannels: data.blockedChannels.join("/"),
            };

            await db
                .insert(tables.guildSettings)
                .values({ guild, ...mapped })
                .onDuplicateKeyUpdate({ set: mapped });
        }),
} as const;
