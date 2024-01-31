import type { PermissionFlagsBits } from "discord.js";

export const permissions: Record<keyof typeof PermissionFlagsBits, { name: string; description: string; callouts?: { style: string; content: string }[] }> = {
    CreateInstantInvite: {
        name: "Create Invite",
        description:
            "Allows users to create invite links to the server, which other users can use to join the server. Users do not need this permission to share existing invite links, including the vanity URL, only to create new invites.",
        callouts: [{ style: "info", content: "This does not allow users to add bots; that requires [[ManageGuild]]." }],
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
                content: "This permission does not allow users to edit channel overrides; that is part of [[ManageRoles]].",
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
                    "The ability to see messages that were sent when the user was offline or the channel was unfocused is controlled by [[ReadMessageHistory]].",
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
                content: "To talk in threads and forum posts, users need [[SendMessagesInThreads]] instead.",
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
            "Allows users to move members who are already in a voice channel in this server into another voice channel. The user performing this action must have [[Connect]] in the target channel, but the target user does not need to be able to see or join it on their own. Users cannot be connected by another user and can never be moved between servers even if the user has this permission in both servers. This is not subject to role hierarchy.",
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
                content: "To create forum posts and talk in text and text-in-voice channels, users need [[SendMessages]].",
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
            "Allows users to timeout other members, disabling all permissions except [[ViewChannel]] and [[ReadMessageHistory]]. Some other features like adding to existing reactions or using message components (buttons and dropdowns) are also disabled.",
        callouts: [
            {
                style: "info",
                content:
                    "Users with [[Administrator]] cannot be timed out. If a user is timed out and gains the permission, their timeout will be canceled. Even if an administrator could be timed out, it would take no effect.",
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
        callouts: [{ style: "error", content: "This permission is deprecated. See [[ManageGuildExpressions]]." }],
    },
};
