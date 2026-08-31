import { db, tables } from "@daedalus/backend/index.js";
import { encryptContent } from "@daedalus/bot-utils/index.js";
import { eq } from "drizzle-orm";

for (const table of [tables.ticketMessages, tables.modmailMessages]) {
    for (const entry of await db.select().from(table)) {
        await db
            .update(table)
            .set({
                content: encryptContent(entry.content),
                attachments: (entry.attachments as { name: string; url: string }[]).map(({ name, url }) => ({
                    name: encryptContent(name),
                    url: encryptContent(url),
                })),
            })
            .where(eq(table.uuid, entry.uuid));
    }
}
