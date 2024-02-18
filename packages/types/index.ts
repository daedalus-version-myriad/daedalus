import type { Guild, GuildMember, Role, User } from "discord.js";

export type IField = {
    name: string;
    value: string;
    inline: boolean;
};

export type IEmbed = {
    colorMode: "guild" | "member" | "user" | "fixed";
    color: number;
    author: { name: string; iconURL: string; url: string };
    title: string;
    description: string;
    url: string;
    fields: IField[];
    image: { url: string };
    thumbnail: { url: string };
    footer: { text: string; iconURL: string };
    showTimestamp: boolean;
};

export type CustomMessageContext = { member?: GuildMember | null; user?: User | null; role?: Role | null; guild?: Guild | null };
export type CustomMessageValue = string | number | CustomMessageValue[];
export type CustomMessageFunction = {
    arity: number | [number, number];
    apply: (ctx: CustomMessageContext, ...args: CustomMessageValue[]) => CustomMessageValue;
    fetch?: string[];
};

export type CustomMessageComponent = [string, ...any[]];
export type CustomMessageText = (string | CustomMessageComponent)[];

export type MessageData = {
    content: string;
    embeds: IEmbed[];
};

export type ParsedMessage = {
    content: CustomMessageText;
    embeds: (Pick<IEmbed, "colorMode" | "color" | "showTimestamp"> & {
        author: { name: CustomMessageText; iconURL: CustomMessageText; url: CustomMessageText };
        title: CustomMessageText;
        description: CustomMessageText;
        url: CustomMessageText;
        fields: { name: CustomMessageText; value: CustomMessageText; inline: boolean }[];
        image: { url: CustomMessageText };
        thumbnail: { url: CustomMessageText };
        footer: { text: CustomMessageText; iconURL: CustomMessageText };
    })[];
};

