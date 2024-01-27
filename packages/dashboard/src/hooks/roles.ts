import { useGuildContext } from "@/context/guild";

export function useRoleMap() {
    const guild = useGuildContext();
    if (!guild) return null;

    return Object.fromEntries(guild.roles.map((role) => [role.id, role]));
}
