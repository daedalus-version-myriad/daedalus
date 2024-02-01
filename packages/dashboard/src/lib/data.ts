import { moduleIcons } from "@/app/manage/[id]/modules-permissions/icons";
import { CLIENT_ID } from "@daedalus/config/public";
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
];

export const manageAccountCategories: [string, IconType, string][] = [
    ["", FaGear, "Account Settings"],
    ["/premium", FaCrown, "Premium"],
];
