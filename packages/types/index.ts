export type DashboardGuild = {
    id: string;
    name: string;
    owner: boolean;
    roles: { id: string; name: string; color: number; everyone: boolean; managed: boolean; higher: boolean; position: number }[];
    channels: { id: string; type: number; position: number; name: string; parent: string | null; readonly: boolean }[];
    emojis: { id: string; name: string; url: string }[];
    stickers: { id: string; name: string; url: string }[];
};

export type GuildSettings = {
    guild: string;
    dashboardPermission: "owner" | "admin" | "manager";
    embedColor: number;
    muteRole: string | null;
    banFooter: string;
    modOnly: boolean;
    allowedRoles: string[];
    blockedRoles: string[];
    allowlistOnly: boolean;
    allowedChannels: string[];
    blockedChannels: string[];
};
