import { migrate } from "drizzle-orm/planetscale-serverless/migrator";
import { db } from "./db.ts";

await migrate(db, { migrationsFolder: "./drizzle" });
