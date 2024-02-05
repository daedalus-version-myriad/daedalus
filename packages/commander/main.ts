import { isWrongClient, template } from "@daedalus/bot-utils";
import { ClientManager } from "@daedalus/clients";
import Argentium from "argentium";
import { ApplicationCommandOptionType, Client, IntentsBitField } from "discord.js";
import rank from "./commands/rank.ts";
import { check } from "./permissions.ts";
import top from "./commands/top.ts";
import xpReset from "./commands/xp-reset.ts";
import xpMee6Import from "./commands/xp-mee6-import.ts";

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
                    const deny = await check(_.user, _.commandName, _.channel!);

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
            .use(rank)
            .use(top)
            .use(xpReset)
            .use(xpMee6Import),
    )
    .onCommandError((e, { _ }) => {
        const id = crypto.randomUUID();

        console.error(`${id}`, e);

        return template.error(
            `An unexpected error occurred. We sincerely apologize for this issue. Please contact support if this issue persists. This error has ID \`${id}\`.`,
            true,
        );
    });

const Intents = IntentsBitField.Flags;

new ClientManager({
    factory: () => {
        const client = new Client({ intents: Intents.Guilds });
        argentium.preApply(client);
        return client;
    },
    postprocess: (client) => argentium.postApply(client),
});
