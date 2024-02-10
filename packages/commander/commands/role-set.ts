import { trpc } from "@daedalus/api";
import { defer, template, type Commands } from "@daedalus/bot-utils";
import { getCustomRoleData } from "@daedalus/custom-roles";
import { logError } from "@daedalus/log-interface";
import { Colors } from "discord.js";

const colorMap = Object.fromEntries(Object.entries(Colors).map(([key, color]) => [key.toLowerCase(), color]));

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("role set")
            .description("set your custom role's name and color")
            .stringOption("name", "the new name")
            .stringOption("color", "the new color")
            .fn(defer(true))
            .fn(async ({ _, name, color: _color }) => {
                const { member, config, role: id } = await getCustomRoleData(_);

                let role = id === null ? null : await _.guild!.roles.fetch(id).catch(() => null);
                if (id && !role)
                    throw `An error occurred trying to fetch your custom role (<@&${id}>). If this role was deleted, please use **/role delete** to update this in the database; otherwise, please contact support if this issue persists.`;

                let color: number | undefined;

                if (_color) {
                    const native = colorMap[_color];

                    if (native) color = native;
                    else {
                        if (_color.startsWith("0x")) _color = _color.slice(2);
                        else if (_color.startsWith("#")) _color = _color.slice(1);

                        color = parseInt(_color, 16);
                    }

                    if (isNaN(color)) throw "Invalid color; expected a valid hex code or the name of a Discord color.";
                    if (color < 0 || color > 0xffffff) throw "Invalid color; hex code should be in the range of 0x000000 to 0xffffff.";
                }

                if (role) {
                    await role.edit({ name: name ?? undefined, color }).catch(() => {
                        throw `An error occurred trying to edit your role (${role}). Make sure the bot has permission to manage it.`;
                    });

                    return template.success(`Your custom role (${role}) has been updated.`);
                }

                let anchor = config.anchor === null ? null : await _.guild!.roles.fetch(config.anchor).catch(() => null);
                if (anchor && anchor.comparePositionTo((await _.guild!.members.fetchMe()).roles.highest) > 0) anchor = null;

                try {
                    role = await _.guild!.roles.create({ position: anchor?.position, name: name || "new role", color });
                } catch (error) {
                    await logError(_.guild!.id, "Assigning Custom Role", `${error}`);
                    throw "An unexpected error occurred trying to create your custom role. Make sure the bot has permission to manage roles.";
                }

                try {
                    await trpc.setCustomRole.mutate({ guild: _.guild!.id, user: _.user.id, role: role.id });
                } catch {
                    await role.delete().catch(() => null);
                    throw "An error occurred trying to bind your custom role to your account. This is either a database issue or was caused by attempting to set your custom role too quickly and resulting in the bot attempting to create two roles. Please try again and contact support if this issue continues to happen.";
                }

                await member.roles.add(role).catch(() => {
                    throw "An unexpected error occurred trying to add your custom role to your account. Make sure the bot has permission to manage members' roles.";
                });

                return template.success(`Your custom role (${role}) has been created.`);
            }),
    );
