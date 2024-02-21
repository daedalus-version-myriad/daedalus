import { drizzle } from "drizzle-orm/planetscale-serverless";
import { connection } from "./connection.js";

export const db = drizzle(connection);
