"use client";

import EnableModule from "@/components/EnableModule";
import MultiChannelSelector from "@/components/MultiChannelSelector";
import MultiRoleSelector from "@/components/MultiRoleSelector";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { textTypes } from "@/lib/data";
import { GuildNukeguardSettings } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import save from "./save";

export function Body({ data: initial, disabled }: { data: GuildNukeguardSettings; disabled: boolean }) {
    const [data, setData] = useState<GuildNukeguardSettings>(initial);
    const [adminChannel, setAdminChannel] = useState<string | null>(data.adminChannel);
    const [pingRoles, setPingRoles] = useState<string[]>(data.pingRoles);
    const [pingHere, setPingHere] = useState<boolean>(data.pingHere);
    const [exemptedRoles, setExemptedRoles] = useState<string[]>(data.exemptedRoles);
    const [watchChannelsByDefault, setWatchChannelsByDefault] = useState<boolean>(data.watchChannelsByDefault);
    const [ignoredChannels, setIgnoredChannels] = useState<string[]>(data.ignoredChannels);
    const [watchedChannels, setWatchedChannels] = useState<string[]>(data.watchedChannels);
    const [watchRolesByDefault, setWatchRolesByDefault] = useState<boolean>(data.watchRolesByDefault);
    const [ignoredRoles, setIgnoredRoles] = useState<string[]>(data.ignoredRoles);
    const [watchedRoles, setWatchedRoles] = useState<string[]>(data.watchedRoles);
    const [watchEmoji, setWatchEmoji] = useState<boolean>(data.watchEmoji);
    const [watchStickers, setWatchStickers] = useState<boolean>(data.watchStickers);
    const [watchSounds, setWatchSounds] = useState<boolean>(data.watchSounds);
    const [preventWebhookCreation, setPreventWebhookCreation] = useState<boolean>(data.preventWebhookCreation);
    const [watchWebhookDeletion, setWatchWebhookDeletion] = useState<boolean>(data.watchWebhookDeletion);
    const [enableRatelimit, setEnableRatelimit] = useState<boolean>(data.enableRatelimit);
    const [ratelimitKicking, setRatelimitKicking] = useState<boolean>(data.ratelimitKicking);
    const [ratelimitThreshold, setRatelimitThreshold] = useState<number | null>(data.ratelimitThreshold);
    const [ratelimitTime, setRatelimitTime] = useState<number | null>(data.ratelimitTime);
    const [restrictRolesLenient, setRestrictRolesLenient] = useState<boolean>(data.restrictRolesLenient);
    const [restrictRolesByDefault, setRestrictRolesByDefault] = useState<boolean>(data.restrictRolesByDefault);
    const [restrictRolesAllowedRoles, setRestrictRolesAllowedRoles] = useState<string[]>(data.restrictRolesAllowedRoles);
    const [restrictRolesBlockedRoles, setRestrictRolesBlockedRoles] = useState<string[]>(data.restrictRolesBlockedRoles);

    const updated = {
        guild: data.guild,
        adminChannel,
        pingRoles,
        pingHere,
        exemptedRoles,
        watchChannelsByDefault,
        ignoredChannels,
        watchedChannels,
        watchRolesByDefault,
        ignoredRoles,
        watchedRoles,
        watchEmoji,
        watchStickers,
        watchSounds,
        preventWebhookCreation,
        watchWebhookDeletion,
        enableRatelimit,
        ratelimitKicking,
        ratelimitThreshold,
        ratelimitTime,
        restrictRolesLenient,
        restrictRolesByDefault,
        restrictRolesAllowedRoles,
        restrictRolesBlockedRoles,
    };

    return (
        <>
            <EnableModule guild={data.guild} module="autoroles" disabled={disabled}></EnableModule>
            <Panel>
                <h1 className="text-xl">Nukeguard</h1>
                <p>Unless specified otherwise, when nukeguard triggers, the violator will be banned from the server and the admin channel will be alerted.</p>
                <p>
                    You can exempt roles to allow them to take any actions. Only users with exempted roles will be able to edit the nukeguard configuration,
                    even if they can manage the rest of the dashboard.
                </p>
            </Panel>
            <Panel>
                <h1 className="text-xl">Configuration</h1>
                <h2 className="text-lg">Admin Channel</h2>
                <SingleChannelSelector channel={adminChannel} setChannel={setAdminChannel} types={textTypes}></SingleChannelSelector>
                <h2 className="text-lg">Ping Roles</h2>
                <MultiRoleSelector roles={pingRoles} setRoles={setPingRoles} showEveryone showHigher showManaged></MultiRoleSelector>
                <h2 className="text-lg">
                    Ping <code>@here</code>
                </h2>
                <Switch checked={pingHere} onCheckedChange={setPingHere}></Switch>
                <h2 className="text-lg">Exempted Roles</h2>
                <MultiRoleSelector roles={exemptedRoles} setRoles={setExemptedRoles} showEveryone showHigher showManaged></MultiRoleSelector>
            </Panel>
            <Panel>
                <h1 className="text-xl">Deletion Detection</h1>
                <p>This rule detects the deletion of supervised entities.</p>
                <div>
                    <Panel>
                        <h2 className="text-lg">Channels</h2>
                        <p>
                            You generally shouldn&apos;t give your mods Manage Channels. It&apos;s risky, and mods usually don&apos;t need to create, delete, or
                            edit channels. The only exception is the use of slowmode, but you can give them access to the <b>/slowmode</b> command instead.
                        </p>
                        <p>If a channel is both explicitly watched and ignored, it will be watched.</p>
                        <div className="center-row gap-4">
                            <Switch checked={watchChannelsByDefault} onCheckedChange={setWatchChannelsByDefault}></Switch>
                            <b>Watch All Channels By Default</b>
                        </div>
                        <b>Ignored Channels</b>
                        <MultiChannelSelector channels={ignoredChannels} setChannels={setIgnoredChannels} showReadonly></MultiChannelSelector>
                        <b>Watched Channels</b>
                        <MultiChannelSelector channels={watchedChannels} setChannels={setWatchedChannels} showReadonly></MultiChannelSelector>
                    </Panel>
                    <Panel>
                        <h2 className="text-lg">Roles</h2>
                        <p>
                            You generally shouldn&apos;t give your mods Manage Roles. It&apos;s risky, and mods usually don&apos;t need to create, delete, or
                            edit roles. The exception is to add/remove certain roles, but you can give them access to the <b>/roles</b> command, which only
                            allows for assignment/removal and allows you to restrict which roles can be managed.
                        </p>
                        <p>If a role is both explicitly watched and ignored, it will be watched.</p>
                        <div className="center-row gap-4">
                            <Switch checked={watchRolesByDefault} onCheckedChange={setWatchRolesByDefault}></Switch>
                            <b>Watch All Roles By Default</b>
                        </div>
                        <b>{watchRolesByDefault ? "Ignored" : "Watched"} Roles</b>
                        <MultiRoleSelector
                            roles={watchRolesByDefault ? ignoredRoles : watchedRoles}
                            setRoles={watchRolesByDefault ? setIgnoredRoles : setWatchedRoles}
                            showHigher
                        ></MultiRoleSelector>
                    </Panel>
                    <Panel>
                        <h2 className="text-lg">Guild Expressions</h2>
                        <p>
                            You generally shouldn&apos;t give your mods Manage Guild Expressions. It&apos;s not the most risky, but you can just approve and
                            upload server assets yourself.
                        </p>
                        <div className="center-row gap-x-8 gap-y-2 flex-wrap">
                            <div className="center-row gap-4">
                                <Switch checked={watchEmoji} onCheckedChange={setWatchEmoji}></Switch>
                                <b>Watch Emoji</b>
                            </div>
                            <div className="center-row gap-4">
                                <Switch checked={watchStickers} onCheckedChange={setWatchStickers}></Switch>
                                <b>Watch Stickers</b>
                            </div>
                            <div className="center-row gap-4">
                                <Switch checked={watchSounds} onCheckedChange={setWatchSounds}></Switch>
                                <b>Watch Sounds*</b>
                            </div>
                        </div>
                        <p>
                            *This doesn&apos;t currently work because the Discord API does not make sounds available to bots. However, if you enable this
                            setting, it will automatically come into effect as soon as the necessary updates are made.
                        </p>
                    </Panel>
                </div>
            </Panel>
            <Panel>
                <h1 className="text-xl">Webhooks</h1>
                <p>
                    Instead of giving your mods Manage Webhooks, consider pinning a list of webhooks URLs somewhere. You can still delete a webhook with only
                    its url, even without permissions, which is unavoidable.
                </p>
                <p>If a webhook is deleted or edited using its URL through an API call to the webhook itself, it is impossible to detect who did it.</p>
                <div className="center-row gap-x-8 gap-y-2 flex-wrap">
                    <div className="center-row gap-4">
                        <Switch checked={preventWebhookCreation} onCheckedChange={setPreventWebhookCreation}></Switch>
                        <b>Prevent Webhook Creation*</b>
                    </div>
                    <div className="center-row gap-4">
                        <Switch checked={watchWebhookDeletion} onCheckedChange={setWatchWebhookDeletion}></Switch>
                        <b>Watch Webhook Deletion</b>
                    </div>
                </div>
                <p>*This instantly deletes webhooks that are created but does not ban the user.</p>
            </Panel>
            <Panel>
                <h1 className="text-xl">Ratelimit</h1>
                <p>
                    This rule triggers if a user bans users too quickly. Use of the <b>/ban</b> command is not observed, as this is mostly to avoid a hacked
                    account banning users faster than humanly possible.
                </p>
                <p>This rule does not apply to bots to avoid conflicting with deliberate mass-ban features.</p>
                <div className="center-row gap-x-8 gap-y-2 flex-wrap">
                    <div className="center-row gap-4">
                        <Switch checked={enableRatelimit} onCheckedChange={setEnableRatelimit}></Switch>
                        <b>Enable Ratelimiting</b>
                    </div>
                    <div className="center-row gap-4">
                        <Switch checked={ratelimitKicking} onCheckedChange={setRatelimitKicking}></Switch>
                        <b>Also Ratelimit Kicking</b>
                    </div>
                </div>
                <p>
                    Triggers if a user bans {ratelimitKicking ? "or kicks" : ""} more than <b>X</b> users within <b>Y</b> seconds.
                </p>
                <div className="grid grid-cols-[max-content_1fr] items-center gap-4">
                    <b>X</b>
                    <Input
                        type="number"
                        value={ratelimitThreshold === null ? "" : ratelimitThreshold}
                        onChange={({ currentTarget: { value } }) => setRatelimitThreshold(value ? +value : null)}
                        min={2}
                        className="max-w-60"
                    ></Input>
                    <b>Y</b>
                    <Input
                        type="number"
                        value={ratelimitTime === null ? "" : ratelimitTime}
                        onChange={({ currentTarget: { value } }) => setRatelimitTime(value ? +value : null)}
                        min={1}
                        className="max-w-60"
                    ></Input>
                </div>
            </Panel>
            <Panel>
                <h1 className="text-xl">Restrict Role Assignment</h1>
                <p>
                    The <b>/roles add</b> command will <b>not</b> respect these restrictions. You can restrict it manually in the <b>Utility</b> module
                    settings.
                </p>
                <div className="center-row gap-x-8 gap-y-2 flex-wrap">
                    <div className="center-row gap-2">
                        <Switch checked={restrictRolesLenient} onCheckedChange={setRestrictRolesLenient}></Switch>
                        <b>Lenient Mode*</b>
                    </div>
                    <div className="center-row gap-2">
                        <Switch checked={restrictRolesByDefault} onCheckedChange={setRestrictRolesByDefault}></Switch>
                        <b>Block All Roles By Default</b>
                    </div>
                </div>
                <b>{restrictRolesByDefault ? "Allowed" : "Blocked"} Roles</b>
                <MultiRoleSelector
                    roles={restrictRolesByDefault ? restrictRolesAllowedRoles : restrictRolesBlockedRoles}
                    setRoles={restrictRolesByDefault ? setRestrictRolesAllowedRoles : setRestrictRolesBlockedRoles}
                    showHigher
                ></MultiRoleSelector>
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => {
                    setAdminChannel(data.adminChannel);
                    setPingRoles(data.pingRoles);
                    setPingHere(data.pingHere);
                    setExemptedRoles(data.exemptedRoles);
                    setWatchChannelsByDefault(data.watchChannelsByDefault);
                    setIgnoredChannels(data.ignoredChannels);
                    setWatchedChannels(data.watchedChannels);
                    setWatchRolesByDefault(data.watchRolesByDefault);
                    setIgnoredRoles(data.ignoredRoles);
                    setWatchedRoles(data.watchedRoles);
                    setWatchEmoji(data.watchEmoji);
                    setWatchStickers(data.watchStickers);
                    setWatchSounds(data.watchSounds);
                    setPreventWebhookCreation(data.preventWebhookCreation);
                    setWatchWebhookDeletion(data.watchWebhookDeletion);
                    setEnableRatelimit(data.enableRatelimit);
                    setRatelimitKicking(data.ratelimitKicking);
                    setRatelimitThreshold(data.ratelimitThreshold);
                    setRatelimitTime(data.ratelimitTime);
                    setRestrictRolesLenient(data.restrictRolesLenient);
                    setRestrictRolesByDefault(data.restrictRolesByDefault);
                    setRestrictRolesAllowedRoles(data.restrictRolesAllowedRoles);
                    setRestrictRolesBlockedRoles(data.restrictRolesBlockedRoles);
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
