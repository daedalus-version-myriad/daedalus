"use client";

import EnableModule from "@/components/EnableModule";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { textTypes } from "@/lib/data";
import { applyIndex, removeIndex } from "@/lib/processors";
import { GuildRedditFeedsSettings } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa6";
import save from "./save";

export function Body({ data: initial, disabled, limit }: { data: GuildRedditFeedsSettings; disabled: boolean; limit: number }) {
    const [data, setData] = useState<GuildRedditFeedsSettings>(initial);
    const [feeds, setFeeds] = useState<{ subreddit: string; channel: string | null }[]>(data.feeds);

    const updated = { guild: data.guild, feeds };

    return (
        <>
            <EnableModule guild={data.guild} module="reddit-feeds" disabled={disabled}></EnableModule>
            {feeds.length > limit ? (
                <p>
                    <b>Warning:</b> You have too many Reddit feeds ({feeds.length} &gt; {limit}). The ones at the bottom of the list are disabled. Please
                    upgrade your plan or remove ones you do not need anymore.
                </p>
            ) : null}
            {feeds.map((feed, i) => (
                <Panel key={`${i}`}>
                    <div className="grid grid-cols-[max-content_1fr] items-center gap-4">
                        <b>Subreddit</b>
                        <Input
                            value={`r/${feed.subreddit}`}
                            onChange={({ currentTarget: { value } }) =>
                                setFeeds((feeds) => applyIndex(feeds, i, (feed) => ({ ...feed, subreddit: value.replace(/^r?\/?/, "") })))
                            }
                            className="w-60"
                        ></Input>
                        <b>Channel</b>
                        <SingleChannelSelector
                            channel={feed.channel}
                            setChannel={(channel) => setFeeds((feeds) => applyIndex(feeds, i, (feed) => ({ ...feed, channel })))}
                            types={textTypes}
                        ></SingleChannelSelector>
                    </div>
                    <div>
                        <Button variant="outline" onClick={() => setFeeds((feeds) => removeIndex(feeds, i))}>
                            <FaTrash></FaTrash>
                        </Button>
                    </div>
                </Panel>
            ))}
            {feeds.length < limit ? (
                <div>
                    <Button variant="outline" className="center-row gap-2" onClick={() => setFeeds((feeds) => [...feeds, { subreddit: "", channel: null }])}>
                        <FaPlus></FaPlus> Add Reddit Feed
                    </Button>
                </div>
            ) : null}
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => setFeeds(data.feeds)}
                save={async () => {
                    const error = await save(updated);
                    if (error) return alert(error);
                    setData(updated);
                }}
            ></SaveChangesBar>
        </>
    );
}
