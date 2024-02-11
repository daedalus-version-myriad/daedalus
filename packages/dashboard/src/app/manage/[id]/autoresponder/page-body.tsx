"use client";

import { DrawerDialog } from "@/components/DrawerDialog";
import EnableModule from "@/components/EnableModule";
import MessageEditor from "@/components/MessageEditor";
import MultiChannelSelector from "@/components/MultiChannelSelector";
import MultiRoleSelector from "@/components/MultiRoleSelector";
import NormalSelect from "@/components/NormalSelect";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleEmojiSelector from "@/components/SingleEmojiSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { applyIndex, removeIndex } from "@/lib/processors";
import { GuildAutoresponderSettings } from "@daedalus/types";
import _ from "lodash";
import React, { useState } from "react";
import { FaPencil, FaPlus, FaTrash } from "react-icons/fa6";
import save from "./save";

export function Body({ data: initial, disabled, limit }: { data: GuildAutoresponderSettings; disabled: boolean; limit: number }) {
    const [data, setData] = useState<GuildAutoresponderSettings>(initial);
    const [onlyInAllowedChannels, setOnlyInAllowedChannels] = useState<boolean>(data.onlyInAllowedChannels);
    const [onlyToAllowedRoles, setOnlyToAllowedRoles] = useState<boolean>(data.onlyToAllowedRoles);
    const [allowedChannels, setAllowedChannels] = useState<string[]>(data.allowedChannels);
    const [allowedRoles, setAllowedRoles] = useState<string[]>(data.allowedRoles);
    const [blockedChannels, setBlockedChannels] = useState<string[]>(data.blockedChannels);
    const [blockedRoles, setBlockedRoles] = useState<string[]>(data.blockedRoles);
    const [triggers, setTriggers] = useState<GuildAutoresponderSettings["triggers"]>(structuredClone(data.triggers));

    const updated = { guild: data.guild, onlyInAllowedChannels, onlyToAllowedRoles, allowedChannels, allowedRoles, blockedChannels, blockedRoles, triggers };

    return (
        <>
            <EnableModule guild={data.guild} module="autoresponder" disabled={disabled}></EnableModule>
            {triggers.length > limit ? (
                <p>
                    <b>Warning:</b> You have too many autoresponder triggers ({triggers.length} &gt; {limit}). The ones at the bottom of the list are disabled.
                    Please upgrade your plan or remove ones you do not need anymore.
                </p>
            ) : null}
            <Panel>
                <h1 className="text-xl">Restrictions</h1>
                <div className="center-row gap-4">
                    <Switch checked={onlyInAllowedChannels} onCheckedChange={setOnlyInAllowedChannels}></Switch>
                    <span>
                        <b>Only respond in allowed channels</b> (can be overridden)
                    </span>
                </div>
                <div className="center-row gap-4">
                    <Switch checked={onlyToAllowedRoles} onCheckedChange={setOnlyToAllowedRoles}></Switch>
                    <span>
                        <b>Only respond to allowed roles</b> (can be overridden)
                    </span>
                </div>
                <div className="grid grid-cols-[max-content_1fr] items-center gap-4">
                    <b>Allowed Channels:</b>
                    <MultiChannelSelector channels={allowedChannels} setChannels={setAllowedChannels}></MultiChannelSelector>
                    <b>Allowed Roles:</b>
                    <MultiRoleSelector roles={allowedRoles} setRoles={setAllowedRoles} showEveryone showHigher showManaged></MultiRoleSelector>
                    <b>Blocked Channels:</b>
                    <MultiChannelSelector channels={blockedChannels} setChannels={setBlockedChannels}></MultiChannelSelector>
                    <b>Blocked Roles:</b>
                    <MultiRoleSelector roles={blockedRoles} setRoles={setBlockedRoles} showEveryone showHigher showManaged></MultiRoleSelector>
                </div>
            </Panel>
            <Panel>
                <h1 className="text-xl">Triggers</h1>
                {triggers.length > 0 ? (
                    <div className="grid grid-cols-[repeat(4,max-content)] items-center gap-4">
                        {triggers.map((trigger, i) => {
                            function setTrigger(
                                fn: (trigger: GuildAutoresponderSettings["triggers"][number]) => GuildAutoresponderSettings["triggers"][number],
                            ) {
                                setTriggers((triggers) => applyIndex(triggers, i, fn));
                            }

                            return (
                                <React.Fragment key={`${i}`}>
                                    <Button variant="outline" onClick={() => setTriggers((triggers) => removeIndex(triggers, i))}>
                                        <FaTrash></FaTrash>
                                    </Button>
                                    <DrawerDialog
                                        trigger={
                                            <Button variant="outline">
                                                <FaPencil></FaPencil>
                                            </Button>
                                        }
                                    >
                                        <div>
                                            <Panel>
                                                <h1 className="text-xl">Match Configuration</h1>
                                                <div className="center-row gap-4">
                                                    <b className="whitespace-nowrap">Match Text:</b>
                                                    <Input
                                                        value={trigger.match}
                                                        onChange={({ currentTarget: { value } }) => setTrigger((trigger) => ({ ...trigger, match: value }))}
                                                        maxLength={4000}
                                                    ></Input>
                                                </div>
                                                <div className="center-row gap-8 flex-wrap">
                                                    <div className="center-row gap-4">
                                                        <Switch
                                                            checked={trigger.wildcard}
                                                            onCheckedChange={(wildcard) => setTrigger((trigger) => ({ ...trigger, wildcard }))}
                                                        ></Switch>
                                                        <span>
                                                            <b>Wildcard</b> (allow partial matches)
                                                        </span>
                                                    </div>
                                                    <div className="center-row gap-4">
                                                        <Switch
                                                            checked={trigger.caseInsensitive}
                                                            onCheckedChange={(caseInsensitive) => setTrigger((trigger) => ({ ...trigger, caseInsensitive }))}
                                                        ></Switch>
                                                        <b>Case Insensitive</b>
                                                    </div>
                                                    <div className="center-row gap-4">
                                                        <Switch
                                                            checked={trigger.respondToBotsAndWebhooks}
                                                            onCheckedChange={(respondToBotsAndWebhooks) =>
                                                                setTrigger((trigger) => ({ ...trigger, respondToBotsAndWebhooks }))
                                                            }
                                                        ></Switch>
                                                        <b>Respond to bots/webhooks</b>
                                                    </div>
                                                </div>
                                            </Panel>
                                            <Panel>
                                                <h1 className="text-xl">Response</h1>
                                                <div className="center-row gap-4">
                                                    <b>Reply Mode:</b>
                                                    <NormalSelect
                                                        value={trigger.replyMode}
                                                        setValue={(replyMode) => setTrigger((trigger) => ({ ...trigger, replyMode }))}
                                                        options={[
                                                            ["none", "None"],
                                                            ["normal", "Normal (no reply)"],
                                                            ["reply", "Reply (no ping)"],
                                                            ["ping-reply", "Reply (with ping)"],
                                                        ]}
                                                    ></NormalSelect>
                                                </div>
                                                <div className="center-row gap-4">
                                                    <b>Reaction (Emoji):</b>
                                                    <SingleEmojiSelector
                                                        emoji={trigger.reaction}
                                                        setEmoji={(reaction) => setTrigger((trigger) => ({ ...trigger, reaction }))}
                                                    ></SingleEmojiSelector>
                                                </div>
                                                <MessageEditor
                                                    data={trigger.message}
                                                    setData={(message) =>
                                                        !_.isEqual(message, trigger.message) && setTrigger((trigger) => ({ ...trigger, message }))
                                                    }
                                                ></MessageEditor>
                                            </Panel>
                                            <Panel>
                                                <h1 className="text-xl">Restrictions</h1>
                                                <div className="center-row gap-4">
                                                    <Switch
                                                        checked={trigger.onlyInAllowedChannels}
                                                        onCheckedChange={(onlyInAllowedChannels) =>
                                                            setTrigger((trigger) => ({ ...trigger, onlyInAllowedChannels }))
                                                        }
                                                    ></Switch>
                                                    <b>Only respond in allowed channels</b>
                                                </div>
                                                <div className="center-row gap-4">
                                                    <Switch
                                                        checked={trigger.onlyToAllowedRoles}
                                                        onCheckedChange={(onlyToAllowedRoles) => setTrigger((trigger) => ({ ...trigger, onlyToAllowedRoles }))}
                                                    ></Switch>
                                                    <b>Only respond to allowed roles</b>
                                                </div>
                                                <div className="center-row gap-4">
                                                    <Switch
                                                        checked={trigger.bypassDefaultChannelSettings}
                                                        onCheckedChange={(bypassDefaultChannelSettings) =>
                                                            setTrigger((trigger) => ({ ...trigger, bypassDefaultChannelSettings }))
                                                        }
                                                    ></Switch>
                                                    <b>Bypass default channel restrictions</b>
                                                </div>
                                                <div className="center-row gap-4">
                                                    <Switch
                                                        checked={trigger.bypassDefaultRoleSettings}
                                                        onCheckedChange={(bypassDefaultRoleSettings) =>
                                                            setTrigger((trigger) => ({ ...trigger, bypassDefaultRoleSettings }))
                                                        }
                                                    ></Switch>
                                                    <b>Bypass default role restrictions</b>
                                                </div>
                                                <div className="grid grid-cols-[max-content_1fr] items-center gap-4">
                                                    <b>Allowed Channels:</b>
                                                    <MultiChannelSelector
                                                        channels={trigger.allowedChannels}
                                                        setChannels={(allowedChannels) => setTrigger((trigger) => ({ ...trigger, allowedChannels }))}
                                                    ></MultiChannelSelector>
                                                    <b>Allowed Roles:</b>
                                                    <MultiRoleSelector
                                                        roles={trigger.allowedRoles}
                                                        setRoles={(allowedRoles) => setTrigger((trigger) => ({ ...trigger, allowedRoles }))}
                                                        showEveryone
                                                        showHigher
                                                        showManaged
                                                    ></MultiRoleSelector>
                                                    <b>Blocked Channels:</b>
                                                    <MultiChannelSelector
                                                        channels={trigger.blockedChannels}
                                                        setChannels={(blockedChannels) => setTrigger((trigger) => ({ ...trigger, blockedChannels }))}
                                                    ></MultiChannelSelector>
                                                    <b>Blocked Roles:</b>
                                                    <MultiRoleSelector
                                                        roles={trigger.blockedRoles}
                                                        setRoles={(blockedRoles) => setTrigger((trigger) => ({ ...trigger, blockedRoles }))}
                                                        showEveryone
                                                        showHigher
                                                        showManaged
                                                    ></MultiRoleSelector>
                                                </div>
                                            </Panel>
                                        </div>
                                    </DrawerDialog>
                                    <Switch
                                        checked={trigger.enabled}
                                        onCheckedChange={(enabled) => setTrigger((trigger) => ({ ...trigger, enabled }))}
                                    ></Switch>
                                    <span>{trigger.match}</span>
                                </React.Fragment>
                            );
                        })}
                    </div>
                ) : null}
                {triggers.length < limit ? (
                    <div>
                        <Button
                            variant="outline"
                            className="center-row gap-2"
                            onClick={() =>
                                setTriggers((triggers) => [
                                    ...triggers,
                                    {
                                        enabled: true,
                                        match: "",
                                        wildcard: false,
                                        caseInsensitive: true,
                                        respondToBotsAndWebhooks: false,
                                        replyMode: "reply",
                                        reaction: null,
                                        message: { content: "", embeds: [] },
                                        parsed: { content: [], embeds: [] },
                                        bypassDefaultChannelSettings: false,
                                        bypassDefaultRoleSettings: false,
                                        onlyInAllowedChannels: false,
                                        onlyToAllowedRoles: false,
                                        allowedChannels: [],
                                        allowedRoles: [],
                                        blockedChannels: [],
                                        blockedRoles: [],
                                    },
                                ])
                            }
                        >
                            <FaPlus></FaPlus> Add Autoresponder Trigger
                        </Button>
                    </div>
                ) : null}
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => {
                    setOnlyInAllowedChannels(data.onlyInAllowedChannels);
                    setOnlyToAllowedRoles(data.onlyToAllowedRoles);
                    setAllowedChannels(data.allowedChannels);
                    setAllowedRoles(data.allowedRoles);
                    setBlockedChannels(data.blockedChannels);
                    setBlockedRoles(data.blockedRoles);
                    setTriggers(structuredClone(data.triggers));
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
