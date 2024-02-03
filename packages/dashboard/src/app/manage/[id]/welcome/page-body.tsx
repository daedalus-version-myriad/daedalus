"use client";

import MessageEditor from "@/components/MessageEditor";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import { textTypes } from "@/lib/data";
import { GuildWelcomeSettings, MessageData } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import save from "./save";

export function Body({ data: initial }: { data: GuildWelcomeSettings }) {
    const [data, setData] = useState<GuildWelcomeSettings>(initial);
    const [channel, setChannel] = useState<string | null>(data.channel);
    const [message, setMessage] = useState<MessageData>(data.message);

    const updated = { guild: data.guild, channel, message };

    return (
        <>
            <Panel>
                <h1 className="text-xl">Welcome Channel</h1>
                <SingleChannelSelector channel={channel} setChannel={setChannel} showReadonly types={textTypes}></SingleChannelSelector>
                <h1 className="text-xl">Message Data</h1>
                <MessageEditor data={message} setData={setMessage}></MessageEditor>
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => {
                    setChannel(data.channel);
                    setMessage(data.message);
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
