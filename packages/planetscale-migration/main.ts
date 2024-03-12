import { db, tables } from "@daedalus/backend/index.js";
import { count } from "drizzle-orm";
import { psdb } from "./psdb.js";

const SPAN = 1000;

for (const [key, value] of Object.entries(tables)) {
    while ((await db.select({ count: count() }).from(value))[0].count > 0) await db.delete(value);

    for (let index = 0; ; index++) {
        const array = await psdb
            .select()
            .from(value)
            .offset(index * SPAN)
            .limit(SPAN);

        if (array.length === 0) break;

        console.log(`Migrating ${index * SPAN} - ${index * SPAN + array.length} of ${key}`);

        await db.insert(value).values(array);
    }
}

process.exit(0);
