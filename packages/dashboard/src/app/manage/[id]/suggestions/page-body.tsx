"use client";

import EnableModule from "@/components/EnableModule";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import { Switch } from "@/components/ui/switch";
import { textTypes } from "@/lib/data";
import { GuildSuggestionsSettings } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import save from "./save";

export function Body({ data: initial, disabled }: { data: GuildSuggestionsSettings; disabled: boolean }) {
    const [data, setData] = useState<GuildSuggestionsSettings>(initial);
    const [channel, setChannel] = useState<string | null>(data.channel);
    const [anon, setAnon] = useState<boolean>(data.anon);

    const updated = { guild: data.guild, channel, anon };

    return (
        <>
            <EnableModule guild={data.guild} module="suggestions" disabled={disabled}></EnableModule>
            <Panel>
                <h1 className="text-xl">Suggestions</h1>
                <h2 className="text-lg">Output Channel</h2>
                <SingleChannelSelector channel={channel} setChannel={setChannel} types={textTypes}></SingleChannelSelector>
                <div className="center-row gap-4">
                    <Switch checked={anon} onCheckedChange={setAnon}></Switch>
                    <b>Anonymous</b>
                </div>
                <p>
                    <span className="text-muted-foreground">
                        If suggestions are anonymous, a button will appear below suggestions that allows users with permission to use the <b>/suggestion</b>{" "}
                        command to view the author.
                    </span>
                </p>
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => {
                    setChannel(data.channel);
                    setAnon(data.anon);
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
