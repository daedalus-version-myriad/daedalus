import type { Commands } from "../../bot-utils/index.js";
import { report } from "../lib/reports.js";

export default (x: Commands) =>
    x.user((x) =>
        x.name("Report User").fn(async ({ _, user }) => {
            return await report(_, user);
        }),
    );
