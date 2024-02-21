import { ActivityType, Client, IntentsBitField, Partials } from "discord.js";
import { eq } from "drizzle-orm";
import { autokickHook } from "../../../autokick/main.js";
import { automodHook } from "../../../automod/main.js";
import { autoresponderHook } from "../../../autoresponder/main.js";
import { ClientManager } from "../../../clients/index.js";
import { commanderHook } from "../../../commander/main.js";
import { CLIENT_ID } from "../../../config/public.js";
import { countHook } from "../../../count/main.js";
import { customRolesHook } from "../../../custom-roles/main.js";
import { highlightsHook } from "../../../highlights/main.js";
import { interactionsHook } from "../../../interactions/main.js";
import { loggingHook } from "../../../logging/main.js";
import { modmailHook } from "../../../modmail/main.js";
import { nukeguardHook } from "../../../nukeguard/main.js";
import { reactionRolesReactionsHook } from "../../../reaction-roles-reactions/main.js";
import { redditFeedsHook } from "../../../reddit-feeds/main.js";
import { starboardHook } from "../../../starboard/main.js";
import { statsChannelsHook } from "../../../stats-channels/main.js";
import { stickyAutoRolesHook } from "../../../sticky-auto-roles/main.js";
import { stickyMessagesHook } from "../../../sticky-messages/main.js";
import { supporterAnnouncementsHook } from "../../../supporter-announcements/main.js";
import { taskRunnerHook } from "../../../task-runner/main.js";
import { ticketsHook } from "../../../tickets/main.js";
import { welcomeHook } from "../../../welcome/main.js";
import { xpHook } from "../../../xp/main.js";
import { db } from "../db/db.js";
import { tables } from "../db/index.js";

export async function setPresence(client: Client<true>, guild?: string) {
    if (client.user.id === CLIENT_ID || !guild)
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

const Intents = IntentsBitField.Flags;

export const clients: ClientManager = new ClientManager({
    factory: () =>
        new Client({
            intents:
                Intents.Guilds |
                Intents.GuildMembers |
                Intents.GuildMessages |
                Intents.MessageContent |
                Intents.DirectMessages |
                Intents.GuildEmojisAndStickers |
                Intents.GuildModeration |
                Intents.GuildScheduledEvents |
                Intents.GuildInvites |
                Intents.GuildMessageReactions |
                Intents.GuildVoiceStates,
            partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.Reaction],
            sweepers: { messages: { lifetime: 604800, interval: 3600 } },
            allowedMentions: { parse: [] },
        }),
    postprocess: (client) =>
        [
            (x: Client<true>) => setPresence(x),
            autokickHook,
            automodHook,
            autoresponderHook,
            commanderHook,
            countHook,
            customRolesHook,
            highlightsHook,
            interactionsHook,
            loggingHook,
            modmailHook,
            nukeguardHook,
            reactionRolesReactionsHook,
            redditFeedsHook,
            starboardHook,
            statsChannelsHook,
            stickyMessagesHook,
            stickyAutoRolesHook,
            supporterAnnouncementsHook,
            taskRunnerHook,
            ticketsHook,
            welcomeHook,
            xpHook,
        ].forEach((f) => f(client, clients)),
    sweep: 3600000,
});

export const bot: Promise<Client> = clients.getDefaultBot();
