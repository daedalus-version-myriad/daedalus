"use client";

import { DrawerDialog } from "@/components/DrawerDialog";
import EnableModule from "@/components/EnableModule";
import ListInput, { snowflakeFilter } from "@/components/ListInput";
import MultiChannelSelector from "@/components/MultiChannelSelector";
import MultiRoleSelector from "@/components/MultiRoleSelector";
import NormalSelect from "@/components/NormalSelect";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { textTypes } from "@/lib/data";
import { applyIndex, removeIndex } from "@/lib/processors";
import { formatDuration, parseDuration } from "@daedalus/global-utils";
import { GuildAutomodSettings } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import { FaPencil, FaPlus, FaTrash } from "react-icons/fa6";
import save from "./save";

export function Body({ data: initial, disabled, limit }: { data: GuildAutomodSettings; disabled: boolean; limit: number }) {
    const [data, setData] = useState<GuildAutomodSettings>(initial);
    const [ignoredChannels, setIgnoredChannels] = useState<string[]>(data.ignoredChannels);
    const [ignoredRoles, setIgnoredRoles] = useState<string[]>(data.ignoredRoles);
    const [defaultChannel, setDefaultChannel] = useState<string | null>(data.defaultChannel);
    const [interactWithWebhooks, setInteractWithWebhooks] = useState<boolean>(data.interactWithWebhooks);
    const [rules, setRules] = useState<GuildAutomodSettings["rules"]>(structuredClone(data.rules));

    const updated = { guild: data.guild, ignoredChannels, ignoredRoles, defaultChannel, interactWithWebhooks, rules };

    return (
        <>
            <EnableModule guild={data.guild} module="automod" disabled={disabled}></EnableModule>
            <Panel>
                <h1 className="text-xl">
                    Ignored Channels <span className="text-muted-foreground">(can be overridden)</span>
                </h1>
                <MultiChannelSelector channels={ignoredChannels} setChannels={setIgnoredChannels} showReadonly></MultiChannelSelector>
                <h1 className="text-xl">
                    Ignored Roles <span className="text-muted-foreground">(can be overridden)</span>
                </h1>
                <MultiRoleSelector roles={ignoredRoles} setRoles={setIgnoredRoles} showEveryone showHigher showManaged></MultiRoleSelector>
                <h1 className="text-xl">Default Report Channel</h1>
                <SingleChannelSelector channel={defaultChannel} setChannel={setDefaultChannel} types={textTypes}></SingleChannelSelector>
                <p>
                    <span className="text-muted-foreground">
                        If you&apos;re using a service like NQN or PluralKit that converts user messages into webhooks, you may wish to enable this setting,
                        which will make Daedalus scan webhook messages and delete them if the rule would have them deleted.
                    </span>
                </p>
                <Label className="center-row gap-2">
                    <Switch checked={interactWithWebhooks} onCheckedChange={setInteractWithWebhooks}></Switch>
                    Interact with webhooks
                </Label>
            </Panel>
            <Panel>
                <h1 className="text-xl">Automod Rules</h1>
                {rules.length > limit ? (
                    <p>
                        <b>Warning:</b> You have too many automod rules ({rules.length} &gt; {limit}). The ones at the bottom of the list are disabled. Please
                        upgrade your plan or remove ones you do not need anymore.
                    </p>
                ) : null}
                {rules.map((rule, i) => {
                    function setRule(fn: (rule: GuildAutomodSettings["rules"][number]) => GuildAutomodSettings["rules"][number]) {
                        setRules((rules) => applyIndex(rules, i, fn));
                    }

                    return (
                        <div key={`${i}`} className="center-row gap-4">
                            <Switch checked={rule.enable} onCheckedChange={(enable) => setRule((rule) => ({ ...rule, enable }))}></Switch>
                            <b>{rule.name}</b>
                            <Item rule={rule} setRule={setRule}></Item>
                            <Button variant="outline" onClick={() => setRules((rules) => removeIndex(rules, i))}>
                                <FaTrash></FaTrash>
                            </Button>
                        </div>
                    );
                })}
                {rules.length < limit ? (
                    <div>
                        <Button
                            variant="outline"
                            className="center-row gap-2"
                            onClick={() =>
                                setRules((rules) => [
                                    ...rules,
                                    {
                                        enable: true,
                                        name: "New Automod Rule",
                                        type: "blocked-terms",
                                        blockedTermsData: { terms: [] },
                                        blockedStickersData: { ids: [] },
                                        capsSpamData: { ratioLimit: 80, limit: 10 },
                                        newlineSpamData: { consecutiveLimit: 5, totalLimit: 15 },
                                        repeatedCharactersData: { consecutiveLimit: 20 },
                                        lengthLimitData: { limit: 1200 },
                                        emojiSpamData: { limit: 20, blockAnimatedEmoji: false },
                                        ratelimitData: { threshold: 5, timeInSeconds: 5 },
                                        attachmentSpamData: { threshold: 5, timeInSeconds: 5 },
                                        stickerSpamData: { threshold: 5, timeInSeconds: 5 },
                                        linkSpamData: { threshold: 5, timeInSeconds: 5 },
                                        inviteLinksData: { blockUnknown: false, allowed: [], blocked: [] },
                                        linkBlocklistData: { websites: [] },
                                        mentionSpamData: { perMessageLimit: 10, totalLimit: 10, timeInSeconds: 10, blockFailedEveryoneOrHere: false },
                                        reportToChannel: false,
                                        deleteMessage: false,
                                        notifyAuthor: false,
                                        reportChannel: null,
                                        additionalAction: "nothing",
                                        actionDuration: 0,
                                        disregardDefaultIgnoredChannels: false,
                                        disregardDefaultIgnoredRoles: false,
                                        onlyWatchEnabledChannels: false,
                                        onlyWatchEnabledRoles: false,
                                        ignoredChannels: [],
                                        ignoredRoles: [],
                                        watchedChannels: [],
                                        watchedRoles: [],
                                    },
                                ])
                            }
                        >
                            <FaPlus></FaPlus> Create Rule
                        </Button>
                    </div>
                ) : null}
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => {
                    setIgnoredChannels(data.ignoredChannels);
                    setIgnoredRoles(data.ignoredRoles);
                    setDefaultChannel(data.defaultChannel);
                    setInteractWithWebhooks(data.interactWithWebhooks);
                    setRules(structuredClone(data.rules));
                }}
                save={async () => {
                    const error = await save(updated);
                    if (error) return alert(error);
                    setData(updated);
                }}
            ></SaveChangesBar>
        </>
    );
}

