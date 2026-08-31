import { db, tables } from "@daedalus/backend/index.js";
import { encryptContent } from "@daedalus/bot-utils/index.js";
import { count, inArray, not } from "drizzle-orm";

for (const [table, name] of [
    [tables.ticketMessages, "ticket-messages"],
    [tables.modmailMessages, "modmail-messages"],
] as const) {
    const [{ rows }] = await db.select({ rows: count() }).from(table).where(not(table.encrypted));
    console.log(`encrypting ${rows} rows in table ${name}...`);

    while (true) {
        const done = await db.transaction(async (tx) => {
            const entries = await tx.select().from(table).where(not(table.encrypted)).limit(10000);
            if (entries.length === 0) return true;

            await tx.delete(table).where(
                inArray(
                    table.uuid,
                    entries.map((entry) => entry.uuid),
                ),
            );

            await tx.insert(table).values(
                entries.map((entry) => ({
                    ...entry,
                    content: encryptContent(entry.content),
                    attachments: (entry.attachments as { name: string; url: string }[]).map(({ name, url }) => ({
                        name: encryptContent(name),
                        url: encryptContent(url),
                    })),
                    encrypted: true,
                })),
            );

            return false;
        });

        console.log(`encrypted 10K rows of table ${name}`);
        if (done) break;
    }
}

process.exit(0);
