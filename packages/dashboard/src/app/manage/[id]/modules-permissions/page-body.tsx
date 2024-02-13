"use client";

import { DrawerDialog } from "@/components/DrawerDialog";
import MultiChannelSelector from "@/components/MultiChannelSelector";
import MultiRoleSelector from "@/components/MultiRoleSelector";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { modules, permissions } from "@daedalus/data";
import { englishList } from "@daedalus/formatting";
import { fuzzy } from "@daedalus/global-utils";
import { GuildModulesPermissionsSettings } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import { FaAngleRight, FaGear } from "react-icons/fa6";
import { commandIcons, moduleIcons } from "./icons";
import save from "./save";

export function Body({ data: initial }: { data: GuildModulesPermissionsSettings }) {
    const [base, setBase] = useState<GuildModulesPermissionsSettings>(initial);
    const [data, setData] = useState<GuildModulesPermissionsSettings>(base);

    const [query, setQuery] = useState<string>("");
    const [closedModules, setClosedModules] = useState<string[]>([]);

    return (
        <>
            <Input value={query} placeholder="Find Modules / Commands" onChange={({ currentTarget: { value } }) => setQuery(value)}></Input>
            {Object.entries(modules).map(([module, moduleData]) => {
                const showModule = fuzzy(moduleData.name, query);
                const shownCommands = Object.entries(moduleData.commands ?? {})
                    .filter(([, { name }]) => fuzzy(name, query))
                    .map(([id]) => id);

                return (
                    <Panel key={module} className={showModule || shownCommands.length > 0 ? "" : "hidden"}>
                        <Collapsible
                            open={!closedModules.includes(module)}
                            onOpenChange={(open) =>
                                setClosedModules((closedModules) => (open ? closedModules.filter((x) => x !== module) : [...closedModules, module]))
                            }
                        >
                            <h1 className="center-row gap-4 text-xl">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost">
                                        <FaAngleRight className={`${closedModules.includes(module) ? "" : "rotate-90"} transition-transform`}></FaAngleRight>
                                    </Button>
                                </CollapsibleTrigger>
                                <Switch
                                    className="-ml-2 mr-2"
                                    checked={data.modules[module].enabled}
                                    onCheckedChange={(ch) =>
                                        setData((data) => ({ ...data, modules: { ...data.modules, [module]: { ...data.modules[module], enabled: ch } } }))
                                    }
                                ></Switch>
                                {moduleIcons[module]?.({})}
                                <b>{moduleData.name}</b>
                            </h1>
                            <CollapsibleContent>
                                <p>{moduleData.description}</p>
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(360px,100%),1fr))] gap-2">
                                    {Object.entries(moduleData.commands ?? {}).map(([command, commandData]) => (
                                        <div key={command} className={showModule || shownCommands.includes(command) ? "" : "hidden"}>
                                            <Panel>
                                                <h2 className="center-row gap-4 text-lg">
                                                    <DrawerDialog
                                                        trigger={
                                                            <Button variant="ghost">
                                                                <FaGear></FaGear>
                                                            </Button>
                                                        }
                                                        title={
                                                            <h2 className="center-row gap-2 text-2xl flex-wrap">
                                                                Managing the {commandIcons[command]?.({})} <b>{commandData.name}</b> command
                                                                <span>
                                                                    (<b>/{command}</b>)
                                                                </span>
                                                            </h2>
                                                        }
                                                        description={
                                                            <>
                                                                By default, this command can be used by{" "}
                                                                {commandData.permissions
                                                                    ? `users with ${englishList(commandData.permissions.map((key) => permissions[key as keyof typeof permissions]?.name ?? key))}`
                                                                    : "anyone"}
                                                                .
                                                            </>
                                                        }
                                                    >
                                                        <Panel>
                                                            <h1 className="text-xl">Role Permissions</h1>
                                                            <Label className="center-row gap-4">
                                                                <Switch
                                                                    checked={data.commands[command].ignoreDefaultPermissions}
                                                                    onCheckedChange={(ch) =>
                                                                        setData((data) => ({
                                                                            ...data,
                                                                            commands: {
                                                                                ...data.commands,
                                                                                [command]: { ...data.commands[command], ignoreDefaultPermissions: ch },
                                                                            },
                                                                        }))
                                                                    }
                                                                ></Switch>
                                                                <p>
                                                                    <b>Ignore Default Permissions</b> (only allowed users may use this command)
                                                                </p>
                                                            </Label>
                                                            <p>
                                                                Allowed Roles{" "}
                                                                <span className="text-muted-foreground">(This is overridden by blocked roles.)</span>
                                                            </p>
                                                            <MultiRoleSelector
                                                                roles={data.commands[command].allowedRoles}
                                                                setRoles={(roles) =>
                                                                    setData((data) => ({
                                                                        ...data,
                                                                        commands: {
                                                                            ...data.commands,
                                                                            [command]: { ...data.commands[command], allowedRoles: roles },
                                                                        },
                                                                    }))
                                                                }
                                                                showEveryone
                                                                showHigher
                                                                showManaged
                                                            ></MultiRoleSelector>
                                                            <p>
                                                                Blocked Roles <span className="text-muted-foreground">(This overrides allowed roles.)</span>
                                                            </p>
                                                            <MultiRoleSelector
                                                                roles={data.commands[command].blockedRoles}
                                                                setRoles={(roles) =>
                                                                    setData((data) => ({
                                                                        ...data,
                                                                        commands: {
                                                                            ...data.commands,
                                                                            [command]: { ...data.commands[command], blockedRoles: roles },
                                                                        },
                                                                    }))
                                                                }
                                                                showEveryone
                                                                showHigher
                                                                showManaged
                                                            ></MultiRoleSelector>
                                                        </Panel>
                                                        <Panel>
                                                            <h1 className="text-xl">Channel Permissions</h1>
                                                            <Label className="center-row gap-4">
                                                                <Switch
                                                                    checked={data.commands[command].restrictChannels}
                                                                    onCheckedChange={(ch) =>
                                                                        setData((data) => ({
                                                                            ...data,
                                                                            commands: {
                                                                                ...data.commands,
                                                                                [command]: { ...data.commands[command], restrictChannels: ch },
                                                                            },
                                                                        }))
                                                                    }
                                                                ></Switch>
                                                                <p>
                                                                    <b>Restrict Channels</b> (this command can only be used in allowed channels)
                                                                </p>
                                                            </Label>
                                                            <p>
                                                                <span className="text-muted-foreground">
                                                                    Note: If a channel is allowed but its parent category is blocked or vice versa, the
                                                                    channel&apos;s own settings will have priority. If a channel is both allowed and blocked, it
                                                                    will be blocked.
                                                                </span>
                                                            </p>
                                                            <p>Allowed Channels</p>
                                                            <MultiChannelSelector
                                                                channels={data.commands[command].allowedChannels}
                                                                setChannels={(channels) =>
                                                                    setData((data) => ({
                                                                        ...data,
                                                                        commands: {
                                                                            ...data.commands,
                                                                            [command]: { ...data.commands[command], allowedChannels: channels },
                                                                        },
                                                                    }))
                                                                }
                                                                showReadonly
                                                            ></MultiChannelSelector>
                                                            <p>Blocked Channels</p>
                                                            <MultiChannelSelector
                                                                channels={data.commands[command].blockedChannels}
                                                                setChannels={(channels) =>
                                                                    setData((data) => ({
                                                                        ...data,
                                                                        commands: {
                                                                            ...data.commands,
                                                                            [command]: { ...data.commands[command], blockedChannels: channels },
                                                                        },
                                                                    }))
                                                                }
                                                                showReadonly
                                                            ></MultiChannelSelector>
                                                        </Panel>
                                                    </DrawerDialog>
                                                    <Switch
                                                        className="-ml-2 mr-2"
                                                        checked={data.commands[command].enabled}
                                                        onCheckedChange={(ch) =>
                                                            setData((data) => ({
                                                                ...data,
                                                                commands: { ...data.commands, [command]: { ...data.commands[command], enabled: ch } },
                                                            }))
                                                        }
                                                    ></Switch>
                                                    {commandIcons[command]?.({})}
                                                    <span>{commandData.name}</span>
                                                </h2>
                                                <p>{commandData.description}</p>
                                            </Panel>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </Panel>
                );
            })}
            <SaveChangesBar
                unsaved={!_.isEqual(data, base)}
                reset={() => setData(initial)}
                save={async () => {
                    const error = await save(data);
                    if (error) return alert(error);
                    setBase(data);
                }}
            ></SaveChangesBar>
        </>
    );
}
