"use client";

import EnableModule from "@/components/EnableModule";
import MultiRoleSelector from "@/components/MultiRoleSelector";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import { Switch } from "@/components/ui/switch";
import { GuildUtilitySettings } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import save from "./save";

export function Body({ data: initial, disabled }: { data: GuildUtilitySettings; disabled: boolean }) {
    const [data, setData] = useState<GuildUtilitySettings>(initial);
    const [roleCommandBlockByDefault, setRoleCommandBlockByDefault] = useState<boolean>(data.roleCommandBlockByDefault);
    const [roleCommandBlockedRoles, setRoleCommandBlockedRoles] = useState<string[]>(data.roleCommandBlockedRoles);
    const [roleCommandAllowedRoles, setRoleCommandAllowedRoles] = useState<string[]>(data.roleCommandAllowedRoles);
    const [roleCommandBypassRoles, setRoleCommandBypassRoles] = useState<string[]>(data.roleCommandBypassRoles);

    const updated = { guild: data.guild, roleCommandBlockByDefault, roleCommandBlockedRoles, roleCommandAllowedRoles, roleCommandBypassRoles };

    return (
        <>
            <EnableModule guild={data.guild} module="autoroles" disabled={disabled}></EnableModule>
            <Panel>
                <h1 className="text-xl">
                    Restrictions for <b>/roles</b>
                </h1>
                <p>
                    Control which roles moderators are allowed to add/remove using <b>/roles add</b> and <b>/roles remove</b>
                </p>
                <div className="center-row gap-4">
                    <Switch checked={roleCommandBlockByDefault} onCheckedChange={setRoleCommandBlockByDefault}></Switch>
                </div>
                <h2 className="text-lg">{roleCommandBlockByDefault ? "Allowed" : "Blocked"} Roles</h2>
                <MultiRoleSelector
                    roles={roleCommandBlockByDefault ? roleCommandAllowedRoles : roleCommandBlockedRoles}
                    setRoles={roleCommandBlockByDefault ? setRoleCommandAllowedRoles : setRoleCommandBlockedRoles}
                ></MultiRoleSelector>
                <h2 className="text-lg">Bypass Roles</h2>
                <p>
                    <span className="text-muted-foreground">
                        Users with these roles bypass the above restrictions but are not automatically granted permission to use the command.
                    </span>
                </p>
                <MultiRoleSelector roles={roleCommandBypassRoles} setRoles={setRoleCommandBypassRoles} showEveryone showHigher showManaged></MultiRoleSelector>
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => {
                    setRoleCommandBlockByDefault(data.roleCommandBlockByDefault);
                    setRoleCommandBlockedRoles(data.roleCommandBlockedRoles);
                    setRoleCommandAllowedRoles(data.roleCommandAllowedRoles);
                    setRoleCommandBypassRoles(data.roleCommandBypassRoles);
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
