import { trpc } from "@daedalus/api";
import { isModuleDisabled, isWrongClient, obtainLimit } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { Client, Events, IntentsBitField, MessageReaction, Partials, User, type PartialMessageReaction, type PartialUser } from "discord.js";

const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () =>
        new Client({
            intents: Intents.Guilds | Intents.GuildMessageReactions,
            partials: [Partials.Channel, Partials.Message, Partials.Reaction],
            allowedMentions: { parse: [] },
        }),
    postprocess: (client) =>
        client
            .on(Events.MessageReactionAdd, async (reaction, user) => await handle(reaction, user, true))
            .on(Events.MessageReactionRemove, async (reaction, user) => await handle(reaction, user, false)),
});

async function handle(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser, added: boolean) {
    if (!reaction.message.guild || user.bot) return;

    if (await isWrongClient(reaction.client, reaction.message.guild!)) return;
    if (await isModuleDisabled(reaction.message.guild!, "reaction-roles")) return;

    const entries = await trpc.getReactionRoleEntries.query({ guild: reaction.message.guild!.id });

    const entry = entries
        .slice(0, (await obtainLimit(reaction.message.guild!.id, "reactionRolesCountLimit")) as number)
        .find((entry) => entry.message === reaction.message.id);

    if (!entry) return;
    if (entry.error) return;
    if (!entry.addToExisting && entry.style !== "reactions") return;

    const roles = entry.reactionData.map((x) => x.role!);
    const add = entry.reactionData.find((x) => x.emoji === (reaction.emoji.id ?? reaction.emoji.toString()))?.role;
    if (!add) return;

    const remove = roles.filter((x) => x !== add);
    const member = await reaction.message.guild.members.fetch(user.id);

    if (entry.type === "lock") {
        if (member.roles.cache.hasAny(...roles)) {
            if (!member.roles.cache.has(add)) await reaction.users.remove(user.id);
            return;
        }
        if (added) await member.roles.add(add);
    } else if (entry.type === "normal" || entry.type === "unique") {
        if (member.roles.cache.has(add)) {
            if (!added) {
                await member.roles.remove(add);
                await reaction.users.remove(user.id);
            }
        } else if (added)
            if (entry.type === "normal") await member.roles.add(add);
            else {
                await member.roles.set([...new Set([...[...member.roles.cache.keys()].filter((x) => !remove.includes(x)), add])]);

                const message = await reaction.message.fetch();

                for (const r of message.reactions.cache.values()) {
                    if ((r.emoji.id ?? r.emoji.toString()) === (reaction.emoji.id ?? reaction.emoji.toString())) continue;
                    await r.users.remove(user.id);
                }
            }
    } else {
        if (added) {
            if (!member.roles.cache.has(add)) await member.roles.add(add);
            await reaction.users.remove(user.id);
        }
    }
}
