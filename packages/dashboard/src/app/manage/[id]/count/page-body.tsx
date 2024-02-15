"use client";

import EnableModule from "@/components/EnableModule";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { textTypes } from "@/lib/data";
import { applyIndex, removeIndex } from "@/lib/processors";
import { GuildCountSettings } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa6";
import save from "./save";

export function Body({ data: initial, disabled, limit }: { data: GuildCountSettings<true>; disabled: boolean; limit: number }) {
    const [data, setData] = useState<GuildCountSettings<true>>(initial);
    const [channels, setChannels] = useState<GuildCountSettings<true>["channels"]>(structuredClone(data.channels));

    const updated = { guild: data.guild, channels };

    return (
        <>
            <EnableModule guild={data.guild} module="autoroles" disabled={disabled}></EnableModule>
            {channels.length > limit ? (
                <p>
                    <b>Warning:</b> You have too many counting channels ({channels.length} &gt; {limit}). The ones at the bottom of the list are disabled.
                    Please upgrade your plan or remove ones you do not need anymore.
                </p>
            ) : null}
            {channels.map((channel, i) => {
                function setChannel(fn: (channel: GuildCountSettings<true>["channels"][number]) => GuildCountSettings<true>["channels"][number]) {
                    setChannels((channels) => applyIndex(channels, i, fn));
                }

                return (
                    <Panel key={`${i}`}>
                        <div className="grid grid-cols-[max-content_1fr] items-center gap-4">
                            <b>Channel</b>
                            <SingleChannelSelector
                                channel={channel.channel}
                                setChannel={(channel) => setChannel((ch) => ({ ...ch, channel }))}
                                showReadonly
                                types={textTypes}
                            ></SingleChannelSelector>
                            <b>Interval</b>
                            <Input
                                type="number"
                                value={channel.interval}
                                onChange={({ currentTarget: { value } }) => setChannel((channel) => ({ ...channel, interval: +value }))}
                                className="w-60"
                            ></Input>
                            <b>Next Value</b>
                            <Input
                                type="number"
                                value={channel.next}
                                onChange={({ currentTarget: { value } }) => setChannel((channel) => ({ ...channel, next: +value }))}
                                className="w-60"
                            ></Input>
                            <b>Allow Double-Counting</b>
                            <Switch
                                checked={channel.allowDoubleCounting}
                                onCheckedChange={(ch) => setChannel((channel) => ({ ...channel, allowDoubleCounting: ch }))}
                            ></Switch>
                        </div>
                        <div>
                            <Button variant="outline" onClick={() => setChannels((channels) => removeIndex(channels, i))}>
                                <FaTrash></FaTrash>
                            </Button>
                        </div>
                    </Panel>
                );
            })}
            {channels.length < limit ? (
                <div>
                    <Button
                        variant="outline"
                        className="center-row gap-2"
                        onClick={() => setChannels((channels) => [...channels, { id: -1, channel: null, interval: 1, next: 1, allowDoubleCounting: false }])}
                    >
                        <FaPlus></FaPlus> Add Counting Channel
                    </Button>
                </div>
            ) : null}
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => setChannels(data.channels)}
                save={async () => {
                    const [error, output] = (await save(updated)) ?? [null, data];
                    if (error) return alert(error);
                    setData(output);
                    setChannels(structuredClone(output.channels));
                }}
            ></SaveChangesBar>
        </>
    );
}
