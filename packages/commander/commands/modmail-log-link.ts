import { trpc } from "@daedalus/api";
import type { Commands } from "@daedalus/bot-utils";
import { secrets } from "@daedalus/config";
import { ButtonStyle, ComponentType } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("modmail log-link")
            .description("get the link to the logs for the current modmail thread on the dashboard")
            .fn(async ({ _ }) => {
                const entry = await trpc.getModmailThreadByChannel.query(_.channel!.id);
                if (!entry) throw "This is not a modmail thread.";

                return {
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Link,
                                    label: "View on Dashboard",
                                    url: `${secrets.DOMAIN}/modmail/${entry.uuid}`,
                                },
                            ],
                        },
                    ],
                };
            }),
    );
