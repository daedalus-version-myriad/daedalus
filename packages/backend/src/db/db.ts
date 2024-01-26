import { drizzle } from "drizzle-orm/planetscale-serverless";
import { connection } from "./connection";

export const db = drizzle(connection);
