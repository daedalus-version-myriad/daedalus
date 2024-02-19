import { trpc } from "@daedalus/api";
import { type GuildTextBasedChannel } from "discord.js";

const lastUpdate = new Map<string, number>();
const scheduledUpdate = new Map<string, Timer>();

export async function updateStick(channel: GuildTextBasedChannel) {
    const entry = await trpc.getStickyMessage.query(channel.id);
    if (!entry) return;

    const now = new Date().getTime();

    if (lastUpdate.has(channel.id) && now - lastUpdate.get(channel.id)! < (entry.seconds ?? 4) * 1000) {
        if (scheduledUpdate.has(channel.id)) return;

        scheduledUpdate.set(
            channel.id,
            setTimeout(
                () => {
                    scheduledUpdate.delete(channel.id);
                    updateStick(channel);
                },
                (entry.seconds ?? 4) * 1000 - now + lastUpdate.get(channel.id)!,
            ),
        );

        return;
    }

    lastUpdate.set(channel.id, now);

    if (entry.message)
        try {
            const message = await channel.messages.fetch(entry.message);
            await message.delete();
        } catch {
            // ignore this
        }

    if (!entry.content) return await trpc.deleteStickyMessage.mutate(channel.id);

    const message = await channel.send(entry.content);
    await trpc.bumpStickyMessage.mutate({ channel: channel.id, message: message.id });
}
