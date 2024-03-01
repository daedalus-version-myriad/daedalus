import { trpc } from "../../api/index.js";
import { Commands, defer, expand, template } from "../../bot-utils/index.js";

export default (x: Commands) =>
    x
        .slash((x) =>
            x
                .key("autokick allow")
                .description("Exempt a user from autokick, allowing them to join regardless of their account age.")
                .userOption("user", "the user to allow", { required: true })
                .fn(defer(true))
                .fn(async ({ _, user }) => {
                    await trpc.addAutokickExemption.mutate({ guild: _.guild!.id, user: user.id });
                    return template.success(`${expand(user)} is now permitted to join the server and will be exempt from the autokick policy.`);
                }),
        )
        .slash((x) =>
            x
                .key("autokick clear")
                .description("Clear a user's exemption from autokick, subjecting them to the account age limit if they join again.")
                .userOption("user", "the user to modify", { required: true })
                .fn(defer(true))
                .fn(async ({ _, user }) => {
                    await trpc.removeAutokickExemption.mutate({ guild: _.guild!.id, user: user.id });

                    return template.success(
                        `${expand(user)} is no longer exempted from autokick and will be kicked if they rejoin while their account is too new.`,
                    );
                }),
        );
