import { ApplicationCommandOptionType, Client } from "discord.js";
import { trpc } from "../api/index.js";
import Argentium from "../argentium/index.js";
import { checkPermissions, isWrongClient, reply, template } from "../bot-utils/index.js";
import { ClientManager } from "../clients/index.js";
import autokick from "./commands/autokick.js";
import ban from "./commands/ban.js";
import clearHistory from "./commands/clear-history.js";
import coOp from "./commands/co-op.js";
import deleteHistory from "./commands/delete-history.js";
import flagMessage from "./commands/flag-message.js";
import flag from "./commands/flag.js";
import giveawayReroll from "./commands/giveaway-reroll.js";
import highlightAdd from "./commands/highlight-add.js";
import highlightBlocking from "./commands/highlight-blocking.js";
import highlightClear from "./commands/highlight-clear.js";
import highlightCooldown from "./commands/highlight-cooldown.js";
import highlightDelay from "./commands/highlight-delay.js";
import highlightList from "./commands/highlight-list.js";
import highlightRemove from "./commands/highlight-remove.js";
import highlightReplies from "./commands/highlight-replies.js";
import history from "./commands/history.js";
import kick from "./commands/kick.js";
import massban from "./commands/massban.js";
import modmailClose from "./commands/modmail-close.js";
import modmailContact from "./commands/modmail-contact.js";
import modmailLogLink from "./commands/modmail-log-link.js";
import modmailNotify from "./commands/modmail-notify.js";
import modmailNsfw from "./commands/modmail-nsfw.js";
import modmailReplyModal from "./commands/modmail-reply-modal.js";
import modmailReply from "./commands/modmail-reply.js";
import modmailSnippetSend from "./commands/modmail-snippet-send.js";
import modmailSnippetUseAsTemplate from "./commands/modmail-snippet-use-as-template.js";
import modmailSnippetView from "./commands/modmail-snippet-view.js";
import mute from "./commands/mute.js";
import notesEdit from "./commands/notes-edit.js";
import notesView from "./commands/notes-view.js";
import poll from "./commands/poll.js";
import purge from "./commands/purge.js";
import random from "./commands/random.js";
import rank from "./commands/rank.js";
import reminders from "./commands/reminders.js";
import reportUser from "./commands/report-user.js";
import report from "./commands/report.js";
import roleDelete from "./commands/role-delete.js";
import roleSet from "./commands/role-set.js";
import scoreboard from "./commands/scoreboard.js";
import slowmode from "./commands/slowmode.js";
import stick from "./commands/stick.js";
import sticklist from "./commands/sticklist.js";
import suggest from "./commands/suggest.js";
import suggestion from "./commands/suggestion.js";
import ticketClose from "./commands/ticket-close.js";
import timeout from "./commands/timeout.js";
import top from "./commands/top.js";
import unban from "./commands/unban.js";
import unmute from "./commands/unmute.js";
import unstick from "./commands/unstick.js";
import utility from "./commands/utility.js";
import warn from "./commands/warn.js";
import xpMee6Import from "./commands/xp-mee6-import.js";
import xpReset from "./commands/xp-reset.js";
import { setManager } from "./lib/clients.js";

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
            .use(autokick)
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
