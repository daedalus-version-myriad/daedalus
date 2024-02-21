import { trpc } from "../../api/index.js";
import type { Commands } from "../../bot-utils/index.js";
import { secrets } from "../../config/index.js";
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
