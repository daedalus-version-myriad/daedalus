import { template } from "@daedalus/bot-utils";
import type { Commands } from "../lib.ts";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("xp reset")
            .description("irreversibly reset a user's XP to 0")
            .userOption("user", "the user to reset", { required: true })
            .fn(async ({ _, user }) =>
                template.confirm(`Confirm that you want to reset ${user}'s XP. This action is **irreversible**.`, _.user.id, `xp/reset:${user.id}`),
            ),
    );
