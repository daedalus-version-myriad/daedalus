export type LimitKey =
    | "supporterAnnouncementsCount"
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

export type FlagKey = "customizeXpBackgrounds" | "multiModmail" | "multiTickets" | "customizeTicketOpenMessage";

export type PremiumBenefits = Record<FlagKey, boolean> & Record<`${LimitKey}Limit`, number>;

export enum PremiumTier {
    FREE = 0,
    PREMIUM,
}

export const premiumBenefits: Record<PremiumTier, PremiumBenefits> = {
    [PremiumTier.FREE]: {
        customizeXpBackgrounds: false,
        multiModmail: false,
        multiTickets: false,
        customizeTicketOpenMessage: false,
        supporterAnnouncementsCountLimit: 3,
        reactionRolesCountLimit: 5,
        purgeAtOnceLimit: 100,
        automodCountLimit: 10,
        statsChannelsCountLimit: 5,
        autoresponderCountLimit: 10,
        modmailTargetCountLimit: -1,
        ticketPromptCountLimit: 3,
        ticketTargetCountLimit: -1,
        redditFeedsCountLimit: 3,
        countCountLimit: 3,
    },
    [PremiumTier.PREMIUM]: {
        customizeXpBackgrounds: true,
        multiModmail: true,
        multiTickets: true,
        customizeTicketOpenMessage: true,
        supporterAnnouncementsCountLimit: 25,
        reactionRolesCountLimit: 20,
        purgeAtOnceLimit: 2000,
        automodCountLimit: 50,
        statsChannelsCountLimit: 25,
        autoresponderCountLimit: 50,
        modmailTargetCountLimit: 5,
        ticketPromptCountLimit: 10,
        ticketTargetCountLimit: 10,
        redditFeedsCountLimit: 10,
        countCountLimit: 10,
    },
};

export const benefitList: [string, boolean | number, boolean | number][] = (
    [
        ["customizeXpBackgrounds", "Customize XP Card Backgrounds"],
        ["multiModmail", "Multi-Target Modmail"],
        ["multiTickets", "Multi-Target Tickets"],
        ["customizeTicketOpenMessage", "Custom Ticket On-Open Message"],
        ["supporterAnnouncementsCountLimit", "Supporter Announcements"],
        ["reactionRolesCountLimit", "Reaction Roles"],
        ["purgeAtOnceLimit", "/purge Message Count Limit"],
        ["automodCountLimit", "Automod Rules"],
        ["statsChannelsCountLimit", "Stats Channels"],
        ["autoresponderCountLimit", "Autoresponder Triggers"],
        ["modmailTargetCountLimit", "Modmail Targets"],
        ["ticketPromptCountLimit", "Ticket Prompts"],
        ["ticketTargetCountLimit", "Ticket Targets (Per Prompt)"],
        ["redditFeedsCountLimit", "Reddit Feeds"],
        ["countCountLimit", "Count-Up Channels"],
    ] as [keyof PremiumBenefits, string][]
).map(([key, title]) => [title, premiumBenefits[PremiumTier.FREE][key], premiumBenefits[PremiumTier.PREMIUM][key]]);
