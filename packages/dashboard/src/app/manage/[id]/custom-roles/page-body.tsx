"use client";

import EnableModule from "@/components/EnableModule";
import MultiRoleSelector from "@/components/MultiRoleSelector";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleRoleSelector from "@/components/SingleRoleSelector";
import { Switch } from "@/components/ui/switch";
import { GuildCustomRolesSettings } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import save from "./save";

export function Body({ data: initial, disabled }: { data: GuildCustomRolesSettings; disabled: boolean }) {
    const [data, setData] = useState<GuildCustomRolesSettings>(initial);
    const [allowBoosters, setAllowBoosters] = useState<boolean>(data.allowBoosters);
    const [roles, setRoles] = useState<string[]>(data.roles);
    const [anchor, setAnchor] = useState<string | null>(data.anchor);

    const updated = { guild: data.guild, allowBoosters, roles, anchor };

    return (
        <>
            <EnableModule guild={data.guild} module="custom-roles" disabled={disabled}></EnableModule>
            <Panel>
                <h1 className="text-xl">Custom Role Permissions</h1>
                <div className="center-row gap-4">
                    <Switch checked={allowBoosters} onCheckedChange={setAllowBoosters}></Switch>
                    Allow Server Boosters
                </div>
                <MultiRoleSelector roles={roles} setRoles={setRoles} showEveryone showHigher showManaged></MultiRoleSelector>
            </Panel>
            <Panel>
                <h1 className="text-xl">Anchor</h1>
                <p>
                    Custom roles will be created below this role. If it is not set or is above the bot&apos;s highest role, custom roles will instead be created
                    at the bottom of the role list.
                </p>
                <SingleRoleSelector role={anchor} setRole={setAnchor} showHigher showManaged></SingleRoleSelector>
            </Panel>
            <p>
                <span className="text-muted-foreground">
                    <b>Important:</b> Each server can only have up to 250 roles (this is a Discord limitation). If your server reaches this limit, the bot will
                    be unable to provide more custom roles.
                </span>
            </p>
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
