import { trpc } from "@daedalus/api";
import { defer, template, type Commands } from "@daedalus/bot-utils";
import { getCustomRoleData } from "@daedalus/custom-roles";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("role delete")
            .description("delete your custom role")
            .fn(defer(true))
            .fn(async ({ _ }) => {
                const { member, role: id } = await getCustomRoleData(_);
                if (!id) throw "You do not have a custom role.";

                const role = await _.guild!.roles.fetch(id).catch(() => null);
                await role?.delete().catch(() => {
                    throw `Your custom role (${role}) could not be deleted. Make sure the bot has permission to manage it.`;
                });

                await trpc.deleteCustomRole.mutate({ guild: _.guild!.id, user: _.user.id });
                return template.success("Your custom role has been deleted.");
            }),
    );
