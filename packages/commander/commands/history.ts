import { trpc } from "@daedalus/api";
import { checkPermissions, defer, getColor, isCommandDisabled, isModuleDisabled, pagify, timeinfo, type Commands } from "@daedalus/bot-utils";
import { formatDuration } from "@daedalus/global-utils";
import { ButtonStyle, ComponentType } from "discord.js";
import { historyActionStrings, historyVerbs } from "../lib/moderation.ts";

export default (x: Commands) =>
    x.slash((x) =>
        x
            .key("history")
            .description("view a user's history")
            .userOption("user", "the user to check", { required: true })
            .fn(defer(false))
            .fn(async ({ _, user }) => {
                if (!_.guild) throw "This command can only be run in a guild.";

                const entries = await trpc.getUserHistory.query({ guild: _.guild.id, user: user.id });
                const notes = await trpc.getUserNotes.query({ guild: _.guild.id, user: user.id });

                const components =
                    notes &&
                    !(await isModuleDisabled(_.guild.id, "moderation")) &&
                    !(await isCommandDisabled(_.guild.id, "notes")) &&
                    !(await checkPermissions(_.user, "notes", _.channel!))
                        ? [
                              {
                                  type: ComponentType.ActionRow,
                                  components: [
                                      {
                                          type: ComponentType.Button,
                                          style: ButtonStyle.Secondary,
                                          customId: `:${_.user.id}:notes/show:${user.id}`,
                                          label: "Show user's mod notes",
                                      },
                                  ],
                              },
                          ]
                        : [];

                const messages = [];

                let first = true;

                const color = await getColor(_.guild);

                while (first || entries.length > 0) {
                    first = false;

                    messages.push({
                        embeds: [
                            entries.length === 0
                                ? {
                                      title: `${user.tag}'s History`,
                                      description: `${user}'s history is clean.`,
                                      color,
                                  }
                                : {
                                      title: `${user.tag}'s History`,
                                      color,
                                      fields: await Promise.all(
                                          entries.splice(0, 5).map(async (entry) => ({
                                              name: `**${historyActionStrings[entry.type]}** #${entry.id}`,
                                              value: `**${historyVerbs[entry.type]} by <@${entry.mod}> at ${timeinfo(new Date(entry.time))}${
                                                  ["warn", "informal_warn", "kick"].includes(entry.type) || entry.duration === undefined
                                                      ? ""
                                                      : ` ${formatDuration(entry.duration ?? 0)}${entry.origin ? ` [here](${entry.origin})` : ""}`
                                              }**${entry.reason ? `\n\n**Reason:** ${entry.reason}` : " (no reason provided)"}`,
                                          })),
                                      ),
                                  },
                        ],
                        components,
                    });
                }

                await pagify(_, messages);
            }),
    );
