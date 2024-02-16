import { enforcePermissions, template, type Commands } from "@daedalus/bot-utils";
import { DurationStyle, formatDuration, parseDuration } from "@daedalus/global-utils";
import { ChannelType } from "discord.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("slowmode")
            .description("set or remove a channel's slowmode")
            .channelOption("channel", "the channel to edit (default: this channel)", {
                channelTypes: [
                    ChannelType.AnnouncementThread,
                    ChannelType.GuildForum,
                    ChannelType.GuildMedia,
                    ChannelType.GuildStageVoice,
                    ChannelType.GuildText,
                    ChannelType.GuildVoice,
                    ChannelType.PrivateThread,
                    ChannelType.PublicThread,
                ],
            })
            .stringOption("delay", "the delay (default: `clear` = remove)")
            .fn(async ({ _, channel: _channel, delay: _delay }) => {
                if (!_.guild || !_.channel || _.channel.isDMBased()) throw "This command can only be run in a guild.";

                const channel = _channel ?? _.channel;
                await enforcePermissions(_.user, "slowmode", channel, false);

                const delay = !_delay || _delay === "clear" ? 0 : parseDuration(_delay);
                if (delay > 21600000) throw "Slowmode delay cannot exceed 6 hours.";

                await channel.setRateLimitPerUser(Math.floor(delay / 1000));

                return template.success(
                    delay ? `Set the slowmode in ${channel} to ${formatDuration(delay, DurationStyle.Blank)}.` : `Cleared the slowmode in ${channel}. `,
                    false,
                );
            }),
    );
