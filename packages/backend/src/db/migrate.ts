import { migrate } from "drizzle-orm/planetscale-serverless/migrator";
import { db } from "./db";

await migrate(db, { migrationsFolder: "./drizzle" });
