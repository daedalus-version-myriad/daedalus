import { trpc } from "../api/index.js";
import { isModuleDisabled, isWrongClient } from "../bot-utils/index.js";
import type { ClientManager } from "../clients/index.js";
import { secrets } from "../config/index.js";
import { initTRPC } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { Client, Events, GuildMember, type PartialGuildMember } from "discord.js";
import { z } from "zod";
import { isSupporter } from "./lib.js";

let manager: ClientManager;

export const customRolesHook = (client: Client, x: ClientManager) => {
    manager = x;

    client
        .on(Events.GuildMemberRemove, async (member) => {
            if (await isWrongClient(member.client, member.guild)) return;
            if (await isModuleDisabled(member.guild, "custom-roles")) return;

            await deleteRoleFor(member);
        })
        .on(Events.GuildMemberUpdate, async (_, member) => {
            if (await isWrongClient(member.client, member.guild)) return;
            if (await isModuleDisabled(member.guild, "custom-roles")) return;

            if (!(await isSupporter(member))) await deleteRoleFor(member);
        });
};

async function deleteRoleFor(member: GuildMember | PartialGuildMember) {
    const role = await trpc.getCustomRole.query({ guild: member.guild.id, user: member.id });
    if (!role) return;

    await member.guild.roles.delete(role).catch(() => null);
    await trpc.deleteCustomRole.mutate({ guild: member.guild.id, user: member.id });
}

const t = initTRPC.create();

const router = t.router({
    update: t.procedure.input(z.string()).mutation(async ({ input: guildId }) => {
        if (!manager) return;

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
