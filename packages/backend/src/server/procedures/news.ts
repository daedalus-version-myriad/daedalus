import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { tables } from "../../db/index.js";
import { db } from "../../db/db.js";
import { proc } from "../trpc.js";

const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

export default {
    newsGet: proc.input(z.string().max(64)).query(async ({ input }) => {
        return (await db.select().from(tables.news).where(eq(tables.news.code, input))).at(0);
    }),
    newsList: proc
        .input(
            z
                .optional(z.object({ limit: z.number().int().default(DEFAULT_LIMIT), page: z.number().int().default(DEFAULT_PAGE) }))
                .default({ limit: DEFAULT_LIMIT, page: DEFAULT_PAGE }),
        )
        .query(async ({ input }) => {
            return {
                news: await db
                    .select()
                    .from(tables.news)
                    .orderBy(desc(tables.news.date))
                    .limit(input.limit)
                    .offset((input.page - 1) * input.limit),
                pages: Math.max(1, Math.ceil((await db.select({ count: sql<number>`COUNT(*)` }).from(tables.news))[0].count / input.limit)),
            };
        }),
    newsCreate: proc
        .input(
            z.object({
                code: z.string().max(64),
                title: z.string().max(64),
                subtitle: z.string().max(64),
                summary: z.string().max(256),
                body: z.string(),
            }),
        )
        .mutation(async ({ input }) => {
            try {
                await db.insert(tables.news).values(input);
            } catch (error: any) {
                return error.body.message.includes("AlreadyExists")
                    ? "That code is already in use."
                    : (console.error(error), "An unexpected database error occurred.");
            }
        }),
    newsEdit: proc
        .input(
            z.object({
                code: z.string().max(64),
                title: z.string().max(64),
                subtitle: z.string().max(64),
                summary: z.string().max(256),
                body: z.string(),
            }),
        )
        .mutation(async ({ input }) => {
            const { rowsAffected } = await db
                .update(tables.news)
                .set({ code: input.code, title: input.title, subtitle: input.subtitle, summary: input.summary, body: input.body })
                .where(eq(tables.news.code, input.code));

            if (rowsAffected === 0) return "No article found with that code.";
        }),
} as const;
