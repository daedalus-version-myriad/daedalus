import { and, eq, not, or } from "drizzle-orm";
import { tables } from "./src/db";
import { db } from "./src/db/db";
import "./src/server";

process.on("uncaughtException", console.error);

async function updateXpAmounts() {
    const lastXpPurge = (await db.select({ lastXpPurge: tables.globals.lastXpPurge }).from(tables.globals)).at(0)?.lastXpPurge ?? 0;
    const now = new Date();
    const last = new Date(lastXpPurge);

    const set: Partial<Record<`${"text" | "voice"}${"Monthly" | "Weekly" | "Daily"}`, 0>> = {};

    if (now.getMonth() !== last.getMonth()) set.textMonthly = set.voiceMonthly = set.textDaily = set.voiceDaily = 0;
    else if (now.getDate() !== last.getDate()) set.textDaily = set.voiceDaily = 0;

    if (Math.floor(now.getTime() / 604800000) !== Math.floor(last.getTime() / 604800000)) set.textWeekly = set.voiceWeekly = set.textDaily = set.voiceDaily = 0;

    if (Object.keys(set).length > 0)
        await db
            .update(tables.xp)
            .set(set)
            .where(or(not(eq(tables.xp.textMonthly, 0)), not(eq(tables.xp.voiceMonthly, 0))));

    await db
        .insert(tables.globals)
        .values({ id: 0, lastXpPurge: now.getTime() })
        .onDuplicateKeyUpdate({ set: { lastXpPurge: now.getTime() } });
}

updateXpAmounts();

setTimeout(
    () => {
        updateXpAmounts();
        setInterval(updateXpAmounts, 86400000);
    },
    86400000 - (Date.now() % 86400000),
);
