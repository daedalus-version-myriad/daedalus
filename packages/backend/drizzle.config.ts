import { secrets } from "../config/index.js";
import type { Config } from "drizzle-kit";

export default {
    schema: "./src/db/tables.ts",
    out: "./drizzle",
    driver: "mysql2",
    dbCredentials: {
        host: secrets.DATABASE.HOST,
        user: secrets.DATABASE.USERNAME,
        password: secrets.DATABASE.PASSWORD,
        database: secrets.DATABASE.NAME,
    },
} satisfies Config;
