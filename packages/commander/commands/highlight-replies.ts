import { trpc } from "../../api/index.js";
import { defer, template, type Commands } from "../../bot-utils/index.js";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("highlight replies")
            .description("toggle highlighting no-ping replies")
            .booleanOption("highlight", "if true, highlight if someone replies to your message without pinging", { required: true })
            .fn(defer(true))
            .fn(async ({ _, highlight }) => {
                await trpc.setHighlightReplies.mutate({ guild: _.guild!.id, user: _.user.id, replies: highlight });
                return template.success(`${highlight ? "Enabled" : "Disabled"} highlighting for no-ping replies.`);
            }),
    );
