import { template, type Commands } from "@daedalus/bot-utils";
import { getModmailContactInfo } from "@daedalus/modmail";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("modmail nsfw")
            .description("set the channel's NSFW status")
            .booleanOption("nsfw", "whether or not the channel should be marked as NSFW", { required: true })
            .fn(getModmailContactInfo(true))
            .fn(async ({ _, nsfw }) => {
                if (_.channel!.isDMBased()) throw "?";
                if (_.channel!.isThread()) throw "This feature only works in plain text channels and not threads.";
                if (nsfw && _.channel!.nsfw) throw "This thread is already marked as NSFW.";
                if (!nsfw && !_.channel!.nsfw) throw "This thread is not marked as NSFW.";

                await _.channel!.edit({ nsfw });
                return template.success(`This thread has been marked as ${nsfw ? "NSFW" : "SFW"}.`, false);
            }),
    );