function Item({
    rule,
    setRule,
}: {
    rule: GuildAutomodSettings["rules"][number];
    setRule: (fn: (rule: GuildAutomodSettings["rules"][number]) => GuildAutomodSettings["rules"][number]) => unknown;
}) {
    return (
        <DrawerDialog
            trigger={
                <Button variant="outline">
                    <FaPencil></FaPencil>
                </Button>
            }
        >
            <div>
                <Panel>
                    <h1 className="text-xl">Editing Automod Rule</h1>
                    <b>Name (for display on dashboard)</b>
                    <Input value={rule.name} onChange={({ currentTarget: { value } }) => setRule((rule) => ({ ...rule, name: value }))} maxLength={128}></Input>
                </Panel>
                <Panel>
                    <h1 className="text-xl">Rule Configuration</h1>
                    <div className="center-row gap-4">
                        <b>Type:</b>
                        <NormalSelect
                            value={rule.type}
                            setValue={(type) => setRule((rule) => ({ ...rule, type }))}
                            options={[
                                ["blocked-terms", "Blocked Terms"],
                                ["blocked-stickers", "Blocked Stickers"],
                                ["caps-spam", "Caps Spam"],
                                ["newline-spam", "Newline Spam"],
                                ["repeated-characters", "Repeated Characters"],
                                ["length-limit", "Length Limit"],
                                ["emoji-spam", "Emoji Spam"],
                                ["ratelimit", "Ratelimit"],
                                ["attachment-spam", "Attachment Spam"],
                                ["sticker-spam", "Sticker Spam"],
                                ["link-spam", "Link Spam"],
                                ["invite-links", "Invite Links"],
                                ["link-blocklist", "Link Blocklist"],
                                ["mention-spam", "Mention Spam"],
                            ]}
                        ></NormalSelect>
                    </div>
                    <Separator></Separator>
                    {rule.type === "blocked-terms" ? (
                        <>
                            <p>
                                <span className="text-muted-foreground">
                                    Enter words/phrases here. Put a <code>*</code> at the start and/or end of a term to detect partial matches. Each term must
                                    be at least three characters long (excluding <code>*</code>). All matches are case-insensitive.
                                </span>
                            </p>
                            <ListInput
                                list={rule.blockedTermsData.terms}
                                setList={(terms) => setRule((rule) => ({ ...rule, blockedTermsData: { terms } }))}
                                filter={(term) => {
                                    const item = term.trim();
                                    return item.match(/^\*\s|\s\*$/)
                                        ? "Wildcard must not be next to whitespace."
                                        : item.length - (item.startsWith("*") ? 1 : 0) - (item.endsWith("*") ? 1 : 0) >= 3
                                          ? null
                                          : "Terms must be at least three characters long.";
                                }}
                                limit={1000}
                            ></ListInput>
                        </>
                    ) : rule.type === "blocked-stickers" ? (
                        <>
                            <p>
                                <span className="text-muted-foreground">
                                    Enter the IDs of stickers to block here. To get a sticker&apos;s ID, you can enable Daedalus&apos; message logging and post
                                    the sticker and then delete it, and the log output will contain the sticker&apos;s ID.
                                </span>
                            </p>
                            <ListInput
                                list={rule.blockedStickersData.ids}
                                setList={(ids) => setRule((rule) => ({ ...rule, blockedStickersData: { ids } }))}
                                filter={snowflakeFilter}
                                limit={1000}
                            ></ListInput>
                        </>
                    ) : rule.type === "caps-spam" ? (
                        <>
                            <p>
                                <span className="text-muted-foreground">
                                    A message will be matched if <b>X</b>% or more of its letters are uppercase <u>and</u> it contains more than <b>Y</b>{" "}
                                    uppercase letters in total.
                                </span>
                            </p>
                            <div className="grid grid-cols-[repeat(2,max-content)] items-center gap-4">
                                <b>X</b>
                                <Input
                                    type="number"
                                    value={`${rule.capsSpamData.ratioLimit}`}
                                    onChange={({ currentTarget: { value } }) =>
                                        setRule((rule) => ({ ...rule, capsSpamData: { ...rule.capsSpamData, ratioLimit: +value ?? 0 } }))
                                    }
                                    min={40}
                                    max={100}
                                ></Input>
                                <b>Y</b>
                                <Input
                                    type="number"
                                    value={`${rule.capsSpamData.limit}`}
                                    onChange={({ currentTarget: { value } }) =>
                                        setRule((rule) => ({ ...rule, capsSpamData: { ...rule.capsSpamData, limit: +value ?? 0 } }))
                                    }
                                    min={1}
                                ></Input>
                            </div>
                            {rule.capsSpamData.ratioLimit < 40 ? (
                                <p>
                                    Required: <b>X</b> &ge; 40
                                </p>
                            ) : rule.capsSpamData.ratioLimit > 100 ? (
                                <p>
                                    Required: <b>X</b> &le; 100
                                </p>
                            ) : null}
                            {rule.capsSpamData.limit < 1 ? (
                                <p>
                                    Required: <b>Y</b> &ge; 1
                                </p>
                            ) : null}
                        </>
                    ) : rule.type === "newline-spam" ? (
                        <>
                            <p>
                                <span className="text-muted-foreground">
                                    A message will be matched if it contains more than <b>X</b> newlines in a row <u>or</u> more than <b>Y</b> newlines in
                                    total.
                                </span>
                            </p>
                            <div className="grid grid-cols-[repeat(2,max-content)] items-center gap-4">
                                <b>X</b>
                                <Input
                                    type="number"
                                    value={`${rule.newlineSpamData.consecutiveLimit}`}
                                    onChange={({ currentTarget: { value } }) =>
                                        setRule((rule) => ({ ...rule, newlineSpamData: { ...rule.newlineSpamData, consecutiveLimit: +value ?? 0 } }))
                                    }
                                    min={1}
                                ></Input>
                                <b>Y</b>
                                <Input
                                    type="number"
                                    value={`${rule.newlineSpamData.totalLimit}`}
                                    onChange={({ currentTarget: { value } }) =>
                                        setRule((rule) => ({ ...rule, newlineSpamData: { ...rule.newlineSpamData, totalLimit: +value ?? 0 } }))
                                    }
                                    min={1}
                                ></Input>
                            </div>
                            {rule.newlineSpamData.consecutiveLimit < 1 ? (
                                <p>
                                    Required: <b>X</b> &ge; 1
                                </p>
                            ) : null}
                            {rule.newlineSpamData.totalLimit < 1 ? (
                                <p>
                                    Required: <b>Y</b> &ge; 1
                                </p>
                            ) : null}
                        </>
                    ) : rule.type === "repeated-characters" ? (
                        <>
                            <p>
                                <span className="text-muted-foreground">
                                    A message will be matched if it contains more than <b>X</b> of the <u>same</u> character in a row.
                                </span>
                            </p>
                            <div className="grid grid-cols-[repeat(2,max-content)] items-center gap-4">
                                <b>X</b>
                                <Input
                                    type="number"
                                    value={`${rule.repeatedCharactersData.consecutiveLimit}`}
                                    onChange={({ currentTarget: { value } }) =>
                                        setRule((rule) => ({
                                            ...rule,
                                            repeatedCharactersData: { ...rule.repeatedCharactersData, consecutiveLimit: +value ?? 0 },
                                        }))
                                    }
                                    min={2}
                                ></Input>
                            </div>
                            {rule.repeatedCharactersData.consecutiveLimit < 2 ? (
                                <p>
                                    Required: <b>X</b> &ge; 2
                                </p>
                            ) : null}
                        </>
                    ) : rule.type === "length-limit" ? (
                        <>
                            <p>
                                <span className="text-muted-foreground">
                                    A message will be matched if it is more than <b>X</b> characters long.
                                </span>
                            </p>
                            <div className="grid grid-cols-[repeat(2,max-content)] items-center gap-4">
                                <b>X</b>
                                <Input
                                    type="number"
                                    value={`${rule.lengthLimitData.limit}`}
                                    onChange={({ currentTarget: { value } }) =>
                                        setRule((rule) => ({
                                            ...rule,
                                            lengthLimitData: { ...rule.lengthLimitData, limit: +value ?? 0 },
                                        }))
                                    }
                                    min={2}
                                ></Input>
                            </div>
                            {rule.lengthLimitData.limit < 2 ? (
                                <p>
                                    Required: <b>X</b> &ge; 2
                                </p>
                            ) : null}
                        </>
                    ) : rule.type === "emoji-spam" ? (
                        <>
                            <p>
                                <span className="text-muted-foreground">
                                    A message will be matched if it contains more than <b>X</b> emoji.
                                </span>
                            </p>
                            <div className="grid grid-cols-[repeat(2,max-content)] items-center gap-4">
                                <b>X</b>
                                <Input
                                    type="number"
                                    value={`${rule.emojiSpamData.limit}`}
                                    onChange={({ currentTarget: { value } }) =>
                                        setRule((rule) => ({
                                            ...rule,
                                            emojiSpamData: { ...rule.emojiSpamData, limit: +value ?? 0 },
                                        }))
                                    }
                                    min={2}
                                ></Input>
                            </div>
                            <div className="center-row gap-4">
                                <Switch
                                    checked={rule.emojiSpamData.blockAnimatedEmoji}
                                    onCheckedChange={(blockAnimatedEmoji) =>
                                        setRule((rule) => ({ ...rule, emojiSpamData: { ...rule.emojiSpamData, blockAnimatedEmoji } }))
                                    }
                                ></Switch>
                                Also block all animated emoji
                            </div>
                            {rule.emojiSpamData.limit < 2 ? (
                                <p>
                                    Required: <b>X</b> &ge; 2
                                </p>
                            ) : null}
                        </>
                    ) : rule.type === "ratelimit" || rule.type === "attachment-spam" || rule.type === "sticker-spam" || rule.type === "link-spam" ? (
                        (() => {
                            const key = (
                                {
                                    ratelimit: "ratelimitData",
                                    "attachment-spam": "attachmentSpamData",
                                    "sticker-spam": "stickerSpamData",
                                    "link-spam": "linkSpamData",
                                } as const
                            )[rule.type];

                            const text = (
                                {
                                    ratelimit: "messages",
                                    "attachment-spam": "attachments",
                                    "sticker-spam": "stickers",
                                    "link-spam": "links",
                                } as const
                            )[rule.type];

                            return (
                                <>
                                    <p>
                                        <span className="text-muted-foreground">
                                            If a user sends <b>X</b> {text} within <b>Y</b> seconds, all of them will be matched.
                                        </span>
                                    </p>
                                    <div className="grid grid-cols-[repeat(2,max-content)] items-center gap-4">
                                        <b>X</b>
                                        <Input
                                            type="number"
                                            value={`${rule[key].threshold}`}
                                            onChange={({ currentTarget: { value } }) =>
                                                setRule((rule) => ({
                                                    ...rule,
                                                    [key]: { ...rule[key], threshold: +value ?? 0 },
                                                }))
                                            }
                                            min={2}
                                        ></Input>
                                        <b>Y</b>
                                        <Input
                                            type="number"
                                            value={`${rule[key].timeInSeconds}`}
                                            onChange={({ currentTarget: { value } }) =>
                                                setRule((rule) => ({
                                                    ...rule,
                                                    [key]: { ...rule[key], timeInSeconds: +value ?? 0 },
                                                }))
                                            }
                                            min={1}
                                        ></Input>
                                    </div>
                                    {rule[key].threshold < 2 ? (
                                        <p>
                                            Required: <b>X</b> &ge; 2
                                        </p>
                                    ) : null}
                                    {rule[key].timeInSeconds < 1 ? (
                                        <p>
                                            Required: <b>Y</b> &ge; 1
                                        </p>
                                    ) : null}
                                </>
                            );
                        })()
                    ) : rule.type === "invite-links" ? (
                        <>
                            <div className="center-row gap-4">
                                <Switch
                                    checked={rule.inviteLinksData.blockUnknown}
                                    onCheckedChange={(blockUnknown) =>
                                        setRule((rule) => ({ ...rule, inviteLinksData: { ...rule.inviteLinksData, blockUnknown } }))
                                    }
                                ></Switch>
                                Block invites for all servers by default
                            </div>
                            <div>
                                <Panel>
                                    <p>
                                        <span className="text-muted-foreground">
                                            Enter the IDs of servers from which to <b>allow</b> invites.
                                        </span>
                                    </p>
                                    <ListInput
                                        list={rule.inviteLinksData.allowed}
                                        setList={(allowed) => setRule((rule) => ({ ...rule, inviteLinksData: { ...rule.inviteLinksData, allowed } }))}
                                        filter={snowflakeFilter}
                                        limit={1000}
                                    ></ListInput>
                                </Panel>
                                <Panel>
                                    <p>
                                        <span className="text-muted-foreground">
                                            Enter the IDs of servers from which to <b>block</b> invites.
                                        </span>
                                    </p>
                                    <ListInput
                                        list={rule.inviteLinksData.blocked}
                                        setList={(blocked) => setRule((rule) => ({ ...rule, inviteLinksData: { ...rule.inviteLinksData, blocked } }))}
                                        filter={snowflakeFilter}
                                        limit={1000}
                                    ></ListInput>
                                </Panel>
                            </div>
                        </>
                    ) : rule.type === "link-blocklist" ? (
                        <>
                            <p>
                                <span className="text-muted-foreground">
                                    Enter websites to block (e.g. <b>scam-link.com</b>, <b>website.com/path/to/scam</b>). All links matching it, including
                                    subdomains, will be matched; e.g. <b>scam.com</b> will block <b>also.scam.com</b>. Do not enter the schema (<b>https://</b>,
                                    etc.).
                                </span>
                            </p>
                            <ListInput
                                list={rule.linkBlocklistData.websites}
                                setList={(websites) => setRule((rule) => ({ ...rule, linkBlocklistData: { websites } }))}
                                filter={(x) =>
                                    x.match(/^\w+:\/\//)
                                        ? "Do not include the schema."
                                        : x.match(/.\../)
                                          ? null
                                          : "That does not look like a valid URL component."
                                }
                                limit={1000}
                            ></ListInput>
                        </>
                    ) : rule.type === "mention-spam" ? (
                        <>
                            <p>
                                <span className="text-muted-foreground">
                                    If a user sends more than <b>X</b> distinct messages in one message <u>or</u> sends messages containing <b>Y</b> total
                                    mentions in <b>Z</b> seconds, all messages will be matched.
                                </span>
                            </p>
                            <p>
                                <span className="text-muted-foreground">
                                    Pinging one user multiple times in one message counts only once, but repeatedly pinging the same user counts each message.
                                </span>
                            </p>
                            <div className="grid grid-cols-[repeat(2,max-content)] items-center gap-4">
                                <b>X</b>
                                <Input
                                    type="number"
                                    value={`${rule.mentionSpamData.perMessageLimit}`}
                                    onChange={({ currentTarget: { value } }) =>
                                        setRule((rule) => ({
                                            ...rule,
                                            mentionSpamData: { ...rule.mentionSpamData, perMessageLimit: +value ?? 0 },
                                        }))
                                    }
                                    min={2}
                                ></Input>
                                <b>Y</b>
                                <Input
                                    type="number"
                                    value={`${rule.mentionSpamData.totalLimit}`}
                                    onChange={({ currentTarget: { value } }) =>
                                        setRule((rule) => ({
                                            ...rule,
                                            mentionSpamData: { ...rule.mentionSpamData, totalLimit: +value ?? 0 },
                                        }))
                                    }
                                    min={1}
                                ></Input>
                                <b>Z</b>
                                <Input
                                    type="number"
                                    value={`${rule.mentionSpamData.timeInSeconds}`}
                                    onChange={({ currentTarget: { value } }) =>
                                        setRule((rule) => ({
                                            ...rule,
                                            mentionSpamData: { ...rule.mentionSpamData, timeInSeconds: +value ?? 0 },
                                        }))
                                    }
                                    min={1}
                                ></Input>
                            </div>
                            <div className="center-row gap-4">
                                <Switch
                                    checked={rule.mentionSpamData.blockFailedEveryoneOrHere}
                                    onCheckedChange={(blockFailedEveryoneOrHere) =>
                                        setRule((rule) => ({ ...rule, mentionSpamData: { ...rule.mentionSpamData, blockFailedEveryoneOrHere } }))
                                    }
                                ></Switch>
                                <span>
                                    Also match if a user tries pinging <b>@everyone</b> / <b>@here</b> without sufficient permissions
                                </span>
                            </div>
                            {rule.mentionSpamData.perMessageLimit < 2 ? (
                                <p>
                                    Required: <b>X</b> &ge; 2
                                </p>
                            ) : null}
                            {rule.mentionSpamData.totalLimit < 1 ? (
                                <p>
                                    Required: <b>Y</b> &ge; 1
                                </p>
                            ) : null}
                            {rule.mentionSpamData.timeInSeconds < 1 ? (
                                <p>
                                    Required: <b>Z</b> &ge; 1
                                </p>
                            ) : null}
                        </>
                    ) : null}
                </Panel>
                <Panel>
                    <h1 className="text-xl">Actions</h1>
                    <div className="center-row gap-8 flex-wrap">
                        <div className="center-row gap-4">
                            <Switch
                                checked={rule.reportToChannel}
                                onCheckedChange={(reportToChannel) => setRule((rule) => ({ ...rule, reportToChannel }))}
                            ></Switch>
                            Report to channel
                        </div>
                        <div className="center-row gap-4">
                            <Switch checked={rule.deleteMessage} onCheckedChange={(deleteMessage) => setRule((rule) => ({ ...rule, deleteMessage }))}></Switch>
                            Delete Message{["ratelimit", "attachment-spam", "sticker-spam", "link-spam", "mention-spam"].includes(rule.type) ? "s" : ""}
                        </div>
                        <div className="center-row gap-4">
                            <Switch checked={rule.notifyAuthor} onCheckedChange={(notifyAuthor) => setRule((rule) => ({ ...rule, notifyAuthor }))}></Switch>
                            Notify Author
                        </div>
                    </div>
                    <Separator></Separator>
                    <div className="grid grid-cols-[repeat(2,max-content)] items-center gap-4">
                        <b>Override Report Channel:</b>
                        <SingleChannelSelector
                            channel={rule.reportChannel}
                            setChannel={(reportChannel) => setRule((rule) => ({ ...rule, reportChannel }))}
                            types={textTypes}
                        ></SingleChannelSelector>
                        <b>Additional Action:</b>
                        <NormalSelect
                            value={rule.additionalAction}
                            setValue={(additionalAction) => setRule((rule) => ({ ...rule, additionalAction }))}
                            options={[
                                ["nothing", "Do Nothing Else"],
                                ["warn", "Log Formal Warning"],
                                ["mute", "Mute"],
                                ["timeout", "Timeout"],
                                ["kick", "Kick"],
                                ["ban", "Ban"],
                            ]}
                        ></NormalSelect>
                        {["mute", "timeout", "ban"].includes(rule.additionalAction) ? (
                            <>
                                <b>Duration of Punishment:</b>
                                <div className="center-row gap-4">
                                    {formatDuration(rule.actionDuration || Infinity)}
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const input = prompt("Enter a new duration (e.g. 20h, 3 days 12 hours, forever).");
                                            if (!input) return;

                                            try {
                                                const actionDuration = parseDuration(input) || Infinity;
                                                if (rule.additionalAction === "timeout" && actionDuration > 2419200000)
                                                    throw "Timeouts can only last up to 28 days.";
                                                setRule((rule) => ({ ...rule, actionDuration }));
                                            } catch (error) {
                                                alert(error);
                                            }
                                        }}
                                    >
                                        <FaPencil></FaPencil>
                                    </Button>
                                </div>
                            </>
                        ) : null}
                    </div>
                    {rule.additionalAction === "timeout" && (rule.actionDuration || Infinity) > 2419200000 ? (
                        <p>
                            Error: Timeouts can only last up to <b>28 days</b>.
                        </p>
                    ) : null}
                </Panel>
                <Panel>
                    <h1 className="text-xl">Restrictions</h1>
                    <div className="center-row gap-8">
                        <div className="center-row gap-4">
                            <Switch
                                checked={rule.disregardDefaultIgnoredChannels}
                                onCheckedChange={(ch) => setRule((rule) => ({ ...rule, disregardDefaultIgnoredChannels: ch }))}
                            ></Switch>
                            Disregard Default Ignored Channels
                        </div>
                        <div className="center-row gap-4">
                            <Switch
                                checked={rule.disregardDefaultIgnoredRoles}
                                onCheckedChange={(ch) => setRule((rule) => ({ ...rule, disregardDefaultIgnoredRoles: ch }))}
                            ></Switch>
                            Disregard Default Ignored Roles
                        </div>
                        <div className="center-row gap-4">
                            <Switch
                                checked={rule.onlyWatchEnabledChannels}
                                onCheckedChange={(ch) => setRule((rule) => ({ ...rule, onlyWatchEnabledChannels: ch }))}
                            ></Switch>
                            Only Watch Enabled Channels
                        </div>
                        <div className="center-row gap-4">
                            <Switch
                                checked={rule.onlyWatchEnabledRoles}
                                onCheckedChange={(ch) => setRule((rule) => ({ ...rule, onlyWatchEnabledRoles: ch }))}
                            ></Switch>
                            Only Watch Enabled Roles
                        </div>
                    </div>
                    <Separator></Separator>
                    <h2 className="text-lg">Ignored Channels</h2>
                    <MultiChannelSelector
                        channels={rule.ignoredChannels}
                        setChannels={(ignoredChannels) => setRule((rule) => ({ ...rule, ignoredChannels }))}
                        showReadonly
                    ></MultiChannelSelector>
                    <h2 className="text-lg">Ignored Roles</h2>
                    <MultiRoleSelector
                        roles={rule.ignoredRoles}
                        setRoles={(ignoredRoles) => setRule((rule) => ({ ...rule, ignoredRoles }))}
                        showEveryone
                        showHigher
                        showManaged
                    ></MultiRoleSelector>
                    <h2 className="text-lg">Watched Channels</h2>
                    <MultiChannelSelector
                        channels={rule.watchedChannels}
                        setChannels={(watchedChannels) => setRule((rule) => ({ ...rule, watchedChannels }))}
                        showReadonly
                    ></MultiChannelSelector>
                    <h2 className="text-lg">Watched Roles</h2>
                    <MultiRoleSelector
                        roles={rule.watchedRoles}
                        setRoles={(watchedRoles) => setRule((rule) => ({ ...rule, watchedRoles }))}
                        showEveryone
                        showHigher
                        showManaged
                    ></MultiRoleSelector>
                </Panel>
            </div>
        </DrawerDialog>
    );
}
