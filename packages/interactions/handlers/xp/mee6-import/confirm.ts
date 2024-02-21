import { Colors, type ButtonInteraction } from "discord.js";
import { trpc } from "../../../../api/index.js";
import { embed, getColor, template } from "../../../../bot-utils/index.js";

export default async function (button: ButtonInteraction, mode: string) {
    await button.update(embed("Importing XP from MEE6...", "This may take a while; please be patient.", Colors.Gold));

    const data: { id: string; xp: number }[] = [];

    for (let page = 0; ; page++) {
        const request = await fetch(`https://mee6.xyz/api/plugins/levels/leaderboard/${button.guild!.id}?limit=1000&page=${page}`);

        if (!request.ok)
            return void (await button.editReply(template.error("An error occurred. Make sure MEE6 is in your server and your leaderboard is set to public.")));

        const list = ((await request.json()) as { players: { id: string; detailed_xp: number[] }[] }).players;
        for (const user of list) data.push({ id: user.id, xp: user.detailed_xp[2] });

        if (list.length < 1000) break;
    }

    await trpc.importXp.mutate({ guild: button.guild!.id, entries: data, mode });

    await button.editReply(
        embed(
            "Imported MEE6 XP",
            "MEE6 XP has been successfully imported. Your daily/weekly/monthly leaderboards may not be accurate as incoming XP was not added to the timed leaderboards.",
            await getColor(button.guild!),
        ),
    );
}
