"use client";

import ColorPicker from "@/components/ColorPicker";
import MultiRoleSelector from "@/components/MultiRoleSelector";
import NormalSelect from "@/components/NormalSelect";
import Panel from "@/components/Panel";
import SingleRoleSelector from "@/components/SingleRoleSelector";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { GuildSettings } from "@daedalus/types";
import { useState } from "react";

export function Body({ data }: { data: GuildSettings }) {
    const [dashboardPermission, setDashboardPermission] = useState<string>(data.dashboardPermission);
    const [embedColor, setEmbedColor] = useState<number>(data.embedColor);
    const [muteRole, setMuteRole] = useState<string | null>(data.muteRole);
    const [banFooter, setBanFooter] = useState<string>(data.banFooter);
    const [modOnly, setModOnly] = useState<boolean>(data.modOnly);
    const [allowedRoles, setAllowedRoles] = useState<string[]>(data.allowedRoles);
    const [blockedRoles, setBlockedRoles] = useState<string[]>(data.blockedRoles);
    const [allowlistOnly, setAllowlistOnly] = useState<boolean>(data.allowlistOnly);
    const [allowedChannels, setAllowedChannels] = useState<string[]>(data.allowedChannels);
    const [blockedChannels, setBlockedChannels] = useState<string[]>(data.blockedChannels);

    return (
        <>
            <Panel>
                <h1 className="text-xl">Dashboard Permissions</h1>
                <p>
                    By default, the dashboard can be used by anyone with <b>Manage Server</b>. You can choose to restrict this further.
                </p>
                <NormalSelect
                    value={dashboardPermission}
                    setValue={setDashboardPermission}
                    options={[
                        ["owner", "Owner-only"],
                        ["admin", "Administrator"],
                        ["manager", "Manage Server (default)"],
                    ]}
                ></NormalSelect>
            </Panel>
            <Panel>
                <h1 className="text-xl">Embed Color</h1>
                <p>
                    This embed color is used for most command responses within your server as well as things like modmail messages and moderation messages to
                    users sent from your server. Other fixed colors will be used for things like logging where it makes sense (e.g. red for deletion).
                </p>
                <ColorPicker color={embedColor} setColor={setEmbedColor}></ColorPicker>
            </Panel>
            <Panel>
                <h1 className="text-xl">Mute Role</h1>
                <p>
                    This role is assigned by the <b>/mute</b> command and automod mute rules.
                </p>
                <SingleRoleSelector role={muteRole} setRole={setMuteRole}></SingleRoleSelector>
            </Panel>
            <Panel>
                <h1 className="text-xl">Ban Footer</h1>
                <p>
                    If this is set, this content will be included at the end of every ban message sent to users, including automod actions. For example, you can
                    link your ban appeal form here.
                </p>
                <Textarea
                    value={banFooter}
                    className="text-md"
                    maxLength={1024}
                    placeholder="Ban Footer"
                    onChange={(e) => setBanFooter(e.currentTarget.value)}
                ></Textarea>
                <span className="text-muted-foreground">{banFooter.length} / 1024</span>
            </Panel>
            <Panel>
                <h1 className="text-xl">Permissions</h1>
                <p>
                    Control permissions for the entire bot. To control permissions by each individual command, return to the server settings, go to a module and
                    click &quot;manage&quot; on a command card to edit its permission overrides.
                </p>
                <Panel>
                    <h2 className="text-lg">Role Permissions</h2>
                    <Label className="center-row gap-4">
                        <Switch checked={modOnly} onCheckedChange={setModOnly}></Switch>
                        <span>
                            <b>Entire Bot Mod Only</b> (only allowed roles may use any commands &mdash; cannot be overridden)
                        </span>
                    </Label>
                    <p>
                        Allowed Roles <span className="text-muted-foreground">(This is overridden by blocked roles.)</span>
                    </p>
                    <MultiRoleSelector roles={allowedRoles} setRoles={setAllowedRoles} showEveryone showHigher showManaged></MultiRoleSelector>
                    <p>
                        Blocked Roles <span className="text-muted-foreground">(This overrides allowed roles.)</span>
                    </p>
                    <MultiRoleSelector roles={blockedRoles} setRoles={setBlockedRoles} showEveryone showHigher showManaged></MultiRoleSelector>
                </Panel>
                <Panel>
                    <h2 className="text-lg">Channel Permissions</h2>
                    <Label className="center-row gap-4">
                        <Switch checked={allowlistOnly} onCheckedChange={setAllowlistOnly}></Switch>
                        <span>
                            <b>Allowlist Only</b> (commands can only be used in allowed channels &mdash; cannot be overridden)
                        </span>
                    </Label>
                    <p>
                        <span className="text-muted-foreground">
                            Note: If a channel is allowed but its parent category is blocked or vice versa, the channel&apos;s own settings will have priority.
                            If a channel is both allowed and blocked, it will be blocked.
                        </span>
                    </p>
                    <p>Allowed Channels</p>
                    <p>Blocked Channels</p>
                </Panel>
            </Panel>
        </>
    );
}
