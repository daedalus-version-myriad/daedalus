import { ChannelType } from "discord.js";

export type ModuleData = Record<
    string,
    {
        name: string;
        icon?: string;
        brand?: boolean;
        description?: string;
        commands?: Record<
            string,
            {
                name: string;
                icon?: string;
                brand?: boolean;
                description?: string;
                ghost?: boolean;
                bypass?: boolean;
                admin?: boolean;
                permissions?: string[];
                selfPermissions?: string[];
                default?: boolean;
                syntaxes: [string, string][];
            }
        >;
        selfPermissions?: string[];
        default?: boolean;
    }
>;

export type LimitKey =
    | "supporterAnnouncementsCount"
    | "xpBonusChannelCount"
    | "xpBonusRoleCount"
    | "xpRewardCount"
    | "reactionRolesCount"
    | "purgeAtOnce"
    | "automodCount"
    | "statsChannelsCount"
    | "autoresponderCount"
    | "modmailTargetCount"
    | "ticketPromptCount"
    | "ticketTargetCount"
    | "redditFeedsCount"
    | "countCount";

export type PremiumBenefits = {
    name: string;
    vanityClient: boolean;
    customizeXpBackgrounds: boolean;
    multiModmail: boolean;
    multiTickets: boolean;
    customizeTicketOpenMessage: boolean;
} & Record<`${LimitKey}Limit`, number>;

export type IField = { name: string; value: string; inline: boolean };

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

export type FEIEmbed = Omit<IEmbed, "color" | "fields"> & { color: string; fields: (IField & { _meta?: any })[]; _meta?: any };

export type CustomMessageComponent = [string, ...(string | number | CustomMessageComponent)[]];
export type CustomMessageText = (string | CustomMessageComponent)[];

