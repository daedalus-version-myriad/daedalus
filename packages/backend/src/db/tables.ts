import { sql } from "drizzle-orm";
import { index, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const admins = mysqlTable("admins", {
    id: varchar("id", { length: 20 }).notNull().primaryKey(),
});

export const news = mysqlTable(
    "news",
    {
        id: int("id").autoincrement().primaryKey(),
        date: timestamp("date")
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        code: varchar("code", { length: 64 }).notNull(),
        title: varchar("title", { length: 64 }).notNull(),
        subtitle: varchar("subtitle", { length: 64 }).notNull(),
        summary: varchar("summary", { length: 256 }).notNull(),
        body: text("body").notNull(),
    },
    (t) => ({
        idx_date: index("idx_date").on(t.date),
    }),
);