export type DashboardGuild = {
    id: string;
    name: string;
    owner: boolean;
    roles: {
        id: string;
        name: string;
        color: number;
        everyone: boolean;
        managed: boolean;
        higher: boolean;
        position: number;
    }[];
    channels: {
        id: string;
        type: number;
        position: number;
        name: string;
        parent: string | null;
        readonly: boolean;
    }[];
    emojis: {
        id: string;
        name: string;
        url: string;
    }[];
    stickers: {
        id: string;
        name: string;
        url: string;
    }[];
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

export type GuildPremiumSettings = {
    guild: string;
    keys: { key: string; disabled: boolean | null }[];
    hasPremium: boolean;
    hasCustom: boolean;
    usingCustom: boolean;
    tag: string | null;
    status: "online" | "idle" | "dnd" | "invisible";
    activityType: "none" | "playing" | "listening-to" | "watching" | "competing-in";
    activity: string;
};

export type GuildModulesPermissionsSettings = {
    guild: string;
    modules: Record<string, { enabled: boolean }>;
    commands: Record<
        string,
        {
            enabled: boolean;
            ignoreDefaultPermissions: boolean;
            allowedRoles: string[];
            blockedRoles: string[];
            restrictChannels: boolean;
            allowedChannels: string[];
            blockedChannels: string[];
        }
    >;
};

type BaseLogSettings = {
    useWebhook: boolean;
    channel: string | null;
    webhook: string;
};

export type GuildLoggingSettings = {
    guild: string;
    enableWebLogging: boolean;
} & BaseLogSettings & {
        ignoredChannels: string[];
        fileOnlyMode: boolean;
        items: Record<string, { enabled: boolean } & BaseLogSettings>;
    };

export type GuildWelcomeSettings = {
    guild: string;
    channel: string | null;
    message: MessageData;
};

export type GuildSupporterAnnouncementsSettings = {
    guild: string;
    announcements: {
        useBoosts: boolean;
        role: string | null;
        channel: string | null;
        message: MessageData;
    }[];
};

export type GuildXpSettings = {
    guild: string;
    blockedChannels: string[];
    blockedRoles: string[];
    bonusChannels: { channel: string | null; multiplier: number | null }[];
    bonusRoles: { role: string | null; multiplier: number | null }[];
    rankCardBackground: string;
    announceLevelUp: boolean;
    announceInChannel: boolean;
    announceChannel: string | null;
    announcementBackground: string;
    rewards: { text: number | null; voice: number | null; role: string | null; removeOnHigher: boolean; dmOnReward: boolean }[];
};

export type GuildReactionRolesSettings = {
    guild: string;
    prompts: {
        id: number;
        name: string;
        addToExisting: boolean;
        channel: string | null;
        message: string | null;
        url: string;
        style: "dropdown" | "buttons" | "reactions";
        type: "normal" | "unique" | "verify" | "lock";
        dropdownData: { emoji: string | null; role: string | null; label: string; description: string }[];
        buttonData: { emoji: string | null; role: string | null; color: "gray" | "blue" | "green" | "red"; label: string }[][];
        reactionData: { emoji: string | null; role: string | null }[];
        promptMessage: MessageData;
        error: string | null;
    }[];
};

export type GuildStarboardSettings = {
    guild: string;
    reaction: string | null;
    channel: string | null;
    threshold: number;
    overrides: {
        channel: string | null;
        enabled: boolean;
        target: string | null;
        threshold: number | null;
    }[];
};

export type GuildAutomodSettings = {
    guild: string;
    ignoredChannels: string[];
    ignoredRoles: string[];
    defaultChannel: string | null;
    interactWithWebhooks: boolean;
    rules: {
        enable: boolean;
        name: string;
        type:
            | "blocked-terms"
            | "blocked-stickers"
            | "caps-spam"
            | "newline-spam"
            | "repeated-characters"
            | "length-limit"
            | "emoji-spam"
            | "ratelimit"
            | "attachment-spam"
            | "sticker-spam"
            | "link-spam"
            | "invite-links"
            | "link-blocklist"
            | "mention-spam";
        blockedTermsData: { terms: string[] };
        blockedStickersData: { ids: string[] };
        capsSpamData: { ratioLimit: number; limit: number };
        newlineSpamData: { consecutiveLimit: number; totalLimit: number };
        repeatedCharactersData: { consecutiveLimit: number };
        lengthLimitData: { limit: number };
        emojiSpamData: { limit: number; blockAnimatedEmoji: boolean };
        ratelimitData: { threshold: number; timeInSeconds: number };
        attachmentSpamData: { threshold: number; timeInSeconds: number };
        stickerSpamData: { threshold: number; timeInSeconds: number };
        linkSpamData: { threshold: number; timeInSeconds: number };
        inviteLinksData: { blockUnknown: boolean; allowed: string[]; blocked: string[] };
        linkBlocklistData: { websites: string[] };
        mentionSpamData: { perMessageLimit: number; totalLimit: number; timeInSeconds: number; blockFailedEveryoneOrHere: boolean };
        reportToChannel: boolean;
        deleteMessage: boolean;
        notifyAuthor: boolean;
        reportChannel: string | null;
        additionalAction: "nothing" | "warn" | "mute" | "timeout" | "kick" | "ban";
        actionDuration: number;
        disregardDefaultIgnoredChannels: boolean;
        disregardDefaultIgnoredRoles: boolean;
        onlyWatchEnabledChannels: boolean;
        onlyWatchEnabledRoles: boolean;
        ignoredChannels: string[];
        ignoredRoles: string[];
        watchedChannels: string[];
        watchedRoles: string[];
    }[];
};

export type GuildAutokickSettings = {
    guild: string;
    minimumAge: number;
    sendMessage: boolean;
    message: MessageData;
    parsed: ParsedMessage;
};

export type GuildStickyRolesSettings = {
    guild: string;
    roles: string[];
};

export type GuildAutorolesSettings = {
    guild: string;
    roles: string[];
};

export type GuildCustomRolesSettings = {
    guild: string;
    allowBoosters: boolean;
    roles: string[];
    anchor: string | null;
};

export type GuildStatsChannelsSettings = {
    guild: string;
    channels: {
        channel: string | null;
        format: string;
    }[];
};

export type GuildAutoresponderSettings = {
    guild: string;
    onlyInAllowedChannels: boolean;
    onlyToAllowedRoles: boolean;
    allowedChannels: string[];
    allowedRoles: string[];
    blockedChannels: string[];
    blockedRoles: string[];
    triggers: {
        enabled: boolean;
        match: string;
        wildcard: boolean;
        caseInsensitive: boolean;
        respondToBotsAndWebhooks: boolean;
        replyMode: "none" | "normal" | "reply" | "ping-reply";
        reaction: string | null;
        message: MessageData;
        parsed: ParsedMessage;
        bypassDefaultChannelSettings: boolean;
        bypassDefaultRoleSettings: boolean;
        onlyInAllowedChannels: boolean;
        onlyToAllowedRoles: boolean;
        allowedChannels: string[];
        allowedRoles: string[];
        blockedChannels: string[];
        blockedRoles: string[];
    }[];
};

export type GuildModmailSettings = {
    guild: string;
    useMulti: boolean;
    targets: {
        id: number;
        name: string;
        description: string;
        emoji: string | null;
        useThreads: boolean;
        channel: string | null;
        category: string | null;
        pingRoles: string[];
        pingHere: boolean;
        accessRoles: string[];
        openMessage: string;
        closeMessage: string;
        openParsed: CustomMessageText;
        closeParsed: CustomMessageText;
    }[];
    snippets: {
        name: string;
        content: string;
        parsed: CustomMessageText;
    }[];
};

export type GuildTicketsSettings = {
    guild: string;
    prompts: {
        id: number;
        name: string;
        channel: string | null;
        message: string | null;
        prompt: MessageData;
        useMulti: boolean;
        error: string | null;
        targets: {
            id: number;
            name: string;
            channel: string | null;
            category: string | null;
            buttonLabel: string;
            buttonColor: "gray" | "blue" | "green" | "red";
            dropdownLabel: string;
            dropdownDescription: string;
            emoji: string | null;
            pingRoles: string[];
            pingHere: boolean;
            accessRoles: string[];
            postCustomOpenMessage: boolean;
            customOpenMessage: MessageData;
            customOpenParsed: ParsedMessage;
        }[];
    }[];
};

export type GuildNukeguardSettings = {
    guild: string;
    adminChannel: string | null;
    pingRoles: string[];
    pingHere: boolean;
    exemptedRoles: string[];
    watchChannelsByDefault: boolean;
    ignoredChannels: string[];
    watchedChannels: string[];
    watchRolesByDefault: boolean;
    ignoredRoles: string[];
    watchedRoles: string[];
    watchEmoji: boolean;
    watchStickers: boolean;
    watchSounds: boolean;
    preventWebhookCreation: boolean;
    watchWebhookDeletion: boolean;
    enableRatelimit: boolean;
    ratelimitKicking: boolean;
    ratelimitThreshold: number | null;
    ratelimitTime: number | null;
    restrictRolesLenient: boolean;
    restrictRolesByDefault: boolean;
    restrictRolesAllowedRoles: string[];
    restrictRolesBlockedRoles: string[];
};

export type GuildSuggestionsSettings = {
    guild: string;
    channel: string | null;
    anon: boolean;
};

export type GuildCoOpSettings = {
    guild: string;
} & Record<`wl${"0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8"}` | `${"region" | "helper"}${"NA" | "EU" | "AS" | "SA"}`, string | null>;

export type GuildRedditFeedsSettings = {
    guild: string;
    feeds: {
        subreddit: string;
        channel: string | null;
    }[];
};

export type GuildCountSettings<T extends boolean = false> = {
    guild: string;
    channels: {
        id: number;
        channel: T extends false ? string : string | null;
        interval: number;
        next: number;
        allowDoubleCounting: boolean;
    }[];
};

export type GiveawayBase = {
    channel: string | null;
    message: MessageData;
    stackWeights: boolean;
    weights: { role: string | null; weight: number }[];
    winners: number;
    allowRepeatWinners: boolean;
} & Record<`${"required" | "blocked" | "bypass"}Roles`, string[]> &
    Record<`${"required" | "blocked" | "bypass"}RolesAll`, boolean>;

export type GuildGiveawaySettings = {
    guild: string;
    template: GiveawayBase;
    giveaways: (GiveawayBase & {
        id: number;
        name: string;
        deadline: number;
        messageId: string | null;
        error: string | null;
        closed: boolean;
    })[];
};

export type GuildReportsSettings = {
    guild: string;
    channel: string | null;
    pingRoles: string[];
    anon: boolean;
    viewRoles: string[];
};

export type GuildUtilitySettings = {
    guild: string;
    roleCommandBlockByDefault: boolean;
    roleCommandBlockedRoles: string[];
    roleCommandAllowedRoles: string[];
    roleCommandBypassRoles: string[];
};

export type PremiumStripeSession = {
    subscriptions: {
        created: number;
        product: string;
        quantity: number;
        type: "premium" | "custom";
    }[];
    url: string;
};

export type AccountSettings = {
    notifyPremiumOwnedServers: boolean;
    notifyPremiumManagedServers: boolean;
};

export type Poll = {
    type: "yes-no" | "binary" | "multi";
    question: string;
    allowNeutral: boolean;
    allowMulti: boolean;
    leftOption: string;
    rightOption: string;
    options: string[];
};
