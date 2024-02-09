"use client";

import EnableModule from "@/components/EnableModule";
import MultiRoleSelector from "@/components/MultiRoleSelector";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import { GuildStickyRolesSettings } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import save from "./save";

export function Body({ data: initial, disabled }: { data: GuildStickyRolesSettings; disabled: boolean }) {
    const [data, setData] = useState<GuildStickyRolesSettings>(initial);
    const [roles, setRoles] = useState<string[]>(data.roles);

    const updated = { guild: data.guild, roles };

    return (
        <>
            <EnableModule guild={data.guild} module="sticky-roles" disabled={disabled}></EnableModule>
            <Panel>
                <h1 className="text-xl">Important Info</h1>
                <p>
                    All roles are sticky by default. When a user leaves the server, their roles will be stored, and when they rejoin, their stored roles will be
                    re-applied.
                </p>
                <p>
                    You may wish to exclude roles such as your staff roles. It is recommended to use this feature and have verification and mute roles enabled
                    for user convenience and server security.
                </p>
                <p>Note that all roles are saved, and excluded roles are excluded when the user rejoins. </p>
                <p>Any roles that the bot cannot manage (roles that are above the bot&apos;s highest role, managed roles, etc.) will be ignored.</p>
            </Panel>
            <Panel>
                <h1 className="text-xl">Excluded Roles</h1>
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
