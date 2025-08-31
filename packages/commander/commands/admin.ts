import { RepliableInteraction } from "discord.js";
import { trpc } from "../../api/index.js";
import { Commands, defer, template } from "../../bot-utils/index.js";
import { getManager } from "../lib/clients.js";

async function ensureAdmin({ _ }: { _: RepliableInteraction }) {
    if (!(await trpc.isAdmin.query(_.user.id))) throw "You are not an admin.";
}

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("admin sweep-clients")
            .description("sweep dead clients")
            .fn(ensureAdmin)
            .fn(defer(true))
            .fn(async () => {
                await getManager().sweepClients();
                return template.success("Cleaned up dead clients.");
            }),
    );
