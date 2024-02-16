import type { Commands } from "@daedalus/bot-utils";
import { report } from "../lib/reports";

export default (x: Commands) =>
    x.user((x) =>
        x.name("Report User").fn(async ({ _, user }) => {
            return await report(_, user);
        }),
    );
