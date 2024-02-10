"use client";

import EnableModule from "@/components/EnableModule";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyIndex, removeIndex } from "@/lib/processors";
import { GuildStatsChannelsSettings } from "@daedalus/types";
import _ from "lodash";
import React, { useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa6";
import save from "./save";

export function Body({ data: initial, disabled, limit }: { data: GuildStatsChannelsSettings; disabled: boolean; limit: number }) {
    const [data, setData] = useState<GuildStatsChannelsSettings>(initial);
    const [channels, setChannels] = useState<{ channel: string | null; format: string }[]>(structuredClone(data.channels));

    const updated = { guild: data.guild, channels };

    return (
        <>
            <EnableModule guild={data.guild} module="stats-channels" disabled={disabled}></EnableModule>
            {channels.length > limit ? (
                <p>
                    <b>Warning:</b> You have too many stats channels ({channels.length} &gt; {limit}). The ones at the bottom of the list are disabled. Please
                    upgrade your plan or remove ones you do not need anymore.
                </p>
            ) : null}
            <Panel>
                <p>
                    See{" "}
                    <a href="/docs/guides/custom-messages" className="link">
                        the docs
                    </a>{" "}
                    for how to format stats channel names.
                </p>
                {channels.length > 0 ? (
                    <div className="grid grid-cols-[repeat(2,max-content)_1fr] items-center gap-4">
                        {channels.map((channel, i) => (
                            <React.Fragment key={`${i}`}>
                                <Button variant="outline" onClick={() => setChannels((channels) => removeIndex(channels, i))}>
                                    <FaTrash></FaTrash>
                                </Button>
                                <SingleChannelSelector
                                    channel={channel.channel}
                                    setChannel={(channel) => setChannels((channels) => applyIndex(channels, i, (ch) => ({ ...ch, channel })))}
                                ></SingleChannelSelector>
                                <Input
                                    value={channel.format}
                                    className="min-w-60"
                                    onChange={({ currentTarget: { value } }) =>
                                        setChannels((channels) => applyIndex(channels, i, (ch) => ({ ...ch, format: value })))
                                    }
                                ></Input>
                            </React.Fragment>
                        ))}
                    </div>
                ) : null}
                {channels.length < limit ? (
                    <div>
                        <Button
                            variant="outline"
                            className="center-row gap-2"
                            onClick={() => setChannels((channels) => [...channels, { channel: null, format: "" }])}
                        >
                            <FaPlus></FaPlus> Add Stats Channel
                        </Button>
                    </div>
                ) : null}
            </Panel>
            <p>
                <span className="text-muted-foreground">Stats channels are updated every 5 minutes (at :00, :05, :10, etc. each hour).</span>
            </p>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => setChannels(structuredClone(data.channels))}
                save={async () => {
                    const error = await save(updated);
                    if (error) return alert(error);
                    setData(updated);
                }}
            ></SaveChangesBar>
        </>
    );
}
