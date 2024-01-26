import { ClientManager, loginAndReady } from "@daedalus/clients";
import { Client, IntentsBitField } from "discord.js";

export const clients = new ClientManager((token) =>
    loginAndReady(
        new Client({
            intents: IntentsBitField.Flags.Guilds | IntentsBitField.Flags.GuildMembers,
            sweepers: { users: { interval: 3600, filter: () => () => true } },
        }),
        token,
    ),
);

export const bot: Promise<Client> = clients.getBot();
