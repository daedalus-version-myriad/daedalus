import { useGuildContext } from "@/context/guild";

export function useEmojisMap() {
    const guild = useGuildContext();
    if (!guild) return null;

    return Object.fromEntries(guild.emojis.map((emoji) => [emoji.id, emoji]));
}
