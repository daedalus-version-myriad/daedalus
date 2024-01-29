import { ClientManager } from "@daedalus/clients";
import { secrets } from "@daedalus/config";
import { ActivityType, Client, IntentsBitField } from "discord.js";
import { eq } from "drizzle-orm";
import { tables } from "../db";
import { db } from "../db/db";

export async function setPresence(client: Client<true>, guild?: string) {
    if (client.token === secrets.DISCORD.TOKEN || !guild)
        return client.user.setPresence({ status: "online", activities: [{ type: ActivityType.Watching, name: "for /help" }] });

    const { status, activityType, activity } = (
        await db
            .select({
                status: tables.guildPremiumSettings.status,
                activityType: tables.guildPremiumSettings.activityType,
                activity: tables.guildPremiumSettings.activity,
            })
            .from(tables.guildPremiumSettings)
            .where(eq(tables.guildPremiumSettings.guild, guild))
    ).at(0) ?? { status: "online", activityType: "watching", activity: "for /help" };

    client.user.setPresence({
        status,
        activities: [
            {
                type: {
                    none: ActivityType.Custom,
                    playing: ActivityType.Playing,
                    "listening-to": ActivityType.Listening,
                    watching: ActivityType.Watching,
                    "competing-in": ActivityType.Competing,
                }[activityType],
                name: activity,
            },
        ],
    });
}

export const clients = new ClientManager({
    factory: () =>
        new Client({
            intents: IntentsBitField.Flags.Guilds | IntentsBitField.Flags.GuildMembers,
            sweepers: { users: { interval: 3600, filter: () => () => true } },
        }),
    postprocess: setPresence,
    sweep: 3600000,
});

export const bot: Promise<Client> = clients.getDefaultBot();
