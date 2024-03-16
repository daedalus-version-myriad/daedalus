import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from "./db.js";

await migrate(db, { migrationsFolder: "./drizzle" });
process.exit(0);
