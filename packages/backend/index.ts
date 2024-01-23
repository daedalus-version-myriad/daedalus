import { db } from "./src/db/db.ts";
import { tables } from "./src/db/index.ts";

console.log(await db.select().from(tables.users));
