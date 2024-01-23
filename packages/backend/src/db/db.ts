import { drizzle } from "drizzle-orm/planetscale-serverless";
import { connection } from "./connection.ts";

export const db = drizzle(connection);
