import { autokickHook } from "@daedalus/autokick/main";
import { automodHook } from "@daedalus/automod/main";
import { autoresponderHook } from "@daedalus/autoresponder/main";
import { ClientManager } from "@daedalus/clients";
import { commanderHook } from "@daedalus/commander/main";
import { secrets } from "@daedalus/config";
import { countHook } from "@daedalus/count/main";
import { customRolesHook } from "@daedalus/custom-roles/main";
import { highlightsHook } from "@daedalus/highlights/main";
import { interactionsHook } from "@daedalus/interactions/main";
import { loggingHook } from "@daedalus/logging/main";
import { modmailHook } from "@daedalus/modmail/main";
import { nukeguardHook } from "@daedalus/nukeguard/main";
import { reactionRolesReactionsHook } from "@daedalus/reaction-roles-reactions/main";
import { redditFeedsHook } from "@daedalus/reddit-feeds/main";
import { starboardHook } from "@daedalus/starboard/main";
import { statsChannelsHook } from "@daedalus/stats-channels/main";
import { stickyAutoRolesHook } from "@daedalus/sticky-auto-roles/main";
import { stickyMessagesHook } from "@daedalus/sticky-messages/main";
import { supporterAnnouncementsHook } from "@daedalus/supporter-announcements/main";
import { taskRunnerHook } from "@daedalus/task-runner/main";
import { ticketsHook } from "@daedalus/tickets/main";
import { welcomeHook } from "@daedalus/welcome/main";
import { xpHook } from "@daedalus/xp/main";
import { ActivityType, Client, IntentsBitField, Partials } from "discord.js";
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
            sweepers: { users: { interval: 3600, filter: () => () => true }, messages: { lifetime: 604800, interval: 3600 } },
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
