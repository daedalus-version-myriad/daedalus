import type Argentium from "argentium";
import type { RepliableInteraction } from "discord.js";

export type Commands = Argentium["commands"] extends (fn: (cu: infer T) => unknown) => unknown ? T : never;

export function defer(ephemeral: boolean) {
    return async <T extends { _: RepliableInteraction }>(data: T) => (await data._.deferReply({ ephemeral }), data);
}
