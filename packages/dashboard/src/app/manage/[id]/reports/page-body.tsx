"use client";

import EnableModule from "@/components/EnableModule";
import MultiRoleSelector from "@/components/MultiRoleSelector";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import { Switch } from "@/components/ui/switch";
import { textTypes } from "@/lib/data";
import { GuildReportsSettings } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import save from "./save";

export function Body({ data: initial, disabled }: { data: GuildReportsSettings; disabled: boolean }) {
    const [data, setData] = useState<GuildReportsSettings>(initial);
    const [channel, setChannel] = useState<string | null>(data.channel);
    const [pingRoles, setPingRoles] = useState<string[]>(data.pingRoles);
    const [anon, setAnon] = useState<boolean>(data.anon);
    const [viewRoles, setViewRoles] = useState<string[]>(data.viewRoles);

    const updated = { guild: data.guild, channel, pingRoles, anon, viewRoles };

    return (
        <>
            <EnableModule guild={data.guild} module="reports" disabled={disabled}></EnableModule>
            <Panel>
                <h1 className="text-xl">Reports</h1>
                <h2 className="text-lg">Output Channel</h2>
                <SingleChannelSelector channel={channel} setChannel={setChannel} types={textTypes}></SingleChannelSelector>
                <h2 className="text-lg">Ping Roles</h2>
                <MultiRoleSelector roles={pingRoles} setRoles={setPingRoles} showEveryone showHigher showManaged></MultiRoleSelector>
                <div className="center-row gap-4">
                    <Switch checked={anon} onCheckedChange={setAnon}></Switch>
                    <b>Anonymous</b>
                </div>
                {anon ? (
                    <>
                        <h2 className="text-lg">Roles that can view anonymous reporters</h2>
                        <MultiRoleSelector roles={viewRoles} setRoles={setViewRoles} showEveryone showHigher showManaged></MultiRoleSelector>
                    </>
                ) : null}
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => {
                    setChannel(data.channel);
                    setPingRoles(data.pingRoles);
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
