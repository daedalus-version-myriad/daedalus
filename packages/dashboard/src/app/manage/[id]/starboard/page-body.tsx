"use client";

import EnableModule from "@/components/EnableModule";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import SingleEmojiSelector from "@/components/SingleEmojiSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { textTypes } from "@/lib/data";
import { applyIndex, removeIndex } from "@/lib/processors";
import { GuildStarboardSettings } from "@daedalus/types";
import _ from "lodash";
import React, { useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa6";
import save from "./save";

export function Body({ data: initial, disabled }: { data: GuildStarboardSettings; disabled: boolean }) {
    const [data, setData] = useState<GuildStarboardSettings>(initial);

    const [reaction, setReaction] = useState<string | null>(data.reaction);
    const [channel, setChannel] = useState<string | null>(data.channel);
    const [threshold, setThreshold] = useState<number>(data.threshold);
    const [overrides, setOverrides] = useState<GuildStarboardSettings["overrides"]>(structuredClone(data.overrides));

    const updated = { guild: data.guild, reaction, channel, threshold, overrides };

    return (
        <>
            <EnableModule guild={data.guild} module="starboard" disabled={disabled}></EnableModule>
            <Panel>
                <h1 className="text-xl">Reaction to Detect</h1>
                <SingleEmojiSelector emoji={reaction} setEmoji={setReaction}></SingleEmojiSelector>
                <h1 className="text-xl">Default Starboard Channel</h1>
                <SingleChannelSelector channel={channel} setChannel={setChannel} types={textTypes}></SingleChannelSelector>
                <h1 className="text-xl">Default Threshold</h1>
                <Input type="number" value={threshold || ""} onChange={({ currentTarget: { value } }) => setThreshold(+value ?? 0)} min={2}></Input>
            </Panel>
            <Panel>
                <h1 className="text-xl">Channel Overrides</h1>
                <div className="grid grid-cols-[repeat(5,max-content)] items-center gap-4">
                    <span></span>
                    <b>Channel</b>
                    <b>Enabled</b>
                    <b>Output Channel</b>
                    <b>Threshold</b>
                    {overrides.map((override, i) => {
                        function setOverride(fn: (o: typeof override) => typeof override) {
                            setOverrides((overrides) => applyIndex(overrides, i, fn));
                        }

                        return (
                            <React.Fragment key={`${i}`}>
                                <Button variant="outline" onClick={() => setOverrides((overrides) => removeIndex(overrides, i))}>
                                    <FaTrash></FaTrash>
                                </Button>
                                <SingleChannelSelector
                                    channel={override.channel}
                                    setChannel={(channel) => setOverride((override) => ({ ...override, channel }))}
                                    showReadonly
                                ></SingleChannelSelector>
                                <Switch
                                    checked={override.enabled}
                                    onCheckedChange={(enabled) => setOverride((override) => ({ ...override, enabled }))}
                                ></Switch>
                                <SingleChannelSelector
                                    channel={override.target}
                                    setChannel={(target) => setOverride((override) => ({ ...override, target }))}
                                    types={textTypes}
                                ></SingleChannelSelector>
                                <Input
                                    type="number"
                                    value={override.threshold ?? ""}
                                    onChange={({ currentTarget: { value } }) =>
                                        setOverride((override) => ({ ...override, threshold: !value ? null : +value ?? null }))
                                    }
                                    min={2}
                                ></Input>
                            </React.Fragment>
                        );
                    })}
                </div>
                <div>
                    <Button
                        variant="outline"
                        className="center-row gap-2"
                        onClick={() => setOverrides((overrides) => [...overrides, { channel: null, enabled: true, target: null, threshold: null }])}
                    >
                        <FaPlus></FaPlus> Add Override
                    </Button>
                </div>
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => {
                    setReaction(data.reaction);
                    setChannel(data.channel);
                    setThreshold(data.threshold);
                    setOverrides(structuredClone(data.overrides));
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
