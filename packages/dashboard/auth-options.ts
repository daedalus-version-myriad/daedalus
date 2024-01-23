import { secrets } from "@daedalus/config";
import { AuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export default {
    providers: [
        DiscordProvider({
            clientId: secrets.DISCORD.CLIENT.ID,
            clientSecret: secrets.DISCORD.CLIENT.SECRET,
            authorization: { params: { scope: "identify" } },
        }),
    ],
    secret: secrets.NEXT_AUTH_SECRET,
} satisfies AuthOptions;