export type MessageData = {
    content: string;
    embeds: IEmbed[];
    parsed: {
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
};

export type FEMessageData = {
    content: string;
    embeds: FEIEmbed[];
};

export type TFRole = {
    id: string;
    name: string;
    color: number;
    everyone?: boolean;
    managed?: boolean;
    higher?: boolean;
};

export type TFChannel = {
    id: string;
    type: ChannelType;
    position: number;
    name: string;
    parent?: string;
    readonly?: boolean;
    children?: TFChannel[];
};

export type TFEmoji = {
    id: string;
    name: string;
    url: string;
};

export type TFSticker = {
    id: string;
    name: string;
    url: string;
};

export type TFSound = {
    id: string;
    name: string;
    url: string;
};

export type DbGlobals = {
    lastXpPurge?: number;
    currencies?: Record<string, number>;
};

export type DbTask = {
    guild: string | null;
    time: number;
} & (
    | { action: "unban"; user: string }
    | { action: "unmute"; user: string }
    | { action: "modmail/close"; guild: string; channel: string; author: string; notify: boolean; message: string }
    | { action: "remind"; id: number; user: string; query: string | null; origin: string }
);

export type DbSettings = {
    dashboardPermissions: "owner" | "admin" | "manager";
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

export type DbModulesPermissionsSettings = {
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

export type DbLoggingSettings = {
    useWebhook: boolean;
    defaultChannel: string | null;
    defaultWebhook: string;
    ignoredChannels: string[];
    filesOnly: boolean;
    categories: Record<
        string,
        {
            enabled: boolean;
            useWebhook: boolean;
            outputChannel: string | null;
            outputWebhook: string;
            events: Record<
                string,
                {
                    enabled: boolean;
                    useWebhook: boolean;
                    outputChannel: string | null;
                    outputWebhook: string;
                }
            >;
        }
    >;
};

export type DbWelcomeSettings = {
    channel: string | null;
    message: MessageData;
};

export type DbSupporterAnnouncementsSettings = {
    entries: {
        channel: string | null;
        boosts: boolean;
        role: string | null;
        message: MessageData;
    }[];
};

export type DbXpSettings = {
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

export type DbReactionRolesSettings = {
    entries: {
        id: number;
        name: string;
        addReactionsToExistingMessage: boolean;
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

export type DbStarboardSettings = {
    detectEmoji: string | null;
    defaultChannel: string | null;
    defaultThreshold: number | null;
    channels: Record<
        string,
        {
            disable: boolean;
            overrideChannel: string | null;
            overrideThreshold: number | null;
        }
    >;
};

export type DbAutomodSettings = {
    ignoredChannels: string[];
    ignoredRoles: string[];
    defaultChannel: string | null;
    interactWithWebhooks: boolean;
    rules: {
        id: number;
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

export type DbStickyRolesSettings = {
    exclude: string[];
};

export type DbAutorolesSettings = {
    roles: string[];
};

export type DbCustomRolesSettings = {
    allowBoosters: boolean;
    allowedRoles: string[];
    anchor: string | null;
};

export type DbStatsChannelsSettings = {
    channels: {
        channel: string | null;
        format: string;
        parsed: CustomMessageText;
    }[];
};

export type DbAutoresponderSettings = {
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
        replyMode: "normal" | "reply" | "ping-reply";
        reaction: string | null;
        message: MessageData;
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

export type DbModmailSettings = {
    multi: boolean;
    snippets: { name: string; content: string; parsed: CustomMessageText }[];
    targets: {
        id: number;
        name: string;
        description: string;
        emoji: string | null;
        logChannel: string | null;
        category: string | null;
        pingRoles: string[];
        pingHere: boolean;
        useThreads: boolean;
        accessRoles: string[];
        openMessage: string;
        closeMessage: string;
        openMessageParsed: CustomMessageText;
        closeMessageParsed: CustomMessageText;
    }[];
};

export type DbTicketsSettings = {
    prompts: {
        id: number;
        name: string;
        channel: string | null;
        message: string | null;
        prompt: MessageData;
        multi: boolean;
        targets: {
            id: number;
            name: string;
            description: string;
            logChannel: string | null;
            category: string | null;
            accessRoles: string[];
            buttonColor: "gray" | "blue" | "green" | "red";
            emoji: string | null;
            label: string;
            pingRoles: string[];
            pingHere: boolean;
            postCustomOpenMessage: boolean;
            customOpenMessage: MessageData;
        }[];
        error: string | null;
    }[];
};

export type DbNukeguardSettings = {
    alertChannel: string | null;
    pingRoles: string[];
    pingHere: boolean;
    exemptedRoles: string[];
    watchChannelsByDefault: boolean;
    ignoredChannels: string[];
    watchedChannels: string[];
    watchRolesByDefault: boolean;
    ignoredRoles: string[];
    watchedRoles: string[];
    watchEmojiByDefault: boolean;
    ignoredEmoji: string[];
    watchedEmoji: string[];
    watchStickersByDefault: boolean;
    ignoredStickers: string[];
    watchedStickers: string[];
    watchSoundsByDefault: boolean;
    ignoredSounds: string[];
    watchedSounds: string[];
    preventWebhookCreation: boolean;
    watchWebhookDeletion: boolean;
    ratelimitEnabled: boolean;
    ratelimitKicks: boolean;
    threshold: number | null;
    timeInSeconds: number | null;
    restrictRolesLenientMode: boolean;
    restrictRolesBlockByDefault: boolean;
    restrictRolesAllowedRoles: string[];
    restrictRolesBlockedRoles: string[];
};

export type DbSuggestionsSettings = {
    outputChannel: string | null;
    anonymous: boolean;
};

export type DbCoOpSettings = {
    worldLevelRoles: (string | null)[];
    regionRoles: (string | null)[];
    helperRoles: (string | null)[];
};

export type DbRedditFeedsSettings = {
    feeds: {
        subreddit: string;
        channel: string | null;
    }[];
};

export type DbCountSettings = {
    channels: {
        id: number;
        channel: string | null;
        interval: number;
        next: number;
        allowDoubleCounting: boolean;
    }[];
};

type Giveaway = {
    channel: string | null;
    message: MessageData;
    requiredRoles: string[];
    requiredRolesAll: boolean;
    blockedRoles: string[];
    blockedRolesAll: boolean;
    bypassRoles: string[];
    bypassRolesAll: boolean;
    stackWeights: boolean;
    weights: { role: string | null; weight: number }[];
    winners: number;
    allowRepeatWinners: boolean;
};

export type DbGiveawaysSettings = {
    template: Giveaway;
    giveaways: (Giveaway & {
        id: number;
        name: string;
        deadline: number;
        messageId: string | null;
        error: string | null;
        closed: boolean;
    })[];
};

export type DbReportsSettings = {
    outputChannel: string | null;
    anonymous: boolean;
    pingRoles: string[];
    viewRoles: string[];
};

export type DbUtilitySettings = {
    blockRolesByDefault: boolean;
    allowedRoles: string[];
    blockedRoles: string[];
    bypassRoles: string[];
};

export type DDLGuild = {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
    hasBot?: boolean;
    features: string[];
    notIn?: boolean;
};

export type DbXpAmounts = {
    guild: string;
    user: string;
    daily: { text: number; voice: number };
    weekly: { text: number; voice: number };
    monthly: { text: number; voice: number };
    total: { text: number; voice: number };
};

export type DbUserHistory = {
    guild: string;
    user: string;
    id: number;
    type: "ban" | "kick" | "timeout" | "mute" | "informal_warn" | "warn" | "bulk";
    mod: string;
    time: number;
    duration?: number;
    origin?: string;
    reason: string | null;
};

export type DBModmailMessage = { time: number } & (
    | { type: "open"; author: string; targetName: string | null }
    | { type: "incoming"; content: string; attachments: { name: string; url: string }[] }
    | { type: "internal"; id: string | null; author: string; content: string; attachments: { name: string; url: string }[]; edits?: string[]; deleted: boolean }
    | {
          type: "outgoing";
          source: number;
          message: string;
          author: string;
          anon: boolean;
          content: string;
          attachments: { name: string; url: string }[];
          edits?: string[];
          deleted: boolean;
      }
    | { type: "close"; author: string; content: string; sent: boolean }
);

export type DbModmailThread = {
    guild: string;
    user: string;
    id: number;
    uuid: string;
    channel: string;
    closed: boolean;
    messages: DBModmailMessage[];
};

export type DbTicketMessage = { time: number } & (
    | { type: "open" }
    | { type: "message"; id: string | null; author: string; content: string; attachments: { name: string; url: string }[]; edits?: string[]; deleted?: boolean }
    | { type: "close"; author: string }
);

export type DBTicket = {
    guild: string;
    user: string;
    prompt: number;
    target: number;
    uuid: string;
    closed: boolean;
    channel: string;
    created: number;
    messages: DbTicketMessage[];
};

export type DBPoll = { question: string } & (
    | { type: "yes-no"; allowNeutral: boolean; votes: Record<string, string> }
    | { type: "binary"; leftOption: string; rightOption: string; allowNeutral: boolean; votes: Record<string, string> }
    | { type: "multi"; options: string[]; allowMulti: boolean; votes: Record<string, string[]> }
);

export type DBAccountSettings = {
    notifyWhenOwnedServerPremiumStatusChanges: boolean;
    notifyWhenManagedServerPremiumStatusChanges: boolean;
    suppressAdminBroadcasts: boolean;
};
