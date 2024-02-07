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
import { Switch } from "@/components/ui/switch";
import { textTypes } from "@/lib/data";
import { applyIndex, removeIndex } from "@/lib/processors";
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
                    ) : null}
                </Panel>
            </div>
        </DrawerDialog>
    );
}
