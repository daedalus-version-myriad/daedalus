import type { Commands } from "@daedalus/bot-utils";
import { report } from "../lib/reports";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("report")
            .description("report a user to moderators")
            .userOption("user", "the user to report", { required: true })
            .fn(async ({ _, user }) => {
                return await report(_, user);
            }),
    );
