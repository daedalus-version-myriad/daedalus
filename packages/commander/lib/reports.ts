import { trpc } from "@daedalus/api";
import { expand, getColor, template } from "@daedalus/bot-utils";
import {
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    Message,
    MessageContextMenuCommandInteraction,
    TextInputStyle,
    User,
    UserContextMenuCommandInteraction,
} from "discord.js";

export async function report(
    _: MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction | ChatInputCommandInteraction,
    object: Message | User,
) {
    if (object instanceof Message) {
        if (object.author.id === _.user.id) throw "You cannot flag your own messages.";
    } else if (object.id === _.user.id) throw "You cannot report yourself.";

    const config = await trpc.getReportsConfig.query(_.guild!.id);
    if (!config.channel) throw "Reports have not been set up in this server.";

    let channel = await _.guild!.channels.fetch(config.channel).catch(() => null);
    if (!channel?.isTextBased()) throw "Could not retrieve the report channel for this server.";

    const message = object instanceof Message;

    await _.showModal({
        customId: "report",
        title: message ? "Flag Message" : "Report User",
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.TextInput,
                        style: TextInputStyle.Paragraph,
                        customId: "reason",
                        required: !message,
                        label: "Reason for reporting",
                        placeholder: "You have 60 mintues to complete this operation. Only report actual rule violations.",
                        maxLength: 1024,
                    },
                ],
            },
        ],
    });

    const modal = await _.awaitModalSubmit({ time: 60 * 60 * 1000 }).catch(() => {});
    if (!modal) return;

    channel = await _.guild!.channels.fetch(config.channel).catch(() => null);
    if (!channel?.isTextBased()) return void (await modal.reply(template.error("Could not retrieve the report channel for this server.")));

    await modal.deferReply({ ephemeral: true });
    const reason = modal.fields.getTextInputValue("reason");

    const post = await channel.send({
        content: config.pingRoles.map((x) => `<@&${x}>`).join(" "),
        embeds: [
            {
                title: message ? "Message Flagged" : "User Reported",
                description: object instanceof Message ? object.content : `${expand(object)} was reported.`,
                color: await getColor(_.guild!),
                fields: [
                    ...(object instanceof Message ? [{ name: "Message Link", value: object.url }] : []),
                    ...(reason ? [{ name: "Reason", value: reason }] : [{ name: "No Reason Provided", value: "_ _" }]),
                ],
                author:
                    object instanceof Message
                        ? { name: object.author.tag, icon_url: object.author.displayAvatarURL({ size: 256 }) }
                        : { name: object.tag, icon_url: object.displayAvatarURL({ size: 256 }) },
                footer: {
                    text: config.anon
                        ? "Reporter hidden. Moderators can use the button below to view the reporter."
                        : `Reported by ${_.user.tag} (${_.user.id}).`,
                },
            },
        ],
        components: config.anon
            ? [
                  {
                      type: ComponentType.ActionRow,
                      components: [{ type: ComponentType.Button, style: ButtonStyle.Secondary, customId: "::reports/view", label: "View Reporter" }],
                  },
              ]
            : [],
        allowedMentions: { parse: ["roles"] },
    });

    if (config.anon) await trpc.addReporter.mutate({ message: post.id, user: _.user.id });
    await modal.editReply(template.success("Your report was submitted and will be reviewed soon."));
}
