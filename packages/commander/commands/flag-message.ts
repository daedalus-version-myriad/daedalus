import type { Commands } from "@daedalus/bot-utils";
import { report } from "../lib/reports";

export default (x: Commands) =>
    x.message((x) =>
        x.name("Flag Message").fn(async ({ _, message }) => {
            return await report(_, message);
        }),
    );
