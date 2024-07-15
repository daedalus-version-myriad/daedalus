import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { bot, clients } from "../../bot/index.js";
import { db } from "../../db/db.js";
import { tables } from "../../db/index.js";
import { snowflake } from "../schemas.js";
import { proc } from "../trpc.js";
import { getModmailSettings, getTicketsSettings } from "./guild-settings.js";

export default {
    getModmailThread: proc.input(z.object({ id: snowflake.nullable(), uuid: z.string() })).query(async ({ input: { id, uuid } }) => {
        if (!id) throw "You must be signed in to view modmail logs.";

        const [thread] = await db.select().from(tables.modmailThreads).where(eq(tables.modmailThreads.uuid, uuid));
        if (!thread) throw "Thread not found.";

        const client = await clients.getBot(thread.guild);
        if (!client) throw "The client for this server could not be fetched.";

        const guild = await client.guilds.fetch(thread.guild).catch(() => null);
        if (!guild) throw "The server could not be fetched to check for permissions.";

        if (id !== guild.ownerId) {
            const config = await getModmailSettings(thread.guild);
            const target = config.targets.find((target) => target.id === thread.targetId);

            if (!target) throw "The modmail target could not be fetched, so only the owner may view the logs for this thread now.";

            const member = await guild.members.fetch(id).catch(() => null);
            if (!member?.roles.cache.hasAny(...target.accessRoles)) throw "You do not have permission to view that modmail thread.";
        }

        const cache: Record<string, string> = {};

        return {
            thread: { ...thread, username: (cache[thread.user] = (await (await bot).users.fetch(thread.user).catch(() => null))?.tag ?? "(Unknown User)") },
            messages: await Promise.all(
                (await db.select().from(tables.modmailMessages).where(eq(tables.modmailMessages.uuid, uuid)).orderBy(asc(tables.modmailMessages.time))).map(
                    async (message) => ({
                        ...message,
                        username:
                            message.type === "incoming"
                                ? cache[thread.user]
                                : (cache[message.author] ??= (await (await bot).users.fetch(message.author).catch(() => null))?.tag ?? "(Unknown User)"),
                    }),
                ),
            ),
        };
    }),
    getTicketThread: proc.input(z.object({ id: snowflake.nullable(), uuid: z.string() })).query(async ({ input: { id, uuid } }) => {
        if (!id) throw "You must be signed in to view ticket logs.";

        const [ticket] = await db.select().from(tables.tickets).where(eq(tables.tickets.uuid, uuid));
        if (!ticket) throw "Ticket not found.";

        const client = await clients.getBot(ticket.guild);
        if (!client) throw "The client for this server could not be fetched.";

        const guild = await client.guilds.fetch(ticket.guild).catch(() => null);
        if (!guild) throw "The server could not be fetched to check for permissions.";

        if (id !== guild.ownerId) {
            const config = await getTicketsSettings(ticket.guild);

            const prompt = config.prompts.find((prompt) => prompt.id === ticket.prompt);
            if (!prompt) throw "The ticket prompt could not be fetched, so only the owner may view the logs for this ticket now.";

            const target = prompt.targets.find((target) => target.id === ticket.target);
            if (!target) throw "The ticket prompt's target could not be fetched, so only the owner may view the logs for this ticket now.";

            const member = await guild.members.fetch(id).catch(() => null);
            if (!member?.roles.cache.hasAny(...target.accessRoles)) throw "You do not have permission to view that ticket.";
        }

        const cache: Record<string, string> = {};

        return {
            ticket: {
                ...ticket,
                username: (cache[ticket.user] = (await (await bot).users.fetch(ticket.user).catch(() => null))?.tag ?? "(Unknown User)"),
            },
            messages: await Promise.all(
                (await db.select().from(tables.ticketMessages).where(eq(tables.ticketMessages.uuid, uuid)).orderBy(asc(tables.ticketMessages.time))).map(
                    async (message) => ({
                        ...message,
                        username: (cache[message.author] ??= (await (await bot).users.fetch(message.author).catch(() => null))?.tag ?? "(Unknown User)"),
                    }),
                ),
            ),
        };
    }),
} as const;
