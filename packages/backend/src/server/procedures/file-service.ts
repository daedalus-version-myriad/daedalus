import { secrets } from "@daedalus/config";
import type { TextChannel } from "discord.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { bot } from "../../bot";
import { db, tables } from "../../db";
import { proc } from "../trpc";

let channel: TextChannel;

export async function addFile(url: string) {
    channel ??= (await (await bot).channels.fetch(secrets.DISCORD.IMAGE_HOST)) as TextChannel;

    try {
        const { id } = await channel.send({ files: [{ attachment: url }] });

        while (true) {
            const uuid = crypto.randomUUID();
            const [entry] = await db.select().from(tables.files).where(eq(tables.files.uuid, uuid));
            if (entry) continue;

            await db.insert(tables.files).values({ uuid: crypto.randomUUID(), channel: channel.id, message: id });
            return uuid;
        }
    } catch (error) {
        console.error(error);
        return null;
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
            const ch = entry.channel === channel.id ? channel : ((await (await bot).channels.fetch(entry.channel)) as TextChannel);
            const message = await ch.messages.fetch({ message: entry.message, force: true });
            return message.attachments.first()!.url;
        } catch {}

        return null;
    }),
} as const;
