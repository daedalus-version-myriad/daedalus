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

export const logCategories: Record<string, string> = {
    server: "Server Change Logs",
    mod: "Mod Action Logs",
    join_leave: "Join/Leave Logs",
    member: "Member Change Logs",
    invite: "Invite Logs",
    message: "Message Logs",
    reaction: "Reaction Logs",
    voice: "Voice Logs",
    debug: "Debug Logs",
};

export const logEvents: Record<string, { name: string; category: string }> = {
    guildUpdate: { name: "Server Updated", category: "server" },
    channelCreate: { name: "Channel Created", category: "server" },
    channelDelete: { name: "Channel Deleted", category: "server" },
    channelUpdate: { name: "Channel Updated", category: "server" },
    emojiCreate: { name: "Emoji Created", category: "server" },
    emojiDelete: { name: "Emoji Deleted", category: "server" },
    emojiUpdate: { name: "Emoji Updated", category: "server" },
    guildScheduledEventCreate: { name: "Event Created", category: "server" },
    guildScheduledEventDelete: { name: "Event Deleted", category: "server" },
    guildScheduledEventUpdate: { name: "Event Updated", category: "server" },
    roleCreate: { name: "Role Created", category: "server" },
    roleDelete: { name: "Role Deleted", category: "server" },
    roleUpdate: { name: "Role Updated", category: "server" },
    stickerCreate: { name: "Sticker Created", category: "server" },
    stickerDelete: { name: "Sticker Deleted", category: "server" },
    stickerUpdate: { name: "Sticker Updated", category: "server" },
    threadCreate: { name: "Thread Created", category: "server" },
    threadDelete: { name: "Thread Deleted", category: "server" },
    threadUpdate: { name: "Thread Updated", category: "server" },
    guildBanAdd: { name: "Ban", category: "mod" },
    guildBanRemove: { name: "Unban", category: "mod" },
    guildMemberKick: { name: "Kick", category: "mod" },
    guildMemberTimeout: { name: "Timeout", category: "mod" },
    guildMemberTimeoutRemove: { name: "Timeout Removed", category: "mod" },
    guildMemberMute: { name: "Muted", category: "mod" },
    guildMemberUnmute: { name: "Unmuted", category: "mod" },
    guildMemberAdd: { name: "Member Joined", category: "join_leave" },
    guildMemberRemove: { name: "Member Left", category: "join_leave" },
    guildMemberUpdateRoles: { name: "Member Role Update", category: "member" },
    guildMemberUpdateName: { name: "Member Name Update", category: "member" },
    guildMemberUpdateAvatar: { name: "Member Avatar Update", category: "member" },
    inviteCreate: { name: "Invite Created", category: "invite" },
    inviteDelete: { name: "Invite Deleted", category: "invite" },
    messageDelete: { name: "Message Deleted", category: "message" },
    messageDeleteBulk: { name: "Messages Purged", category: "message" },
    messageUpdate: { name: "Message Edited", category: "message" },
    messageReactionAdd: { name: "Reaction Added", category: "reaction" },
    messageReactionRemove: { name: "Reaction Removed", category: "reaction" },
    voiceJoin: { name: "Voice Join", category: "voice" },
    voiceMove: { name: "Voice Move", category: "voice" },
    voiceLeave: { name: "Voice Leave", category: "voice" },
    voiceStateUpdate: { name: "Voice State Change", category: "voice" },
    interactionCreate: { name: "Command Invoked", category: "debug" },
    botError: { name: "Bot Error", category: "debug" },
};

export const categoryToEventMap: Record<string, string[]> = Object.fromEntries(Object.keys(logCategories).map((key) => [key, []]));
for (const [event, { category }] of Object.entries(logEvents)) categoryToEventMap[category].push(event);

export const archiveDurations = {
    0: "Default (3 days)",
    60: "1 hour",
    1440: "1 day",
    4320: "3 days",
    10080: "7 days",
};

