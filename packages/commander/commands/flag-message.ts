import type { Commands } from "../../bot-utils/index.js";
import { report } from "../lib/reports.js";

export default (x: Commands) =>
    x.message((x) =>
        x.name("Flag Message").fn(async ({ _, message }) => {
            return await report(_, message);
        }),
    );
