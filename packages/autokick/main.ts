import { Client, Events } from "discord.js";
import { trpc } from "../api/index.js";
import { isModuleDisabled, isWrongClient, sendCustomMessage } from "../bot-utils/index.js";
import { formatDuration } from "../global-utils/index.js";
import { willAutokick } from "./lib.js";

export const autokickHook = (client: Client) =>
    client.on(Events.GuildMemberAdd, async (member) => {
        if (await isWrongClient(client, member.guild)) return;
        if (await isModuleDisabled(member.guild, "autokick")) return;

        if (await trpc.hasAutokickExemption.query({ guild: member.guild.id, user: member.id })) return;

        const config = await trpc.getAutokickConfig.query(member.guild.id);
        if (!(await willAutokick(member, config))) return;

        if (config.sendMessage)
            try {
                const channel = await member.createDM();

                await sendCustomMessage(channel, config.parsed, "Autokick", `An error occurred trying to send an autokick message to ${member}`, {
                    member,
                });
            } catch {}

        await member.kick(`autokick: minimum account age is ${formatDuration(config.minimumAge)}`);
    });
