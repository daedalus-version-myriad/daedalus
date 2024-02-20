import { trpc } from "@daedalus/api";
import { checkPermissions, isWrongClient, reply, template } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import Argentium from "argentium";
import { ApplicationCommandOptionType, Client } from "discord.js";
import ban from "./commands/ban";
import clearHistory from "./commands/clear-history";
import coOp from "./commands/co-op";
import deleteHistory from "./commands/delete-history";
import flag from "./commands/flag";
import flagMessage from "./commands/flag-message";
import giveawayReroll from "./commands/giveaway-reroll";
import highlightAdd from "./commands/highlight-add";
import highlightBlocking from "./commands/highlight-blocking";
import highlightClear from "./commands/highlight-clear";
import highlightCooldown from "./commands/highlight-cooldown";
import highlightDelay from "./commands/highlight-delay";
import highlightList from "./commands/highlight-list";
import highlightRemove from "./commands/highlight-remove";
import highlightReplies from "./commands/highlight-replies";
import history from "./commands/history";
import kick from "./commands/kick";
import massban from "./commands/massban";
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
import mute from "./commands/mute";
import notesEdit from "./commands/notes-edit";
import notesView from "./commands/notes-view";
import poll from "./commands/poll";
import purge from "./commands/purge";
import random from "./commands/random";
import rank from "./commands/rank";
import reminders from "./commands/reminders";
import report from "./commands/report";
import reportUser from "./commands/report-user";
import roleDelete from "./commands/role-delete";
import roleSet from "./commands/role-set";
import scoreboard from "./commands/scoreboard";
import slowmode from "./commands/slowmode";
import stick from "./commands/stick";
import sticklist from "./commands/sticklist";
import suggest from "./commands/suggest";
import suggestion from "./commands/suggestion";
import ticketClose from "./commands/ticket-close";
import timeout from "./commands/timeout";
import top from "./commands/top";
import unban from "./commands/unban";
import unmute from "./commands/unmute";
import unstick from "./commands/unstick";
import utility from "./commands/utility";
import warn from "./commands/warn";
import xpMee6Import from "./commands/xp-mee6-import";
import xpReset from "./commands/xp-reset";
import { setManager } from "./lib/clients";

const argentium = new Argentium()
    .commands((x) =>
        x
            .beforeAll(async ({ _, ...data }, escape) => {
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
                    await trpc.recordCommandUse.mutate({
                        command: _.isChatInputCommand()
                            ? `/${[_.commandName, _.options.getSubcommandGroup(false), _.options.getSubcommand(false)].filter((x) => x).join(" ")}`
                            : _.commandName,
                        guild: _.guild?.id ?? null,
                        channel: _.channel?.id ?? null,
                        user: _.user.id,
                        blocked: denied,
                        data,
                    });
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
            .use(stick)
            .use(sticklist)
            .use(suggest)
            .use(suggestion)
            .use(ticketClose)
            .use(timeout)
            .use(top)
            .use(unban)
            .use(unmute)
            .use(unstick)
            .use(warn)
            .use(xpReset)
            .use(xpMee6Import),
    )
    .use(random)
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

export const commanderHook = (client: Client, manager: ClientManager) => {
    argentium.preApply(client);
    argentium.postApply(client);
    setManager(manager);
};
