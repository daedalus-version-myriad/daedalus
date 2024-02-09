"use client";

import EnableModule from "@/components/EnableModule";
import MultiRoleSelector from "@/components/MultiRoleSelector";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import { GuildAutorolesSettings } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import save from "./save";

export function Body({ data: initial, disabled }: { data: GuildAutorolesSettings; disabled: boolean }) {
    const [data, setData] = useState<GuildAutorolesSettings>(initial);
    const [roles, setRoles] = useState<string[]>(data.roles);

    const updated = { guild: data.guild, roles };

    return (
        <>
            <EnableModule guild={data.guild} module="autoroles" disabled={disabled}></EnableModule>
            <Panel>
                <h1 className="text-xl">Autoroles</h1>
                <p>The selected roles will be automatically assigned to members when they join the server, including if they are rejoining.</p>
                <MultiRoleSelector roles={roles} setRoles={setRoles} showHigher></MultiRoleSelector>
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => setRoles(data.roles)}
                save={async () => {
                    const error = await save(updated);
                    if (error) return alert(error);
                    setData(updated);
                }}
            ></SaveChangesBar>
        </>
    );
}
