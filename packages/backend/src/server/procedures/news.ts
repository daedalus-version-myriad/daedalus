import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/db.ts";
import { tables } from "../../db/index.ts";
import { proc } from "../trpc.ts";

const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;

export default {
    newsList: proc
        .input(
            z
                .optional(z.object({ limit: z.number().int().default(DEFAULT_LIMIT), page: z.number().int().default(DEFAULT_PAGE) }))
                .default({ limit: DEFAULT_LIMIT, page: DEFAULT_PAGE }),
        )
        .query(async ({ input }) => {
            return await db
                .select()
                .from(tables.news)
                .orderBy(desc(tables.news.date))
                .limit(input.limit)
                .offset((input.page - 1) * input.limit);
        }),
} as const;
