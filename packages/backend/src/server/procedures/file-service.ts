import { secrets } from "../../../../config/index.js";
import type { TextChannel } from "discord.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { bot } from "../../bot/index.js";
import { db, tables } from "../../db/index.js";
import { proc } from "../trpc.js";

let channel: TextChannel;

export async function addFile(url: string) {
    channel ??= (await (await bot).channels.fetch(secrets.DISCORD.IMAGE_HOST)) as TextChannel;

    try {
        const { id } = await channel.send({ files: [{ attachment: url }] });

        while (true) {
            const uuid = crypto.randomUUID();
            const [entry] = await db.select().from(tables.files).where(eq(tables.files.uuid, uuid));
            if (entry) continue;

            await db.insert(tables.files).values({ uuid, channel: channel.id, message: id });
            return `/file/${uuid}`;
        }
    } catch (error) {
        console.error(error);
        return url;
    }
}

export async function mapFiles(files: { name: string; url: string }[]) {
    return await Promise.all(files.map(async ({ name, url }) => ({ name, url: await addFile(url) })));
}

export default {
    addFile: proc.input(z.string()).mutation(async ({ input: url }) => {
        return await addFile(url);
    }),
    getFile: proc.input(z.string()).query(async ({ input: uuid }) => {
        const [entry] = await db.select({ channel: tables.files.channel, message: tables.files.message }).from(tables.files).where(eq(tables.files.uuid, uuid));
        if (!entry) return null;

        try {
            const ch = entry.channel === channel?.id ? channel : (channel = (await (await bot).channels.fetch(entry.channel)) as TextChannel);
            const message = await ch.messages.fetch({ message: entry.message, force: true });
            return message.attachments.first()!.url;
        } catch (error) {
            console.error(error);
        }

        return null;
    }),
} as const;
