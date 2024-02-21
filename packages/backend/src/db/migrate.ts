import { migrate } from "drizzle-orm/planetscale-serverless/migrator";
import { db } from "./db.js";

await migrate(db, { migrationsFolder: "./drizzle" });
