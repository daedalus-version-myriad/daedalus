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
        xpBonusChannelCountLimit: 10,
        xpBonusRoleCountLimit: 5,
        xpRewardCountLimit: 10,
        reactionRolesCountLimit: 10,
        purgeAtOnceLimit: 100,
        automodCountLimit: 10,
        statsChannelsCountLimit: 5,
        autoresponderCountLimit: 10,
        modmailTargetCountLimit: 1,
        ticketPromptCountLimit: 3,
        ticketTargetCountLimit: 1,
        redditFeedsCountLimit: 3,
        countCountLimit: 3,
    },
    [PremiumTier.PREMIUM]: {
        customizeXpBackgrounds: true,
        multiModmail: true,
        multiTickets: true,
        customizeTicketOpenMessage: true,
        supporterAnnouncementsCountLimit: 25,
        xpBonusChannelCountLimit: 200,
        xpBonusRoleCountLimit: 200,
        xpRewardCountLimit: 200,
        reactionRolesCountLimit: 50,
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
