"use client";

import MessageEditor from "@/components/MessageEditor";
import Panel from "@/components/Panel";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import { GuildWelcomeSettings, MessageData } from "@daedalus/types";
import { useState } from "react";

export function Body({ data: initial }: { data: GuildWelcomeSettings }) {
    const [data, setData] = useState<GuildWelcomeSettings>(initial);
    const [channel, setChannel] = useState<string | null>(data.channel);
    const [message, setMessage] = useState<Omit<MessageData, "parsed">>(data.message);

    return (
        <>
            <Panel>
                <h1 className="text-xl">Welcome Channel</h1>
                <SingleChannelSelector channel={channel} setChannel={setChannel} showReadonly types={[0, 2, 5, 10, 11, 12, 13]}></SingleChannelSelector>
                <h1 className="text-xl">Message Data</h1>
                <MessageEditor data={message} setData={setMessage}></MessageEditor>
            </Panel>
        </>
    );
}
