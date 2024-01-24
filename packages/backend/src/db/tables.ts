import { sql } from "drizzle-orm";
import { index, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const admins = mysqlTable("admins", {
    id: varchar("id", { length: 20 }).notNull().primaryKey(),
});

export const news = mysqlTable(
    "news",
    {
        code: varchar("code", { length: 64 }).notNull().primaryKey(),
        date: timestamp("date")
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        title: varchar("title", { length: 64 }).notNull(),
        subtitle: varchar("subtitle", { length: 64 }).notNull(),
        summary: varchar("summary", { length: 256 }).notNull(),
        body: text("body").notNull(),
    },
    (t) => ({
        idx_date: index("idx_date").on(t.date),
    }),
);