type ModuleData = Record<
    string,
    {
        name: string;
        description?: string;
        commands?: Record<
            string,
            {
                name: string;
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

export const modules: ModuleData = {
    logging: {
        name: "Logging",
        description: "Log events/changes in your server.",
    },
    welcome: {
        name: "Welcome",
        description: "Welcome incoming members to the server.",
    },
    "supporter-announcements": {
        name: "Supporter Announcements",
        description: "Announce new boosters and other server supporters by role.",
    },
    xp: {
        name: "XP",
        description: "Server experience system to reward active members.",
        commands: {
            top: {
                name: "Top",
                description: "Get top users by XP.",
                ghost: true,
                syntaxes: [
                    [
                        "/top [type] [range] [page]",
                        `<p>Fetch the top users in the server by XP.</p>
                        <ul class="list-disc ml-4">
                            <li>Set <b>type</b> to only view the text or voice leaderboard (by default, both are shown).</li>
                            <li>Set <b>range</b> to view the daily, weekly, or monthly leaderboard (by default, shows the all-time leaderboard).</li>
                            <li>Set <b>page</b> to view other pages in the leaderboard.</li>
                        </ul>`,
                    ],
                ],
            },
            rank: {
                name: "Rank",
                description: "Get a user's XP and rank.",
                ghost: true,
                syntaxes: [["/rank [user]", `<p>Show a user's rank card, including their text and voice XP, level, and rank.</p>`]],
            },
            xp: {
                name: "Manage XP",
                description: "Manage the server's XP, including importing or fully resetting XP.",
                permissions: ["ManageGuild"],
                syntaxes: [
                    ["/xp mee6-import", `<p>Start the process for importing XP from MEE6.</p>`],
                    ["/xp reset <user>", `<p>Reset a user's XP to 0.</p>`],
                ],
            },
        },
        default: false,
    },
    "reaction-roles": {
        name: "Reaction Roles",
        description: "Allow users to self-assign roles, including verification roles.",
        selfPermissions: ["ManageRoles"],
    },
    moderation: {
        name: "Moderation",
        description: "Moderation commands for managing users and content.",
        commands: {
            ban: {
                name: "Ban",
                description: "Ban a user (even if they are not in the server).",
                permissions: ["BanMembers"],
                selfPermissions: ["BanMembers"],
                syntaxes: [
                    [
                        "/ban <user> [reason] [duration] [purge] [silent] [force]",
                        `<p>Ban a user.</p>
                        <ul class="list-disc ml-4">
                            <li>The <b>reason</b> will be logged in Daedalus logs, audit logged, and sent to the user (unless silent).</li>
                            <li>Set <b>duration</b> to automatically unban the user after the specified amount of time elapses.</li>
                            <li>Set <b>purge</b> to automatically purge recent messages from the user within the specified amount of time.</li>
                            <li>Set <b>silent</b> to not notify the user that they were banned.</li>
                            <li>Set <b>force</b> if the user is already banned to unban and re-ban them (necessary for <b>purge</b> to work if you forgot to purge on the initial ban).</li>
                        </ul>`,
                    ],
                ],
            },
            kick: {
                name: "Kick",
                description: "Kick a member from the server.",
                permissions: ["KickMembers"],
                selfPermissions: ["KickMembers"],
                syntaxes: [
                    [
                        "/kick <user> [reason] [silent]",
                        `<p>Kick a member.</p>
                        <ul class="list-disc ml-4">
                            <li>The <b>reason</b> will be logged in Daedalus logs, audit logged, and sent to the user (unless silent).</li>
                            <li>Set <b>silent</b> to not notify the user that they were kicked.</li>
                        </ul>`,
                    ],
                ],
            },
            mute: {
                name: "Mute",
                description: "Mute a user by assigning them a mute role. This only works on server members unless the Sticky Roles module is enabled.",
                permissions: ["ModerateMembers"],
                selfPermissions: ["ManageRoles"],
                syntaxes: [
                    [
                        "/mute <user> [reason] [duration] [silent]",
                        `<p>Mute a user.</p>
                        <ul class="list-disc ml-4">
                            <li>The <b>reason</b> will be logged in Daedalus logs, audit logged, and sent to the user (unless silent).</li>
                            <li>Set <b>duration</b> to automatically unmute the user after the specified amount of time elapses.</li>
                            <li>Set <b>silent</b> to not notify the user that they were muted.</li>
                        </ul>`,
                    ],
                ],
            },
            timeout: {
                name: "Timeout",
                description: "Timeout a member or remove their timeout.",
                permissions: ["ModerateMembers"],
                selfPermissions: ["ModerateMembers"],
                syntaxes: [
                    [
                        "/timeout <user> [reason] [duration] [silent]",
                        `<p>Timeout a user.</p>
                        <ul class="list-disc ml-4">
                            <li>The <b>reason</b> will be logged in Daedalus logs, audit logged, and sent to the user (unless silent).</li>
                            <li>The <b>duration</b> determines for how long the user will be timed out. If excluded or set to zero, the user will have their timeout removed instead.</li>
                            <li>Set <b>silent</b> to not notify the user that they were timed out / their timeout was removed.</li>
                        </ul>`,
                    ],
                ],
            },
            warn: {
                name: "Warn",
                description: "DM a warning to a user and log it to their user history.",
                permissions: ["ModerateMembers"],
                syntaxes: [
                    [
                        "/warn <user> <reason> [informal] [silent]",
                        `<p>Warn a user.</p>
                        <ul class="list-disc ml-4">
                            <li>The <b>reason</b> will be logged in Daedalus logs and sent to the user (unless silent).</li>
                            <li>Set <b>informal</b> to modify the notification to state that it is informal and log it as informal.</li>
                            <li>Set <b>silent</b> to not notify the user of the warning. This is useful for retroactively logging direct warnings.</li>
                        </ul>`,
                    ],
                ],
            },
            unban: {
                name: "Unban",
                description: "Unban a user, allowing them to rejoin the server.",
                permissions: ["BanMembers"],
                selfPermissions: ["BanMembers"],
                syntaxes: [
                    [
                        "/unban <user> [reason]",
                        `<p>Unban a user.</p>
                        <ul class="list-disc ml-4">
                            <li>The <b>reason</b> is audit logged but not stored in Daedalus logs nor sent to the user.</li>
                        </ul>`,
                    ],
                ],
            },
            unmute: {
                name: "Unmute",
                description: "Unmute a user by removing their mute role. This only works on server members unless the Sticky Roles module is enabled.",
                permissions: ["ModerateMembers"],
                selfPermissions: ["ManageRoles"],
                syntaxes: [
                    [
                        "/unmute <user> [reason] [silent]",
                        `<p>Unmute a user.</p>
                        <ul class="list-disc ml-4">
                            <li>The <b>reason</b> is audit logged but not stored in Daedalus logs. It is also sent to the user (unless silent).</li>
                            <li>Set <b>silent</b> to not notify the user that they were unmuted.</li>
                        </ul>`,
                    ],
                ],
            },
            massban: {
                name: "Massban",
                description:
                    "Ban many users at once. In all versions of the command, the reason is logged in Daedalus logs and audit logged but not sent to any users, and the purge duration can be sent to automatically purge recent messages from the banned users within the specified time frame.",
                permissions: ["ManageGuild"],
                selfPermissions: ["BanMembers"],
                syntaxes: [
                    ["/massban file <file> [reason] [purge]", `<p>Massban a list of users from a file containing a list of IDs.</p>`],
                    ["/massban list <users> [reason] [purge]", `<p>Massban a list of users by providing a list of IDs directly.</p>`],
                    ["/massban url <url> [reason] [purge]", `<p>Massban a list of users via a URL pointing to a raw file containing a list of IDs.</p>`],
                ],
            },
            history: {
                name: "View History",
                description: "View a user's history.",
                ghost: true,
                permissions: ["ModerateMembers"],
                syntaxes: [["/history <user>", `<p>View a user's Daedalus history.</p>`]],
            },
            "delete-history": {
                name: "Delete History Entry",
                description: "Remove a single history entry.",
                permissions: ["ManageGuild"],
                syntaxes: [
                    [
                        "/delete-history <id>",
                        `<p>Delete a user history entry by ID. The IDs are shown when you take the moderation action and in <b>/history</b>.</p>`,
                    ],
                ],
            },
            "clear-history": {
                name: "Clear History",
                description: "Clear a user's history.",
                permissions: ["ManageGuild"],
                syntaxes: [["/clear-history <user>", `<p>Delete all history entriers for a user.</p>`]],
            },
            slowmode: {
                name: "Slowmode",
                description: "Set a channel's slowmode.",
                bypass: true,
                permissions: ["ManageChannels"],
                selfPermissions: ["ManageChannels"],
                syntaxes: [["/slowmode [channel] [delay]", `<p>Set <b>channel</b>'s slowmode to the specified delay (default: this channel, 0 seconds).</p>`]],
            },
            purge: {
                name: "Purge",
                description:
                    "Purge many messages at once. For both versions of the command, you may only select up to 100 (1000 with premium) messages at once. The filter allows you to specify the type of message (human vs. bot accounts) and match a certain substring.",
                permissions: ["ManageGuild"],
                selfPermissions: ["ManageMessages"],
                syntaxes: [
                    ["/purge last <count> [types] [match] [case-sensitive]", `<p>Select the last N messages and delete those that pass the filter.</p>`],
                    [
                        "/purge between <start> [end] [types] [match] [case-sensitive]",
                        `<p>Select messages inclusively between <b>start</b> and <b>end</b> (default: end of the channel) and delete those that pass the filter.</p>`,
                    ],
                ],
            },
            notes: {
                name: "Notes",
                description: "Record mod notes for a user.",
                permissions: ["ModerateMembers"],
                syntaxes: [
                    ["/notes edit <user>", `<p>Open a pop-up modal to edit a user's mod notes.</p>`],
                    ["/notes view <user>", `<p>View a user's notes.</p>`],
                ],
            },
        },
    },
    starboard: {
        name: "Starboard",
        description: "Feature messages that receive a specified reaction.",
    },
    automod: {
        name: "Automod",
        description: "Automatically scan and filter messages and edits for blocked content.",
        selfPermissions: ["ManageMessages", "ManageRoles", "ModerateMembers", "KickMembers", "BanMembers"],
    },
    autokick: {
        name: "Autokick",
        description: "Filter users by account age.",
        commands: {
            autokick: {
                name: "Manage Autokick",
                description: "Manage autokick (allow/disallow a user)",
                permissions: ["BanMembers"],
                syntaxes: [
                    ["/autokick allow <user>", `<p>Allow a user into the server, ignoring autokick settings when they join</p>`],
                    [
                        "/autokick clear <user>",
                        `<p>Clear the autokick allowance ono a user. They will be kicked if their account was created too recently, but otherwise, they will be allowed to join as usual.</p>`,
                    ],
                ],
            },
        },
        selfPermissions: ["KickMembers"],
        default: false,
    },
    "sticky-roles": {
        name: "Sticky Roles",
        description: "Automatically re-add roles to members when they rejoin the server.",
        selfPermissions: ["ManageRoles"],
        default: false,
    },
    autoroles: {
        name: "Autoroles",
        description: "Automatically add specified roles to users upon joining the server.",
        selfPermissions: ["ManageRoles"],
    },
    "custom-roles": {
        name: "Custom Roles",
        description: "Give boosters and other server supporters the ability to create custom roles.",
        commands: {
            role: {
                name: "Custom Role",
                description: "Manage the user's custom role.",
                ghost: true,
                selfPermissions: ["ManageRoles"],
                syntaxes: [
                    ["/role set [name] [color]", `<p>Modify your custom role.</p>`],
                    ["/role delete", `<p>Delete your custom role.</p>`],
                ],
            },
        },
        selfPermissions: ["ManageRoles"],
        default: false,
    },
    "stats-channels": {
        name: "Stats Channels",
        description: "Keep track of server stats with automatically updating channels.",
        selfPermissions: ["ManageChannels"],
    },
    autoresponder: {
        name: "Autoresponder",
        description: "Automatically respond to certain messages",
    },
    modmail: {
        name: "Modmail",
        description: "Allow users to contact staff via direct-messaging the bot.",
        commands: {
            modmail: {
                name: "Modmail",
                description: "Modmail operation commands.",
                permissions: ["ManageMessages"],
                syntaxes: [
                    [
                        "/modmail reply [content] [anon] [files...]",
                        `<p>Reply to a modmail thread. By default, the outgoing message shows your name, icon, and highest role, which can be disabled by setting <b>anon</b>.</p>`,
                    ],
                    [
                        "/modmail reply-modal [anon] [files...]",
                        `<p>Reply to a modmail thread just like with <b>/modmail reply</b>, but you will be prompted to set the content in a pop-up modal, allowing for multi-line messages.</p>`,
                    ],
                    [
                        "/modmail close [notify] [content] [delay]",
                        `<p>Close a modmail thread.</p>
                        <ul class="list-disc ml-4">
                            <li>Set <b>notify</b> to inform the user that the thread has been closed.</li>
                            <li>Set <b>content</b> to override the server-default close message (by default, no content is included).</li>
                            <li>Set <b>delay</b> to schedule the thread to be closed. The user will be notified immediately, and if neither party sends a message before the time window elapses, the user will be notified with the <b>content</b> if <b>notify</b> is set.
                        </ul>`,
                    ],
                    ["/modmail contact <user>", `<p>Open a modmail thread with a user from the server side.</p>`],
                    ["/modmail log-link", `<p>Get the link to the log viewer on the dashboard for the current modmail thread.</p>`],
                    ["/modmail snippet send <snippet> [anon]", `<p>Send a modmail snippet.</p>`],
                    ["/modmail snippet view <snippet>", `<p>View the content of a snippet.</p>`],
                    ["/modmail snippet use-as-template <snippet> [anon]", `<p>Use a snippet as a template and edit its content before sending.</p>`],
                    ["/modmail notify <mode>", `<p>Enable or disable notifications for the current thread for the next message or all messages.</p>`],
                    ["/modmail nsfw <nsfw>", `<p>Set the channel's NSFW status.</p>`],
                ],
            },
        },
        selfPermissions: ["CreatePublicThreads", "ManageThreads", "ManageChannels"],
        default: false,
    },
    tickets: {
        name: "Tickets",
        description: "Allow users to contact staff by creating new private channels at the press of a button.",
        commands: {
            ticket: {
                name: "Ticket",
                description: "Manage tickets.",
                syntaxes: [["/ticket close", `<p>Close a ticket channel.</p>`]],
            },
        },
        selfPermissions: ["ManageChannels"],
    },
    nukeguard: {
        name: "Nukeguard",
        description: "Anti-nuke features to guard against rogue or compromised mods/admins.",
        selfPermissions: ["BanMembers"],
    },
    suggestions: {
        name: "Suggestions",
        description: "Allow members to give feedback on the server.",
        default: false,
        commands: {
            suggest: {
                name: "Suggest",
                description: "Make a suggestion.",
                ghost: true,
                syntaxes: [["/suggest <suggestion>", `<p>Submit a server suggestion.</p>`]],
            },
            suggestion: {
                name: "Manage Suggestions",
                description: "Answer suggestions and view anonymously submitted suggestions' authors.",
                permissions: ["ManageGuild"],
                syntaxes: [
                    [
                        "/suggestion update <status> <id> [explanation] [dm] [anon]",
                        `<p>Update the status of a suggestion.</p>
                        <ul class="list-disc ml-4">
                            <li>Set <b>explanation</b> to add context or details.</li>
                            <li>Set <b>dm</b> to notify the suggestion author of the update.</li>
                            <li>Set <b>anon</b> to hide your identity from the suggestion post and the DM notification.</li>
                        </ul>`,
                    ],
                ],
            },
        },
    },
    "co-op": {
        name: "Co-op (Genshin Impact)",
        description: "Co-op group finding system for Genshin Impact.",
        default: false,
        commands: {
            "co-op": {
                name: "Request Co-op Help",
                description: "Request Genshin Impact co-op help.",
                ghost: true,
                syntaxes: [
                    [
                        "/co-op [query] [world-level] [region]",
                        `<p>Request co-op help. Set <b>query</b> to include details about your request. You can exclude the world level and region if and only if you have exactly one of the configured world level and region roles respectively. Setting these values will override the inferred values.</p>`,
                    ],
                ],
            },
        },
    },
    "reddit-feeds": {
        name: "Reddit Feeds",
        description: "Subscribe to a subreddit and receive automatic alerts for new posts.",
    },
    count: {
        name: "Counting Channels",
        description: "Counting channels.",
        commands: {
            scoreboard: {
                name: "Scoreboard",
                description: "View the counting leaderboard.",
                ghost: true,
                syntaxes: [["/scoreboard [channel]", `<p>View the count scoreboard for a specific channel or the whole server.</p>`]],
            },
        },
        selfPermissions: ["ManageMessages"],
    },
    giveaways: {
        name: "Giveaways",
        description: "Set up giveaways for server members.",
        commands: {
            giveaway: {
                name: "Manage Giveaways",
                description: "Manage giveaways.",
                permissions: ["ManageGuild"],
                syntaxes: [
                    [
                        "/giveaway reroll <id> [winners]",
                        `<p>Reroll a giveaway by ID, recalculating its winners. You can specify a different amount of winners than the giveaway's own value. Note that previous winners may be rerolled.</p>`,
                    ],
                ],
            },
        },
    },
    reminders: {
        name: "Reminders",
        description: "Set up reminders to appear in your DMs.",
        commands: {
            reminder: {
                name: "Reminder",
                description: "Set, list, or manage your reminders.",
                ghost: true,
                syntaxes: [
                    ["/reminder set <duration> [query]", `Set a DM reminder. You will be linked back to where you created the reminder.`],
                    [
                        "/reminder list [all]",
                        `<p>List your reminders. Set <b>all</b> to list reminders from all servers (default: true if in DMs, false otherwise).</p>`,
                    ],
                    [
                        "/reminder cancel <id>",
                        `<p>Cancel a reminder. The ID is global and unique to you rather than the server, so you can cancel a DM anywhere regardless of where you set it.</p>`,
                    ],
                ],
            },
        },
    },
    reports: {
        name: "Reports",
        description: "Allow members to report users and messages to moderators.",
        commands: {
            "Report User": {
                name: "Report User",
                description: "Report a user (user context menu command).",
                ghost: true,
                syntaxes: [["Report User", `<p>Right-click a user and select <b>Apps &rightarrow; Report User</b>. You must specify a reason.</p>`]],
            },
            "Flag Message": {
                name: "Flag Message",
                description: "Flag a message (message context menu command).",
                ghost: true,
                syntaxes: [
                    ["Flag Message", `<p>Right-click a message and select <b>Apps &rightarrow; Flag Message</b>. You may optionally specify a reason.</p>`],
                ],
            },
            report: {
                name: "Report User",
                description: "Report a user (slash command).",
                ghost: true,
                syntaxes: [["/report <user>", `<p>Report a user. You must specify a reason in the pop-up modal.</p>`]],
            },
            flag: {
                name: "Flag Message",
                description: "Flag a message (slash command).",
                ghost: true,
                syntaxes: [["/flag <message>", `<p>Flag a message by URL. You may optionally specify a reason in the pop-up modal.</p>`]],
            },
        },
        default: false,
    },
    polls: {
        name: "Polls",
        description:
            "Yes/no and multiple-choice polls. For all commands, you will be asked to enter the poll question in a pop-up modal along with an optional thread name to automatically create a thread under the poll.",
        commands: {
            poll: {
                name: "Poll",
                description: "Create a poll.",
                permissions: ["ManageGuild"],
                syntaxes: [
                    ["/poll yes-no [allow-neutral]", `<p>Create a yes/no poll. Set <b>allow-neutral</b> to allow users to vote for a neutral option.</p>`],
                    [
                        "/poll binary <left-option> <right-option> [allow-neutral]",
                        `<p>Create a binary poll allowing users to vote for one of two options via buttons. Set <b>allow-neutral</b> to allow users to vote for a neutral option.</p>`,
                    ],
                    [
                        "/poll multi <option-1> <option-2> [options...] [allow-multi]",
                        `<p>Create a multiple-choice poll. Set <b>allow-multi</b> to allow users to vote for multiple options.</p>`,
                    ],
                ],
            },
        },
    },
    highlights: {
        name: "Highlights",
        description: "Receive DM notifications for messages matching your filters.",
        commands: {
            highlight: {
                name: "Highlight",
                description:
                    "Manage your highlights. Users must have permission to use this command in a channel to receive highlights there (all uses of this command are only visible to the user).",
                ghost: true,
                syntaxes: [
                    ["/highlight list", `<p>List your highlighted words/phrases and show your highlight configuration.</p>`],
                    ["/highlight clear", `<p>Remove all of your highlighted terms and notification conditions.</p>`],
                    ["/highlight add <word-or-phrase>", `<p>Highlight a word or phrase and receive DM notifications when it is seen.</p>`],
                    ["/highlight remove <word-or-phrase>", `<p>Remove a highlighted word or phrase.</p>`],
                    ["/highlight replies <highlight>", `<p>Enable/disable highlights for replies to your messages that did not ping you.</p>`],
                    ["/highlight [un]block channel|user <channel / user>", `<p>Block/unblock highlights from a channel/user.</p>`],
                    ["/highlight block list", `<p>List your blocked channels and users.</p>`],
                    ["/highlight unblock all", `<p>Clear your block list and allow highlights from all channels and users in this server.</p>`],
                    [
                        "/highlight delay <duration>",
                        `<p>Set the minimum amount of time to wait after your last message before highlighting you in that channel (default: 5 minutes).</p>`,
                    ],
                    [
                        "/highlight cooldown <duration>",
                        `<p>Set the minimum amount of time to wait between consecutive highlights from the same channel (default: 5 minutes).</p>`,
                    ],
                ],
            },
        },
    },
    utility: {
        name: "Utility",
        description: "Utility commands for server management and other purposes.",
        commands: {
            help: {
                name: "Help",
                description: "Get help for the bot.",
                ghost: true,
                syntaxes: [["/help", `<p>View info on the bot and get a list of important links.</p>`]],
            },
            info: {
                name: "Info",
                description: "Get info for a user, role, channel, server, or invite.",
                ghost: true,
                syntaxes: [
                    [
                        "/info user <user>",
                        `<p>View user info, including their creation and join date and permissions in the server. If you have the appropriate permisisons, you can also see whether or not they are banned.</p>`,
                    ],
                    ["/info role <role>", `<p>View role info, including its permissions, display settings, and position.</p>`],
                    ["/info channel <channel>", `<p>View channel info.</p>`],
                    ["/info server [id]", `<p>View server info, showing the current server by default. You and the bot must both be in the server.</p>`],
                    [
                        "/info invite <invite>",
                        `<p>View invite info, including who created it, the server to which it points, and its expiration. If you are the bot are both in the server, it will also show server info.</p>`,
                    ],
                ],
            },
            avatar: {
                name: "Avatar",
                description: "View a user's avatar.",
                ghost: true,
                syntaxes: [["/avatar <user>", `<p>View a user's avatar, showing their server-specific avatar as well if possible.</p>`]],
            },
            banner: {
                name: "Banner",
                description: "View a user's banner.",
                ghost: true,
                syntaxes: [["/banner <user>", `<p>View a user's banner. This can only show their global banner due to technical limitations.</p>`]],
            },
            roles: {
                name: "Roles",
                description: "Alter a user's roles.",
                permissions: ["ManageRoles"],
                selfPermissions: ["ManageRoles"],
                syntaxes: [
                    ["/roles add <user> <role>", `<p>Add a role to a user.</p>`],
                    ["/roles remove <user> <role>", `<p>Remove a role from a user.</p>`],
                ],
            },
            code: {
                name: "Code",
                description: "Display a Genshin Impact gift code.",
                ghost: true,
                syntaxes: [
                    [
                        "/code <code>",
                        `<p>Post a Genshin Impact gift code in plain-text (for easier copy-pasting on mobile) and display a link to the Genshin Impact gifting center with the code pre-filled.</p>`,
                    ],
                ],
            },
            qr: {
                name: "QR",
                description: "Convert any text into a QR code.",
                ghost: true,
                syntaxes: [["/qr <text>", `<p>Encode any text as a QR code. This is usually used for links but can be used for any text in theory.</p>`]],
            },
            convert: {
                name: "Convert Units",
                description: "Convert between common units or between currencies.",
                ghost: true,
                syntaxes: [
                    [
                        "/convert <amount> <source> <target>",
                        `<p>Convert between units or currencies. Currency values are updated daily, so they are not guaranteed to be accurate. Do not rely on this command for critical applications; Daedalus does not accept responsibility for any damage or injury caused by inaccurate conversions.</p>`,
                    ],
                ],
            },
            snowflake: {
                name: "Snowflake",
                description: "Deconstruct a Discord snowflake (ID).",
                ghost: true,
                syntaxes: [
                    [
                        "/snowflake <snowflake>",
                        `<p>Deconstruct a snowflake (Discord's ID format). If you have an ID but don't know what type of object it is (channel, role, user, etc.), you can get its creation date using this command.</p>`,
                    ],
                ],
            },
            "role-accessibility": {
                name: "Role Accessibility",
                description: "Check if role colors' contrasts meet accessibility standards.",
                ghost: true,
                syntaxes: [
                    [
                        "/role-accessibility [threshold]",
                        `<p>Check all roles in the server for whether their color meets contrast standards with both the light-mode and dark-mode background colors. This uses WCAG 2.0 and reports roles whose contrast does not meet the provided threshold (default: 3.0).</p>`,
                    ],
                ],
            },
            "Extract IDs": {
                name: "Extract IDs",
                description: "Extract all IDs from a message for easier copying.",
                ghost: true,
                syntaxes: [
                    ["Extract IDs", `<p>Right-click a message and select <b>Apps &rightarrow; Extract IDs</b> to obtain an easily copyable list of IDs.</p>`],
                ],
            },
        },
    },
    "sticky-messages": {
        name: "Sticky Messages",
        description: "Set messages to stick to the bottom of a channel.",
        commands: {
            stick: {
                name: "Stick",
                description: "Set the channel's sticky message.",
                permissions: ["ManageChannels"],
                syntaxes: [
                    [
                        "/stick [seconds]",
                        `<p>Set the channel's sticky message via a pop-up modal. The message is reposted at most once every <b>seconds</b> (default: 4) seconds.</p>`,
                    ],
                ],
            },
            unstick: {
                name: "Unstick",
                description: "Remove the channel's sticky message.",
                permissions: ["ManageChannels"],
                syntaxes: [["/unstick", `<p>Remove the channel's sticky message.</p>`]],
            },
            sticklist: {
                name: "List Sticky Messages",
                description: "List the server's sticky messages.",
                permissions: ["ManageChannels"],
                syntaxes: [["/sticklist", `<p>List the server's sticky messages.</p>`]],
            },
        },
    },
    fun: {
        name: "Fun",
        description: "Fun commands that are mostly pointless/unimportant.",
        commands: {
            random: {
                name: "Random",
                description: "Random-related functions.",
                ghost: true,
                syntaxes: [
                    [
                        "/random choose <options...>",
                        `<p>Randomly choose one of the listed options with evenly distributed probability. You can do <b>/random choose 1 1 1 2</b> for a 75% chance to choose <b>1</b>.</p>`,
                    ],
                    ["/random flip [heads-chance]", `Flip a coin. You may optionally bias the coin.`],
                    [
                        "/random roll [config]",
                        `<p>Roll dice. You may optionally configure the dice using D&amp;D format; for example, <code class="code">1d6 + 2d10 - 2</code> will roll a 6-sided die and two 10-sided dice and return the sum of their result minus 2. By default, rolls a <b>1d6</b>.</p>`,
                    ],
                ],
            },
        },
    },
};

export const commandMap = Object.fromEntries(
    Object.entries(modules).flatMap(([mid, module]) => Object.entries(module.commands ?? {}).map(([k, v]) => [k, { ...v, module: mid }])),
);

import type { PermissionFlagsBits } from "discord.js";

export const permissions: Record<keyof typeof PermissionFlagsBits, { name: string; description: string; callouts?: { style: string; content: string }[] }> = {
    CreateInstantInvite: {
        name: "Create Invite",
        description:
            "Allows users to create invite links to the server, which other users can use to join the server. Users do not need this permission to share existing invite links, including the vanity URL, only to create new invites.",
        callouts: [{ style: "info", content: "This does not allow users to add bots; that requires Manage Guild." }],
    },
    KickMembers: {
        name: "Kick Members",
        description:
            "Allows users to kick members from the server, instantly removing them from the server but not preventing them from rejoining. This is subject to role hierarchy.",
    },
    BanMembers: {
        name: "Ban Users",
        description:
            "Allows users to ban members from the server, preventing them from rejoining the server and also banning their IP.<br /><br />Allows users to unban members, allow them to rejoin the server (if they have an invite; unbanning does not re-add members).<br /><br />Bans are permanent unless revoked. Users who aren't in the server can be banned to prevent them from joining. This is subject to role hierarchy, and non-members are considered underneath everyone.",
    },
    Administrator: {
        name: "Administrator",
        description:
            "Grants users all permissions in the server and in all channels. Also prevents users from being timed out by anyone. This is still subject to role hierarchy, so admins cannot kick/ban anyone not below them and can be kicked/banned by anyone above them.",
        callouts: [
            {
                style: "error",
                content:
                    "This is a dangerous permission to grant! Administrators gain permission to do anything - all permissions, as well as access to all channels. They are not immune to moderation except for timeouts, but deny overrides will have no effect on them.",
            },
        ],
    },
    ManageChannels: {
        name: "Manage Channels",
        description:
            "Allows users to create, edit, and delete channels. Editing channels includes changing the channel's name, topic, bitrate, video quality, user limit, region, slowmode, auto-archive duration for threads, etc.",
        callouts: [
            {
                style: "info",
                content: "This permission does not allow users to edit channel overrides; that is part of Manage Roles.",
            },
        ],
    },
    ManageGuild: {
        name: "Manage Server",
        description:
            "Allows users to edit server properties such as the name, icon, banner, etc. Also allows users to add applications to the server (e.g. bots). Also allows users to configure built-in AutoMod and users with this permission always bypass AutoMod.",
        callouts: [
            {
                style: "info",
                content:
                    "This does not allow users to delete the server, change the 2FA requirement for moderation, or apply for Discord partnership. Those are only available to the server owner.",
            },
        ],
    },
    AddReactions: {
        name: "Add Reactions",
        description: "Allows users to add new emoji reactions to messages.",
        callouts: [
            {
                style: "info",
                content:
                    "This permission is not needed to add to an existing reaction, e.g. in the case of reaction role prompts. Users who are timed out or have not passed membership screening cannot do this.<br /><br />Users can always remove their own reactions.",
            },
        ],
    },
    ViewAuditLog: {
        name: "View Audit Log",
        description:
            "Allows users to see the audit log which keeps track of moderation and administrative actions for a certain amount of time. They can see all actions, even those that they do not have permission to perform.",
    },
    PrioritySpeaker: {
        name: "Use Priority Speaker",
        description:
            "Allows users to enable Push-To-Talk Priority Speaker mode, which causes all other users in a voice channel to have their volume reduces while the user is using priority mode.",
    },
    Stream: {
        name: "Stream",
        description: "Allows users to stream in a voice channel, including screensharing and using the video camera.",
    },
    ViewChannel: {
        name: "View Channel",
        description:
            "Allows users to see channels and see incoming messages while focused on the channel. Users can see category channels if they can see at least one channel in it, and seeing a category does not automatically allow them to see any or all channels in it.",
        callouts: [
            {
                style: "info",
                content:
                    "The ability to see messages that were sent when the user was offline or the channel was unfocused is controlled by Read Message History.",
            },
        ],
    },
    SendMessages: {
        name: "Send Messages",
        description:
            "Allows users to send messages in text and text-in-voice channels that they can view. Also allows users to create forum posts but not to talk in them.",
        callouts: [
            {
                style: "info",
                content: "To talk in threads and forum posts, users need Send Messages In Threads instead.",
            },
        ],
    },
    SendTTSMessages: {
        name: "Send Test-To-Speech Messages",
        description: "Allows users to use <b>/tts</b> which sends a message that is read aloud to everyone focused on the channel.",
    },
    ManageMessages: {
        name: "Manage Messages",
        description:
            "Allows users to delete other users' messages, pin messages, publish other users' messages in announcement channels, and remove embeds from other users' messages. Except for pinning messages, the other three are always available for one's own messages. This is <b>not</b> subject to role hierarchy.",
    },
    EmbedLinks: {
        name: "Embed Links",
        description:
            "Links that users send will show embeds if possible and the user has not suppressed embeds using <b>&lt;link&gt;</b>. For bots, this is necessary for them to send custom embeds in messages.",
    },
    AttachFiles: {
        name: "Attach Files",
        description: "Allows users to upload files in messages they send. This is not limited to images; users can upload most types of files.",
    },
    ReadMessageHistory: {
        name: "Read Message History",
        description:
            'Allows users to view messages in channels that they can view, even if they were not focused on the channel at the time, and allows them to search back through all past messages.<br /><br />Without this permission, users will see "You do not have permission to view the history of this channel." and will only be able to see messages received by their client while they were in that channel.',
    },
    MentionEveryone: {
        name: "Mention @everyone, @here, and All Roles",
        description:
            'Allows users to use <b>@everyone</b> to ping all server members who can see the channel, <b>@here</b> to ping all online members who can see the channel, and ping any role regardless of if it has the "Allow anyone to <b>@mention</b> this role" setting enabled. This is <b>not</b> subject to role hierarchy.',
    },
    UseExternalEmojis: {
        name: "Use External Emoji",
        description: "Allows users to use emoji from other servers in messages and reactions (if they have Nitro or are a bot).",
    },
    ViewGuildInsights: {
        name: "View Server Insights",
        description:
            "Allows users to see the server insights page, which provides information about server health, members joining and leaving, which invites they are using, member retention, participant message count, etc.",
    },
    Connect: {
        name: "Connect",
        description:
            "Allows users to join voice and stage channels that they can see. Being able to speak is controlled by Speak but they can listen unless deafened.",
    },
    Speak: {
        name: "Speak",
        description:
            "Allows users to speak in voice channels that they are connected to. This does not allow users to speak in stage channels; stage moderators are appointed separately per stage channel (via the channel permission settings) and choose who is allowed to speak.",
    },
    MuteMembers: {
        name: "Mute Members",
        description:
            "Allows users to force-mute users (including themselves), preventing them from speaking in any channel regardless of if they have the Speak permission. Also allows users to undo force-mutes, including on themselves. Users who have muted themselves cannot be muted by anyone else. This is <b>not</b> subject to role hierarchy.",
    },
    DeafenMembers: {
        name: "Deafen Members",
        description:
            "Allows users to force-deafen users (including themselves), preventing them from hearing what is happening in voice or stage channels. Also allows users to undo force-deafens, including on themselves. Users who have deafened themselves cannot be undeafened by anyone else. This is <b>not</b> subject to role hierarchy.",
        callouts: [
            {
                style: "info",
                content:
                    "Unlike how self-deafening works, a user can be force-deafened but still allowed to speak. This can be used to disable music bots' ability to hear, which is useful if you are concerned about spying.",
            },
        ],
    },
    MoveMembers: {
        name: "Move Members",
        description:
            "Allows users to move members who are already in a voice channel in this server into another voice channel. The user performing this action must have Connect in the target channel, but the target user does not need to be able to see or join it on their own. Users cannot be connected by another user and can never be moved between servers even if the user has this permission in both servers. This is not subject to role hierarchy.",
    },
    UseVAD: {
        name: "Use Voice Activity Detection",
        description: "Allows users to use voice activity detection mode. Without this permission, users can only use Push-To-Talk.",
    },
    ChangeNickname: {
        name: "Change Nickname",
        description: "Allows users to change their own nickname.",
    },
    ManageNicknames: {
        name: "Manage Nicknames",
        description: "Allows users to change other members' nicknames. This is subject to role hierarchy.",
    },
    ManageRoles: {
        name: "Manage Roles",
        description:
            "Allows users to create, edit, delete, add, and remove roles that are below them in role hierarchy (however, adding/removing roles can be done to members above them in hierarchy).<br /><br />Allows users to edit channel overrides for roles that are below them and permissions that they have.",
    },
    ManageWebhooks: {
        name: "Manage Webhooks",
        description: "Allows users to create, edit, and delete webhooks, as well as view a list of webhooks and get their URLs.",
    },
    ManageGuildExpressions: {
        name: "Manage Guild Expressions",
        description:
            "Allows users to upload, rename, and delete emojis, stickers, and soundboard sounds. Also allows bots to control which roles can use emojis, which is a little-known feature that isn't very useful and isn't supported by most bots.",
    },
    UseApplicationCommands: {
        name: "Use Application Commands",
        description: 'Allows users to use slash commands and context menu commands (right clicking a message or user and selecting "Apps").',
        callouts: [
            {
                style: "info",
                content:
                    "This permission is not needed for the bot to support application commands; that is the <b>application.commands</b> scope set when inviting the bot. If you are not seeing a bot's commands and you gave it this scope, you likely have too many bots; if you have over 50 bots, some will no longer be able to register commands.<br /><br />In fact, this permission currently does nothing for bots.",
            },
        ],
    },
    RequestToSpeak: {
        name: "Request to Speak",
        description: "Allows users to request to become a speaker in stage channels, which can be approved or denied by stage moderators.",
    },
    ManageEvents: {
        name: "Manage Events",
        description: "Allows users to create, edit, and delete server events, including starting and ending them.",
    },
    ManageThreads: {
        name: "Manage Threads",
        description: "Allows users to edit, archive, unarchive, lock, unlock, and delete threads and view all private threads.",
    },
    CreatePublicThreads: {
        name: "Create Public Threads",
        description: "Allows users to create public threads (threads that all users can see).",
    },
    CreatePrivateThreads: {
        name: "Create Private Threads",
        description:
            "Allows users to create private threads, which can only be seen by users with Manage Threads and users who are explicitly invited to the thread.",
    },
    UseExternalStickers: {
        name: "Use External Stickers",
        description: "Allows users to send messages with stickers from other servers.",
    },
    SendMessagesInThreads: {
        name: "Send Messages in Threads",
        description: "Allows users to send messages in threads and forum posts.",
        callouts: [
            {
                style: "info",
                content: "To create forum posts and talk in text and text-in-voice channels, users need Send Messages.",
            },
        ],
    },
    UseEmbeddedActivities: {
        name: "Use Activities",
        description: "Allows users to use activities such as YouTube's Watch Together in voice channels.",
    },
    ModerateMembers: {
        name: "Timeout Members",
        description:
            "Allows users to timeout other members, disabling all permissions except View Channel and Read Message History. Some other features like adding to existing reactions or using message components (buttons and dropdowns) are also disabled.",
        callouts: [
            {
                style: "info",
                content:
                    "Users with Administrator cannot be timed out. If a user is timed out and gains the permission, their timeout will be canceled. Even if an administrator could be timed out, it would take no effect.",
            },
        ],
    },
    ViewCreatorMonetizationAnalytics: {
        name: "View Monetization Analytics",
        description: "Allows users to view role subscription insights and analytics for the server's built-in creator monetization.",
    },
    UseSoundboard: {
        name: "Use Soundboard",
        description: "Allows users to use the soundboard in voice channels.",
    },
    UseExternalSounds: {
        name: "Use External Sounds",
        description: "Allows users to use external sounds on the soundboard in voice channels.",
    },
    SendVoiceMessages: {
        name: "Send Voice Messages",
        description: "Allows users to send voice messages in text channels.",
    },
    ManageEmojisAndStickers: {
        name: "Manage Emoji and Stickers",
        description: "Deprecated.",
        callouts: [{ style: "error", content: "This permission is deprecated. See Manage Guild Expressions." }],
    },
};
