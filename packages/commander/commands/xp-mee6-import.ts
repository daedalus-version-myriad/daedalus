import { getColor, type Commands } from "@daedalus/bot-utils";
import { ComponentType, type BaseMessageOptions } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("xp mee6-import")
            .description("import XP from MEE6")
            .fn(
                async ({ _ }): Promise<BaseMessageOptions> => ({
                    embeds: [
                        {
                            title: "**MEE6 XP Import**",
                            description: `You are about to import XP from MEE6. Before you proceed, please **read the following carefully**, otherwise this will not work.\n- MEE6 must still be in your server.\n- Your MEE6 leaderboard must be public: [MEE6 Dashboard](https://mee6.xyz/en/dashboard/${
                                _.guild!.id
                            }/leaderboard).\n\nPlease select the import mode:\n- **Add** (recommended) will combine any existing Daedalus XP with incoming MEE6 XP.\n- **Replace** will wipe all Daedalus XP and replace it with MEE6's.\n- **Keep** will only import MEE6 XP for users with no Daedalus XP.\n\nDaedalus voice XP is not affected. Select **CANCEL** to end this operation without doing anything. **This action cannot be reversed.**`,
                            color: await getColor(_.guild!),
                        },
                    ],
                    components: [
                        {
                            type: ComponentType.ActionRow,
                            components: [
                                {
                                    type: ComponentType.StringSelect,
                                    customId: `:${_.user.id}:xp/mee6-import/index`,
                                    options: ["Add", "Replace", "Keep", "Cancel"].map((x) => ({ label: x, value: x.toLowerCase() })),
                                },
                            ],
                        },
                    ],
                }),
            ),
    );
