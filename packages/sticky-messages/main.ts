import { isModuleDisabled, isWrongClient } from "@daedalus/bot-utils";
import { Client, Events, type GuildTextBasedChannel } from "discord.js";
import { updateStick } from "./lib";

export const stickyMessagesHook = (client: Client) =>
    client.on(Events.MessageCreate, async (message) => {
        if (!message.guild) return;
        if (message.author.id === message.client.user.id) return;
        if (await isWrongClient(message.client, message.guild)) return;
        if (await isModuleDisabled(message.guild, "sticky-messages")) return;

        await updateStick(message.channel as GuildTextBasedChannel);
    });
