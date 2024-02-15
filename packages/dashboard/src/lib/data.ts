import { moduleIcons } from "@/app/manage/[id]/modules-permissions/icons";
import { CLIENT_ID } from "@daedalus/config/public";
import data from "@emoji-mart/data";
import {
    FaBullhorn,
    FaComments,
    FaCrown,
    FaFolder,
    FaFolderTree,
    FaGear,
    FaHashtag,
    FaImages,
    FaPodcast,
    FaScrewdriverWrench,
    FaVolumeHigh,
} from "react-icons/fa6";
import { IconType } from "react-icons/lib";

export const INVITE_LINK = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=1428010036470&scope=applications.commands+bot`;

export const textTypes = [0, 2, 5, 13, 15, 16];

export const channelIcons: Record<number, IconType> = {
    0: FaHashtag,
    2: FaVolumeHigh,
    4: FaFolder,
    5: FaBullhorn,
    13: FaPodcast,
    14: FaFolderTree,
    15: FaComments,
    16: FaImages,
};

export const manageGuildCategories: [string, IconType, string][] = [
    ["", FaGear, "Guild Settings"],
    ["/premium", FaCrown, "Premium"],
    ["/modules-permissions", FaScrewdriverWrench, "Modules & Permissions"],
    ["/logging", moduleIcons.logging, "Logging"],
    ["/welcome", moduleIcons.welcome, "Welcome"],
    ["/supporter-announcements", moduleIcons["supporter-announcements"], "Supporter Announcements"],
    ["/xp", moduleIcons.xp, "XP"],
    ["/reaction-roles", moduleIcons["reaction-roles"], "Reaction Roles"],
    ["/starboard", moduleIcons.starboard, "Starboard"],
    ["/automod", moduleIcons.automod, "Automod"],
    ["/sticky-roles", moduleIcons["sticky-roles"], "Sticky Roles"],
    ["/autoroles", moduleIcons.autoroles, "Autoroles"],
    ["/custom-roles", moduleIcons["custom-roles"], "Custom Roles"],
    ["/stats-channels", moduleIcons["stats-channels"], "Stats Channels"],
    ["/autoresponder", moduleIcons.autoresponder, "Autoresponder"],
    ["/modmail", moduleIcons.modmail, "Modmail"],
    ["/tickets", moduleIcons.tickets, "Tickets"],
    ["/nukeguard", moduleIcons.nukeguard, "Nukeguard"],
];

export const manageAccountCategories: [string, IconType, string][] = [
    ["", FaGear, "Account Settings"],
    ["/premium", FaCrown, "Premium"],
];

export const emojiList: string[] = (data as any).categories.flatMap(({ emojis }: { emojis: string[] }) => emojis);
export const nameMap: Record<string, string> = Object.fromEntries(Object.values((data as any).emojis).map((emoji: any) => [emoji.skins[0].native, emoji.name]));
