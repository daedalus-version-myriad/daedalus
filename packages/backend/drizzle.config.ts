import { secrets } from "../config/index";
import type { Config } from "drizzle-kit";

export default {
    schema: "./src/db/tables.ts",
    out: "./drizzle",
    dialect: "mysql",
    dbCredentials: {
        host: secrets.DATABASE.HOST,
        user: secrets.DATABASE.USERNAME,
        password: secrets.DATABASE.PASSWORD,
        database: secrets.DATABASE.NAME,
    },
} satisfies Config;
