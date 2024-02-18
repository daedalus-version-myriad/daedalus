import { ModuleData } from "./types.js";

export const modules: ModuleData = {
    logging: {
        name: "Logging",
        icon: "list-ul",
        description: "Log events/changes in your server.",
    },
    welcome: {
        name: "Welcome",
        icon: "door-open",
        description: "Welcome incoming members to the server.",
    },
    "supporter-announcements": {
        name: "Supporter Announcements",
        icon: "bullhorn",
        description: "Announce new boosters and other server supporters by role.",
    },
    xp: {
        name: "XP",
        icon: "ranking-star",
        description: "Server experience system to reward active members.",
        commands: {
            top: {
                name: "Top",
                icon: "arrow-down-wide-short",
                description: "Get top users by XP.",
                ghost: true,
                syntaxes: [
                    [
                        "/top [type] [range] [page]",
                        `Fetch the top users in the server by XP.
                        <ul class="list-disc list-inside">
                            <li>Set <b>type</b> to only view the text or voice leaderboard (by default, both are shown).</li>
                            <li>Set <b>range</b> to view the daily, weekly, or monthly leaderboard (by default, shows the all-time leaderboard).</li>
                            <li>Set <b>page</b> to view other pages in the leaderboard.</li>
                        </ul>`,
                    ],
                ],
            },
            rank: {
                name: "Rank",
                icon: "medal",
                description: "Get a user's XP and rank.",
                ghost: true,
                syntaxes: [["/rank [user]", `Show a user's rank card, including their text and voice XP, level, and rank.`]],
            },
            xp: {
                name: "Manage XP",
                icon: "ranking-star",
                description: "Manage the server's XP, including importing or fully resetting XP.",
                permissions: ["ManageGuild"],
                syntaxes: [
                    ["/xp mee6-import", `Start the process for importing XP from MEE6.`],
                    ["/xp reset <user>", `Reset a user's XP to 0.`],
                ],
            },
        },
    },
    "reaction-roles": {
        name: "Reaction Roles",
        icon: "icons",
        description: "Allow users to self-assign roles, including verification roles.",
        selfPermissions: ["ManageRoles"],
    },
    moderation: {
        name: "Moderation",
        icon: "shield-halved",
        description: "Moderation commands for managing users and content.",
        commands: {
            ban: {
                name: "Ban",
                icon: "gavel",
                description: "Ban a user (even if they are not in the server).",
                permissions: ["BanMembers"],
                selfPermissions: ["BanMembers"],
                syntaxes: [
                    [
                        "/ban <user> [reason] [duration] [purge] [silent] [force]",
                        `Ban a user.
                        <ul class="list-disc list-inside">
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
                icon: "user-minus",
                description: "Kick a member from the server.",
                permissions: ["KickMembers"],
                selfPermissions: ["KickMembers"],
                syntaxes: [
                    [
                        "/kick <user> [reason] [silent]",
                        `Kick a member.
                        <ul class="list-disc list-inside">
                            <li>The <b>reason</b> will be logged in Daedalus logs, audit logged, and sent to the user (unless silent).</li>
                            <li>Set <b>silent</b> to not notify the user that they were kicked.</li>
                        </ul>`,
                    ],
                ],
            },
            mute: {
                name: "Mute",
                icon: "volume-xmark",
                description: "Mute a user by assigning them a mute role. This only works on server members unless the Sticky Roles module is enabled.",
                permissions: ["ModerateMembers"],
                selfPermissions: ["ManageRoles"],
                syntaxes: [
                    [
                        "/mute <user> [reason] [duration] [silent]",
                        `Mute a user.
                        <ul class="list-disc list-inside">
                            <li>The <b>reason</b> will be logged in Daedalus logs, audit logged, and sent to the user (unless silent).</li>
                            <li>Set <b>duration</b> to automatically unmute the user after the specified amount of time elapses.</li>
                            <li>Set <b>silent</b> to not notify the user that they were muted.</li>
                        </ul>`,
                    ],
                ],
            },
            timeout: {
                name: "Timeout",
                icon: "hourglass-start",
                description: "Timeout a member or remove their timeout.",
                permissions: ["ModerateMembers"],
                selfPermissions: ["ModerateMembers"],
                syntaxes: [
                    [
                        "/timeout <user> [reason] [duration] [silent]",
                        `Timeout a user.
                        <ul class="list-disc list-inside">
                            <li>The <b>reason</b> will be logged in Daedalus logs, audit logged, and sent to the user (unless silent).</li>
                            <li>The <b>duration</b> determines for how long the user will be timed out. If excluded or set to zero, the user will have their timeout removed instead.</li>
                            <li>Set <b>silent</b> to not notify the user that they were timed out / their timeout was removed.</li>
                        </ul>`,
                    ],
                ],
            },
            warn: {
                name: "Warn",
                icon: "triangle-exclamation",
                description: "DM a warning to a user and log it to their user history.",
                permissions: ["ModerateMembers"],
                syntaxes: [
                    [
                        "/warn <user> <reason> [informal] [silent]",
                        `Warn a user.
                        <ul class="list-disc list-inside">
                            <li>The <b>reason</b> will be logged in Daedalus logs and sent to the user (unless silent).</li>
                            <li>Set <b>informal</b> to modify the notification to state that it is informal and log it as informal.</li>
                            <li>Set <b>silent</b> to not notify the user of the warning. This is useful for retroactively logging direct warnings.</li>
                        </ul>`,
                    ],
                ],
            },
            unban: {
                name: "Unban",
                icon: "user-gear",
                description: "Unban a user, allowing them to rejoin the server.",
                permissions: ["BanMembers"],
                selfPermissions: ["BanMembers"],
                syntaxes: [
                    [
                        "/unban <user> [reason]",
                        `Unban a user.
                        <ul class="list-disc list-inside">
                            <li>The <b>reason</b> is audit logged but not stored in Daedalus logs nor sent to the user.</li>
                        </ul>`,
                    ],
                ],
            },
            unmute: {
                name: "Unmute",
                icon: "volume-low",
                description: "Unmute a user by removing their mute role. This only works on server members unless the Sticky Roles module is enabled.",
                permissions: ["ModerateMembers"],
                selfPermissions: ["ManageRoles"],
                syntaxes: [
                    [
                        "/unmute <user> [reason] [silent]",
                        `Unmute a user.
                        <ul class="list-disc list-inside">
                            <li>The <b>reason</b> is audit logged but not stored in Daedalus logs. It is also sent to the user (unless silent).</li>
                            <li>Set <b>silent</b> to not notify the user that they were unmuted.</li>
                        </ul>`,
                    ],
                ],
            },
            massban: {
                name: "Massban",
                icon: "users-rays",
                description:
                    "Ban many users at once. In all versions of the command, the reason is logged in Daedalus logs and audit logged but not sent to any users, and the purge duration can be sent to automatically purge recent messages from the banned users within the specified time frame.",
                permissions: ["ManageGuild"],
                selfPermissions: ["BanMembers"],
                syntaxes: [
                    ["/massban file <file> [reason] [purge]", `Massban a list of users from a file containing a list of IDs.`],
                    ["/massban list <users> [reason] [purge]", `Massban a list of users by providing a list of IDs directly.`],
                    ["/massban url <url> [reason] [purge]", `Massban a list of users via a URL pointing to a raw file containing a list of IDs.`],
                ],
            },
            history: {
                name: "View History",
                icon: "clock-rotate-left",
                description: "View a user's history.",
                ghost: true,
                permissions: ["ModerateMembers"],
                syntaxes: [["/history <user>", `View a user's Daedalus history.`]],
            },
            "delete-history": {
                name: "Delete History Entry",
                icon: "delete-left",
                description: "Remove a single history entry.",
                permissions: ["ManageGuild"],
                syntaxes: [
                    [
                        "/delete-history <id>",
                        `Delete a user history entry by ID. The IDs are shown when you take the moderation action and in <b>/history</b>.`,
                    ],
                ],
            },
            "clear-history": {
                name: "Clear History",
                icon: "broom",
                description: "Clear a user's history.",
                permissions: ["ManageGuild"],
                syntaxes: [["/clear-history <user>", `Delete all history entriers for a user.`]],
            },
            slowmode: {
                name: "Slowmode",
                icon: "gauge",
                description: "Set a channel's slowmode.",
                bypass: true,
                permissions: ["ManageChannels"],
                selfPermissions: ["ManageChannels"],
                syntaxes: [["/slowmode [channel] [delay]", `Set <b>channel</b>'s slowmode to the specified delay (default: this channel, 0 seconds).`]],
            },
            purge: {
                name: "Purge",
                icon: "trash",
                description:
                    "Purge many messages at once. For both versions of the command, you may only select up to 100 (1000 with premium) messages at once. The filter allows you to specify the type of message (human vs. bot accounts) and match a certain substring.",
                permissions: ["ManageGuild"],
                selfPermissions: ["ManageMessages"],
                syntaxes: [
                    ["/purge last <count> [types] [match] [case-sensitive]", `Select the last N messages and delete those that pass the filter.`],
                    [
                        "/purge between <start> [end] [types] [match] [case-sensitive]",
                        `Select messages inclusively between <b>start</b> and <b>end</b> (default: end of the channel) and delete those that pass the filter.`,
                    ],
                ],
            },
            notes: {
                name: "Notes",
                icon: "note-sticky",
                description: "Record mod notes for a user.",
                permissions: ["ModerateMembers"],
                syntaxes: [
                    ["/notes edit <user>", `Open a pop-up modal to edit a user's mod notes.`],
                    ["/notes view <user>", `View a user's notes.`],
                ],
            },
        },
    },
    starboard: {
        name: "Starboard",
        icon: "star",
        description: "Feature messages that receive a specified reaction.",
    },
    automod: {
        name: "Automod",
        icon: "eye",
        description: "Automatically scan and filter messages and edits for blocked content.",
        selfPermissions: ["ManageMessages", "ManageRoles", "ModerateMembers", "KickMembers", "BanMembers"],
    },
    "sticky-roles": {
        name: "Sticky Roles",
        icon: "arrow-rotate-right",
        description: "Automatically re-add roles to members when they rejoin the server.",
        selfPermissions: ["ManageRoles"],
        default: false,
    },
    autoroles: {
        name: "Autoroles",
        icon: "bolt",
        description: "Automatically add specified roles to users upon joining the server.",
        selfPermissions: ["ManageRoles"],
    },
    "custom-roles": {
        name: "Custom Roles",
        icon: "eye-dropper",
        description: "Give boosters and other server supporters the ability to create custom roles.",
        commands: {
            role: {
                name: "Custom Role",
                icon: "fill-drip",
                description: "Manage the user's custom role.",
                ghost: true,
                selfPermissions: ["ManageRoles"],
                syntaxes: [
                    ["/role set [name] [color]", `Modify your custom role.`],
                    ["/role delete", `Delete your custom role.`],
                ],
            },
        },
        selfPermissions: ["ManageRoles"],
        default: false,
    },
    "stats-channels": {
        name: "Stats Channels",
        icon: "chart-line",
        description: "Keep track of server stats with automatically updating channels.",
        selfPermissions: ["ManageChannels"],
    },
    autoresponder: {
        name: "Autoresponder",
        icon: "reply",
        description: "Automatically respond to certain messages",
    },
    modmail: {
        name: "Modmail",
        icon: "envelope",
        description: "Allow users to contact staff via direct-messaging the bot.",
        commands: {
            modmail: {
                name: "Modmail",
                icon: "envelope",
                description: "Modmail operation commands.",
                permissions: ["ManageMessages"],
                syntaxes: [
                    [
                        "/modmail reply [content] [anon] [files...]",
                        `Reply to a modmail thread. By default, the outgoing message shows your name, icon, and highest role, which can be disabled by setting <b>anon</b>.`,
                    ],
                    [
                        "/modmail reply-modal [anon] [files...]",
                        `Reply to a modmail thread just like with <b>/modmail reply</b>, but you will be prompted to set the content in a pop-up modal, allowing for multi-line messages.`,
                    ],
                    [
                        "/modmail close [notify] [content] [delay]",
                        `Close a modmail thread.
                        <ul class="list-disc list-inside">
                            <li>Set <b>notify</b> to inform the user that the thread has been closed.</li>
                            <li>Set <b>content</b> to override the server-default close message (by default, no content is included).</li>
                            <li>Set <b>delay</b> to schedule the thread to be closed. The user will be notified immediately, and if neither party sends a message before the time window elapses, the user will be notified with the <b>content</b> if <b>notify</b> is set.
                        </ul>`,
                    ],
                    ["/modmail contact <user>", `Open a modmail thread with a user from the server side.`],
                    ["/modmail log-link", `Get the link to the log viewer on the dashboard for the current modmail thread.`],
                    ["/modmail snippet send <snippet> [anon]", `Send a modmail snippet.`],
                    ["/modmail snippet view <snippet>", `View the content of a snippet.`],
                    ["/modmail snippet use-as-template <snippet> [anon]", `Use a snippet as a template and edit its content before sending.`],
                    ["/modmail notify <mode>", `Enable or disable notifications for the current thread for the next message or all messages.`],
                    ["/modmail nsfw <nsfw>", `Set the channel's NSFW status.`],
                ],
            },
        },
        selfPermissions: ["CreatePublicThreads", "ManageThreads", "ManageChannels"],
        default: false,
    },
    tickets: {
        name: "Tickets",
        icon: "ticket",
        description: "Allow users to contact staff by creating new private channels at the press of a button.",
        commands: {
            ticket: {
                name: "Ticket",
                icon: "ticket",
                description: "Manage tickets.",
                syntaxes: [["/ticket close", `Close a ticket channel.`]],
            },
        },
        selfPermissions: ["ManageChannels"],
    },
    nukeguard: {
        name: "Nukeguard",
        icon: "lock",
        description: "Anti-nuke features to guard against rogue or compromised mods/admins.",
        selfPermissions: ["BanMembers"],
    },
    suggestions: {
        name: "Suggestions",
        icon: "comment",
        description: "Allow members to give feedback on the server.",
        default: false,
        commands: {
            suggest: {
                name: "Suggest",
                icon: "comment",
                description: "Make a suggestion.",
                ghost: true,
                syntaxes: [["/suggest <suggestion>", `Submit a server suggestion.`]],
            },
            suggestion: {
                name: "Manage Suggestions",
                icon: "comments",
                description: "Answer suggestions and view anonymously submitted suggestions' authors.",
                permissions: ["ManageGuild"],
                syntaxes: [
                    [
                        "/suggestion update <status> <id> [explanation] [dm] [anon]",
                        `Update the status of a suggestion.
                        <ul class="list-disc list-inside">
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
        icon: "handshake",
        description: "Co-op group finding system for Genshin Impact.",
        default: false,
        commands: {
            "co-op": {
                name: "Request Co-op Help",
                icon: "handshake",
                description: "Request Genshin Impact co-op help.",
                ghost: true,
                syntaxes: [
                    [
                        "/co-op [query] [world-level] [region]",
                        `Request co-op help. Set <b>query</b> to include details about your request. You can exclude the world level and region if and only if you have exactly one of the configured world level and region roles respectively. Setting these values will override the inferred values.`,
                    ],
                ],
            },
        },
    },
    "reddit-feeds": {
        name: "Reddit Feeds",
        icon: "reddit",
        brand: true,
        description: "Subscribe to a subreddit and receive automatic alerts for new posts.",
    },
    count: {
        name: "Counting Channels",
        icon: "arrow-up-9-1",
        description: "Counting channels.",
        commands: {
            scoreboard: {
                name: "Scoreboard",
                icon: "ranking-star",
                description: "View the counting leaderboard.",
                ghost: true,
                syntaxes: [["/scoreboard [channel]", `View the count scoreboard for a specific channel or the whole server.`]],
            },
        },
        selfPermissions: ["ManageMessages"],
    },
    giveaways: {
        name: "Giveaways",
        icon: "gift",
        description: "Set up giveaways for server members.",
        commands: {
            giveaway: {
                name: "Manage Giveaways",
                icon: "gift",
                description: "Manage giveaways.",
                permissions: ["ManageGuild"],
                syntaxes: [
                    [
                        "/giveaway reroll <id> [winners]",
                        `Reroll a giveaway by ID, recalculating its winners. You can specify a different amount of winners than the giveaway's own value. Note that previous winners may be rerolled.`,
                    ],
                ],
            },
        },
    },
    reminders: {
        name: "Reminders",
        icon: "calendar-day",
        description: "Set up reminders to appear in your DMs.",
        commands: {
            reminder: {
                name: "Reminder",
                icon: "calendar-day",
                description: "Set, list, or manage your reminders.",
                ghost: true,
                syntaxes: [
                    ["/reminder set <duration> [query]", `Set a DM reminder. You will be linked back to where you created the reminder.`],
                    [
                        "/reminder list [all]",
                        `List your reminders. Set <b>all</b> to list reminders from all servers (default: true if in DMs, false otherwise).`,
                    ],
                    [
                        "/reminder cancel <id>",
                        `Cancel a reminder. The ID is global and unique to you rather than the server, so you can cancel a DM anywhere regardless of where you set it.`,
                    ],
                ],
            },
        },
    },
    reports: {
        name: "Reports",
        icon: "flag",
        description: "Allow members to report users and messages to moderators.",
        commands: {
            "Report User": {
                name: "Report User",
                icon: "flag",
                description: "Report a user (user context menu command).",
                ghost: true,
                syntaxes: [["Report User", `Right-click a user and select <b>Apps &rightarrow; Report User</b>. You must specify a reason.`]],
            },
            "Flag Message": {
                name: "Flag Message",
                icon: "flag",
                description: "Flag a message (message context menu command).",
                ghost: true,
                syntaxes: [["Flag Message", `Right-click a message and select <b>Apps &rightarrow; Flag Message</b>. You may optionally specify a reason.`]],
            },
            report: {
                name: "Report User",
                icon: "flag",
                description: "Report a user (slash command).",
                ghost: true,
                syntaxes: [["/report <user>", `Report a user. You must specify a reason in the pop-up modal.`]],
            },
            flag: {
                name: "Flag Message",
                icon: "flag",
                description: "Flag a message (slash command).",
                ghost: true,
                syntaxes: [["/flag <message>", `Flag a message by URL. You may optionally specify a reason in the pop-up modal.`]],
            },
        },
        default: false,
    },
    polls: {
        name: "Polls",
        icon: "square-poll-vertical",
        description:
            "Yes/no and multiple-choice polls. For all commands, you will be asked to enter the poll question in a pop-up modal along with an optional thread name to automatically create a thread under the poll.",
        commands: {
            poll: {
                name: "Poll",
                icon: "square-poll-vertical",
                description: "Create a poll.",
                permissions: ["ManageGuild"],
                syntaxes: [
                    ["/poll yes-no [allow-neutral]", `Create a yes/no poll. Set <b>allow-neutral</b> to allow users to vote for a neutral option.`],
                    [
                        "/poll binary <left-option> <right-option> [allow-neutral]",
                        `Create a binary poll allowing users to vote for one of two options via buttons. Set <b>allow-neutral</b> to allow users to vote for a neutral option.`,
                    ],
                    [
                        "/poll multi <option-1> <option-2> [options...] [allow-multi]",
                        `Create a multiple-choice poll. Set <b>allow-multi</b> to allow users to vote for multiple options.`,
                    ],
                ],
            },
        },
    },
    highlights: {
        name: "Highlights",
        icon: "bell",
        description: "Receive DM notifications for messages matching your filters.",
        commands: {
            highlight: {
                name: "Highlight",
                icon: "bell",
                description:
                    "Manage your highlights. Users must have permission to use this command in a channel to receive highlights there (all uses of this command are only visible to the user).",
                ghost: true,
                syntaxes: [
                    ["/highlight list", `List your highlighted words/phrases and show your highlight configuration.`],
                    ["/highlight clear", `Remove all of your highlighted terms and notification conditions.`],
                    ["/highlight add <word-or-phrase>", `Highlight a word or phrase and receive DM notifications when it is seen.`],
                    ["/highlight remove <word-or-phrase>", `Remove a highlighted word or phrase.`],
                    ["/highlight replies <highlight>", `Enable/disable highlights for replies to your messages that did not ping you.`],
                    ["/highlight [un]block channel|user <channel / user>", `Block/unblock highlights from a channel/user.`],
                    ["/highlight block list", `List your blocked channels and users.`],
                    ["/highlight unblock all", `Clear your block list and allow highlights from all channels and users in this server.`],
                    [
                        "/highlight delay <duration>",
                        `Set the minimum amount of time to wait after your last message before highlighting you in that channel (default: 5 minutes).`,
                    ],
                    [
                        "/highlight cooldown <duration>",
                        `Set the minimum amount of time to wait between consecutive highlights from the same channel (default: 5 minutes).`,
                    ],
                ],
            },
        },
    },
    utility: {
        name: "Utility",
        icon: "toolbox",
        description: "Utility commands for server management and other purposes.",
        commands: {
            help: {
                name: "Help",
                icon: "circle-question",
                description: "Get help for the bot.",
                ghost: true,
                syntaxes: [["/help", `View info on the bot and get a list of important links.`]],
            },
            info: {
                name: "Info",
                icon: "circle-info",
                description: "Get info for a user, role, channel, server, or invite.",
                ghost: true,
                syntaxes: [
                    [
                        "/info user <user>",
                        `View user info, including their creation and join date and permissions in the server. If you have the appropriate permisisons, you can also see whether or not they are banned.`,
                    ],
                    ["/info role <role>", `View role info, including its permissions, display settings, and position.`],
                    ["/info channel <channel>", `View channel info.`],
                    ["/info server [id]", `View server info, showing the current server by default. You and the bot must both be in the server.`],
                    [
                        "/info invite <invite>",
                        `View invite info, including who created it, the server to which it points, and its expiration. If you are the bot are both in the server, it will also show server info.`,
                    ],
                ],
            },
            avatar: {
                name: "Avatar",
                icon: "id-badge",
                description: "View a user's avatar.",
                ghost: true,
                syntaxes: [["/avatar <user>", `View a user's avatar, showing their server-specific avatar as well if possible.`]],
            },
            roles: {
                name: "Roles",
                icon: "user-gear",
                description: "Alter a user's roles.",
                permissions: ["ManageRoles"],
                selfPermissions: ["ManageRoles"],
                syntaxes: [
                    ["/roles add <user> <role>", `Add a role to a user.`],
                    ["/roles remove <user> <role>", `Remove a role from a user.`],
                ],
            },
            code: {
                name: "Code",
                icon: "gift",
                description: "Display a Genshin Impact gift code.",
                ghost: true,
                syntaxes: [
                    [
                        "/code <code>",
                        `Post a Genshin Impact gift code in plain-text (for easier copy-pasting on mobile) and display a link to the Genshin Impact gifting center with the code pre-filled.`,
                    ],
                ],
            },
            qr: {
                name: "QR",
                icon: "qrcode",
                description: "Convert any text into a QR code.",
                ghost: true,
                syntaxes: [["/qr <text>", `Encode any text as a QR code. This is usually used for links but can be used for any text in theory.`]],
            },
            convert: {
                name: "Convert Units",
                icon: "money-bill-transfer",
                description: "Convert between common units or between currencies.",
                ghost: true,
                syntaxes: [
                    [
                        "/convert <amount> <source> <target>",
                        `Convert between units or currencies. Currency values are updated daily, so they are not guaranteed to be accurate. Do not rely on this command for critical applications; Daedalus does not accept responsibility for any damage or injury caused by inaccurate conversions.`,
                    ],
                ],
            },
            snowflake: {
                name: "Snowflake",
                icon: "snowflake",
                description: "Deconstruct a Discord snowflake (ID).",
                ghost: true,
                syntaxes: [
                    [
                        "/snowflake <snowflake>",
                        `Deconstruct a snowflake (Discord's ID format). If you have an ID but don't know what type of object it is (channel, role, user, etc.), you can get its creation date using this command.`,
                    ],
                ],
            },
            "role-accessibility": {
                name: "Role Accessibility",
                icon: "eye-low-vision",
                description: "Check if role colors' contrasts meet accessibility standards.",
                ghost: true,
                syntaxes: [
                    [
                        "/role-accessibility [threshold]",
                        `Check all roles in the server for whether their color meets contrast standards with both the light-mode and dark-mode background colors. This uses WCAG 2.0 and reports roles whose contrast does not meet the provided threshold (default: 3.0).`,
                    ],
                ],
            },
            "Extract IDs": {
                name: "Extract IDs",
                icon: "id-card",
                description: "Extract all IDs from a message for easier copying.",
                ghost: true,
                syntaxes: [["Extract IDs", `Right-click a message and select <b>Apps &rightarrow; Extract IDs</b> to obtain an easily copyable list of IDs.`]],
            },
        },
    },
    "sticky-messages": {
        name: "Sticky Messages",
        icon: "sticky-note",
        description: "Set messages to stick to the bottom of a channel.",
        commands: {
            stick: {
                name: "Stick",
                icon: "tag",
                description: "Set the channel's sticky message.",
                permissions: ["ManageChannels"],
                syntaxes: [
                    [
                        "/stick [seconds]",
                        `Set the channel's sticky message via a pop-up modal. The message is reposted at most once every <b>seconds</b> (default: 4) seconds.`,
                    ],
                ],
            },
            unstick: {
                name: "Unstick",
                icon: "eraser",
                description: "Remove the channel's sticky message.",
                permissions: ["ManageChannels"],
                syntaxes: [["/unstick", `Remove the channel's sticky message.`]],
            },
            sticklist: {
                name: "List Sticky Messages",
                icon: "tags",
                description: "List the server's sticky messages.",
                permissions: ["ManageChannels"],
                syntaxes: [["/sticklist", `List the server's sticky messages.`]],
            },
        },
    },
    fun: {
        name: "Fun",
        icon: "wand-magic-sparkles",
        description: "Fun commands that are mostly pointless/unimportant.",
        commands: {
            random: {
                name: "Random",
                icon: "shuffle",
                description: "Random-related functions.",
                ghost: true,
                syntaxes: [
                    [
                        "/random choose <options...>",
                        `Randomly choose one of the listed options with evenly distributed probability. You can do <b>/random choose 1 1 1 2</b> for a 75% chance to choose <b>1</b>.`,
                    ],
                    ["/random flip [heads-chance]", `Flip a coin. You may optionally bias the coin.`],
                    [
                        "/random roll [config]",
                        `Roll dice. You may optionally configure the dice using D&amp;D format; for example, <code class="code">1d6 + 2d10 - 2</code> will roll a 6-sided die and two 10-sided dice and return the sum of their result minus 2. By default, rolls a <b>1d6</b>.`,
                    ],
                ],
            },
        },
    },
};

export const commandMap = Object.fromEntries(
    Object.entries(modules).flatMap(([mid, module]) => Object.entries(module.commands ?? {}).map(([k, v]) => [k, { ...v, module: mid }])),
);
