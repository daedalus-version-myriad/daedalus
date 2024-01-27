import { useGuildContext } from "@/context/guild";
import { DashboardGuild } from "@daedalus/types";

export function useChannelMap() {
    const guild = useGuildContext();
    if (!guild) return null;

    return Object.fromEntries(guild.channels.map((channel) => [channel.id, channel]));
}

type Channel = DashboardGuild["channels"][number];

export function useChannelOrder(): [Channel[], Map<string, Channel[]>, Channel[]] | null {
    const guild = useGuildContext();
    if (!guild) return null;

    const roots: Channel[] = [];
    const childrenMap = new Map<string, Channel[]>();

    for (const channel of guild.channels)
        if (channel.parent) {
            if (!childrenMap.has(channel.parent)) childrenMap.set(channel.parent, []);
            childrenMap.get(channel.parent)?.push(channel);
        } else roots.push(channel);

    for (const list of childrenMap.values()) list.sort((x, y) => x.position - y.position);
    roots.sort((x, y) => (x.type === 4 ? 1 : 0) - (y.type === 4 ? 1 : 0) || x.position - y.position);

    const output: Channel[] = [];

    const load = (channel: Channel) => {
        output.push(channel);
        childrenMap.get(channel.id)?.forEach(load);
    };

    roots.forEach(load);

    return [roots, childrenMap, output];
}
