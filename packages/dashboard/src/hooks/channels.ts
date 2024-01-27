import { useGuildContext } from "@/context/guild";

export function useChannelMap() {
    const guild = useGuildContext();
    if (!guild) return null;

    return Object.fromEntries(guild.channels.map((channel) => [channel.id, channel]));
}
