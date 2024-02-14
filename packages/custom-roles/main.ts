import { trpc } from "@daedalus/api";
import { isModuleDisabled, isWrongClient } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import { secrets } from "@daedalus/config";
import { initTRPC } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { Client, Events, IntentsBitField } from "discord.js";
import { z } from "zod";
import { isSupporter } from "./lib";

process.on("uncaughtException", console.error);

const Intents = IntentsBitField.Flags;

const manager = new ClientManager({
    factory: () => new Client({ intents: Intents.Guilds | Intents.GuildMembers, allowedMentions: { parse: [] } }),
    postprocess: (client) =>
        client
            .on(Events.GuildMemberRemove, async (member) => {
                if (await isWrongClient(member.client, member.guild)) return;
                if (await isModuleDisabled(member.guild, "custom-roles")) return;

                await trpc.deleteCustomRole.mutate({ guild: member.guild.id, user: member.id });
            })
            .on(Events.GuildMemberUpdate, async (_, member) => {
                if (await isWrongClient(member.client, member.guild)) return;
                if (await isModuleDisabled(member.guild, "custom-roles")) return;

                if (!(await isSupporter(member))) await trpc.deleteCustomRole.mutate({ guild: member.guild.id, user: member.id });
            }),
});

const t = initTRPC.create();

const router = t.router({
    update: t.procedure.input(z.string()).mutation(async ({ input: guildId }) => {
        if (await isModuleDisabled(guildId, "custom-roles")) return;

        const client = await manager.getBot(guildId);
        if (!client) return;

        const entries = await trpc.getAllCustomRoles.query(guildId);
        if (entries.length === 0) return;

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return;

        const config = await trpc.getCustomRolesConfig.query(guildId);

        const users: string[] = [];

        for (const entry of entries) {
            const member = await guild.members.fetch(entry.user).catch(() => null);

            if (!member || !(await isSupporter(member, config))) {
                await guild.roles.delete(entry.role).catch(() => null);
                users.push(entry.user);
            }
        }

        if (users.length > 0) await trpc.deleteCustomRoles.mutate({ guild: guild.id, users });
    }),
});

export type Router = typeof router;

const server = createHTTPServer({ router });
server.listen(secrets.PORTS.CUSTOM_ROLE_SWEEPER);

console.log(`Server is listening on localhost:${secrets.PORTS.CUSTOM_ROLE_SWEEPER}`);
