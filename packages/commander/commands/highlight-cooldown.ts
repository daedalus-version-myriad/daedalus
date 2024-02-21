import { trpc } from "../../api/index.js";
import { template, type Commands } from "../../bot-utils/index.js";
import { formatDuration, parseDuration } from "../../global-utils/index.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("highlight cooldown")
            .description("set the highlight cooldown (cooldown between consecutive highlights)")
            .stringOption("duration", "the new cooldown (default: 5 minutes)", { required: true })
            .fn(async ({ _, duration: _duration }) => {
                const duration = parseDuration(_duration);
                if (duration > 3600000) throw "The duration must be at most an hour.";

                await trpc.setHighlightTiming.mutate({ guild: _.guild!.id, user: _.user.id, time: duration, key: "cooldown" });

                return template.success(`The bot will wait ${formatDuration(duration)} between consecutive highlights in the same channel.`);
            }),
    );
