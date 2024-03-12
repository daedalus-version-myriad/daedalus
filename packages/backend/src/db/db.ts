import { drizzle } from "drizzle-orm/mysql2";
import { connection } from "./connection.js";

export const db = drizzle(connection);
