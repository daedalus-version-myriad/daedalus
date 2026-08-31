import { db, tables } from "@daedalus/backend/index.js";
import { encryptContent } from "@daedalus/bot-utils/index.js";

for (const [table, name] of [
    [tables.ticketMessages, "ticket-messages"],
    [tables.modmailMessages, "modmail-messages"],
] as const) {
    await db.transaction(async (tx) => {
        const entries = await tx.select().from(table);

        await tx.delete(table);

        await tx.insert(table).values(
            entries.map((entry) => ({
                ...entry,
                content: encryptContent(entry.content),
                attachments: (entry.attachments as { name: string; url: string }[]).map(({ name, url }) => ({
                    name: encryptContent(name),
                    url: encryptContent(url),
                })),
            })),
        );
    });

    console.log(`done encrypting table ${name}`);
}

process.exit(0);
