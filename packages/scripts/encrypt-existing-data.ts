import { and, count, inArray, not, sql } from "drizzle-orm";
import { db, tables } from "../backend/index.js";
import { encryptContent } from "../bot-utils/index.js";

for (const [table, name] of [
    [tables.ticketMessages, "ticket-messages"],
    [tables.modmailMessages, "modmail-messages"],
] as const) {
    const [{ rows }] = await db
        .select({ rows: count(sql`distinct uuid`) })
        .from(table)
        .where(not(table.encrypted));

    console.log(`encrypting ${rows} threads 100-by-100 in table ${name}...`);

    while (true) {
        const count = await db.transaction(async (tx) => {
            const threads = await tx
                .selectDistinct({ uuid: table.uuid })
                .from(table)
                .where(not(table.encrypted))
                .limit(100)
                .then((rows) => rows.map((row) => row.uuid));

            if (threads.length === 0) return 0;

            const entries = await tx
                .select()
                .from(table)
                .where(and(inArray(table.uuid, threads), not(table.encrypted)));

            await tx.delete(table).where(and(inArray(table.uuid, threads), not(table.encrypted)));

            await tx.insert(table).values(
                entries.map((entry) => ({
                    ...entry,
                    content: encryptContent(entry.content),
                    edits: (entry.edits as string[]).map(encryptContent),
                    attachments: (entry.attachments as { name: string; url: string }[]).map(({ name, url }) => ({
                        name: encryptContent(name),
                        url: encryptContent(url),
                    })),
                    encrypted: true,
                })),
            );

            return threads.length;
        });

        if (count === 0) break;
        console.log(`encrypted ${count} thread(s) of table ${name}`);
    }
}

process.exit(0);
