import { checkPermissions, isWrongClient, reply, template } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import Argentium from "argentium";
import { ApplicationCommandOptionType, Client, IntentsBitField } from "discord.js";
import ban from "./commands/ban.ts";
import clearHistory from "./commands/clear-history.ts";
import coOp from "./commands/co-op";
import deleteHistory from "./commands/delete-history.ts";
import flag from "./commands/flag";
import flagMessage from "./commands/flag-message";
import giveawayReroll from "./commands/giveaway-reroll";
import highlightAdd from "./commands/highlight-add.ts";
import highlightBlocking from "./commands/highlight-blocking.ts";
import highlightClear from "./commands/highlight-clear.ts";
import highlightCooldown from "./commands/highlight-cooldown.ts";
import highlightDelay from "./commands/highlight-delay.ts";
import highlightList from "./commands/highlight-list.ts";
import highlightRemove from "./commands/highlight-remove.ts";
import highlightReplies from "./commands/highlight-replies.ts";
import history from "./commands/history.ts";
import kick from "./commands/kick.ts";
import massban from "./commands/massban.ts";
import modmailClose from "./commands/modmail-close";
import modmailContact from "./commands/modmail-contact";
import modmailLogLink from "./commands/modmail-log-link";
import modmailNotify from "./commands/modmail-notify";
import modmailNsfw from "./commands/modmail-nsfw";
import modmailReply from "./commands/modmail-reply";
import modmailReplyModal from "./commands/modmail-reply-modal";
import modmailSnippetSend from "./commands/modmail-snippet-send";
import modmailSnippetUseAsTemplate from "./commands/modmail-snippet-use-as-template";
import modmailSnippetView from "./commands/modmail-snippet-view";
import mute from "./commands/mute.ts";
import notesEdit from "./commands/notes-edit.ts";
import notesView from "./commands/notes-view.ts";
import poll from "./commands/poll.ts";
import purge from "./commands/purge.ts";
import rank from "./commands/rank";
import reminders from "./commands/reminders.ts";
import report from "./commands/report";
import reportUser from "./commands/report-user";
import roleDelete from "./commands/role-delete";
import roleSet from "./commands/role-set";
import scoreboard from "./commands/scoreboard";
import slowmode from "./commands/slowmode.ts";
import suggest from "./commands/suggest";
import suggestion from "./commands/suggestion";
import ticketClose from "./commands/ticket-close";
import timeout from "./commands/timeout.ts";
import top from "./commands/top";
import unban from "./commands/unban.ts";
import unmute from "./commands/unmute.ts";
import utility from "./commands/utility.ts";
import warn from "./commands/warn.ts";
import xpMee6Import from "./commands/xp-mee6-import";
import xpReset from "./commands/xp-reset";
import { setManager } from "./lib/clients.ts";

process.on("uncaughtException", console.error);

const argentium = new Argentium()
    .commands((x) =>
        x
            .beforeAll(async ({ _ }, escape) => {
                const quit = (message: string) =>
                    escape(
                        _.isAutocomplete()
                            ? [{ name: message, value: _.options.getFocused(true).type === ApplicationCommandOptionType.String ? "." : 0 }]
                            : template.error(message),
                    );

                if (_.guild && _.commandName !== "admin" && (await isWrongClient(_.client, _.guild)))
                    return quit("This is not the correct client for this guild. Please use this guild's client and kick this bot.");

                let denied = false;

                if ((_.isChatInputCommand() || _.isAutocomplete()) && _.commandName !== "admin") {
                    const deny = await checkPermissions(_.user, _.commandName, _.channel!);

                    if (deny) {
                        quit(deny);
                        denied = true;
                    }
                }

                if (!_.isAutocomplete())
                    console.log(
                        `${_.isChatInputCommand() ? `/${[_.commandName, _.options.getSubcommandGroup(false), _.options.getSubcommand(false)].filter((x) => x).join(" ")}` : _.commandName} (${_.user.tag} (${_.user.id}) in ${_.guild ? `${_.guild.name} (${_.guild.id})` : "DMs"}) ${denied ? "(permission denied)" : ""}`,
                    );
            })
            .use(ban)
            .use(clearHistory)
            .use(coOp)
            .use(deleteHistory)
            .use(flagMessage)
            .use(flag)
            .use(giveawayReroll)
            .use(highlightAdd)
            .use(highlightBlocking)
            .use(highlightClear)
            .use(highlightCooldown)
            .use(highlightDelay)
            .use(highlightList)
            .use(highlightRemove)
            .use(highlightReplies)
            .use(history)
            .use(kick)
            .use(massban)
            .use(modmailClose)
            .use(modmailContact)
            .use(modmailLogLink)
            .use(modmailNotify)
            .use(modmailNsfw)
            .use(modmailReplyModal)
            .use(modmailReply)
            .use(modmailSnippetSend)
            .use(modmailSnippetUseAsTemplate)
            .use(modmailSnippetView)
            .use(mute)
            .use(notesEdit)
            .use(notesView)
            .use(poll)
            .use(purge)
            .use(rank)
            .use(reportUser)
            .use(report)
            .use(roleDelete)
            .use(roleSet)
            .use(scoreboard)
            .use(slowmode)
            .use(suggest)
            .use(suggestion)
            .use(ticketClose)
            .use(timeout)
            .use(top)
            .use(unban)
            .use(unmute)
            .use(warn)
            .use(xpReset)
            .use(xpMee6Import),
    )
    .use(reminders)
    .use(utility)
    .onCommandError((e, _) => {
        if (_.isRepliable() && typeof e === "string") {
            reply(_, template.error(e));
            return;
        }

        const id = crypto.randomUUID();
        console.error(`${id}`, e);

        return template.error(
            `An unexpected error occurred. We sincerely apologize for this issue. Please contact support if this issue persists. This error has ID \`${id}\`.`,
        );
    });

const Intents = IntentsBitField.Flags;

const clients = new ClientManager({
    factory: () => {
        const client = new Client({ intents: Intents.Guilds, allowedMentions: { parse: [] } });
        argentium.preApply(client);
        return client;
    },
    postprocess: (client) => argentium.postApply(client),
});

setManager(clients);
