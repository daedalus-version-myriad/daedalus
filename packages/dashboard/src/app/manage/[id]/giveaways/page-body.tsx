"use client";

import DatetimePicker from "@/components/DatetimePicker";
import { DrawerDialog } from "@/components/DrawerDialog";
import EnableModule from "@/components/EnableModule";
import MessageEditor from "@/components/MessageEditor";
import MultiRoleSelector from "@/components/MultiRoleSelector";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import SingleRoleSelector from "@/components/SingleRoleSelector";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { textTypes } from "@/lib/data";
import { applyIndex, removeIndex } from "@/lib/processors";
import { DurationStyle, formatDuration } from "@daedalus/global-utils";
import { GiveawayBase, GuildGiveawaySettings } from "@daedalus/types";
import _ from "lodash";
import React, { useState } from "react";
import { FaExclamation, FaFloppyDisk, FaPencil, FaPlus, FaTrash } from "react-icons/fa6";
import save from "./save";

export function Body({ data: initial, disabled }: { data: GuildGiveawaySettings; disabled: boolean }) {
    const [data, setData] = useState<GuildGiveawaySettings>(initial);
    const [template, setTemplate] = useState<GiveawayBase>(data.template);
    const [giveaways, setGiveaways] = useState<GuildGiveawaySettings["giveaways"]>(structuredClone(data.giveaways));
    const [saving, setSaving] = useState<boolean>(false);
    const [now, setNow] = useState<number>(Date.now());

    setTimeout(
        () => {
            setNow(Date.now());
            setInterval(() => setNow(Date.now()), 1000);
        },
        1000 - (Date.now() % 1000),
    );

    const updated = { guild: data.guild, template, giveaways };

    async function commitSave() {
        setSaving(true);

        try {
            const [error, output] = (await save(updated)) ?? [null, data];
            if (error) return alert(error);
            setData(output);
            setTemplate(output.template);
            setGiveaways(structuredClone(output.giveaways));
            if (output.giveaways.some((giveaway) => giveaway.error))
                alert("At least one giveaway experienced an error during posting. Please inspect the errors.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <EnableModule guild={data.guild} module="giveaways" disabled={disabled}></EnableModule>
            <Panel>
                <h1 className="text-xl">Giveaways</h1>
                <DrawerDialog
                    trigger={
                        <div>
                            <Button variant="outline" className="center-row gap-2">
                                <FaPencil></FaPencil> Edit Template
                            </Button>
                        </div>
                    }
                >
                    <div>
                        <GiveawayBaseEditor data={template} setData={setTemplate}></GiveawayBaseEditor>
                    </div>
                </DrawerDialog>
                {giveaways.length > 0 ? (
                    <div className="grid grid-cols-[repeat(3,max-content)_1fr] items-center gap-4">
                        {giveaways.map((giveaway, i) => {
                            function setGiveaway(fn: (giveaway: GuildGiveawaySettings["giveaways"][number]) => GuildGiveawaySettings["giveaways"][number]) {
                                setGiveaways((giveaways) => applyIndex(giveaways, i, fn));
                            }

                            return (
                                <>
                                    {giveaway.error ? (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="center-row gap-2">
                                                    <FaExclamation></FaExclamation>
                                                    Click to see error
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogTitle>Error!</DialogTitle>
                                                <DialogDescription className="text-muted-foreground">
                                                    An error occurred posting your giveaway to Discord. This may be caused by invalid message data or missing
                                                    permissions.
                                                </DialogDescription>
                                                <Separator></Separator>
                                                <p>{giveaway.error}</p>
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <div></div>
                                    )}
                                    <Button variant="outline" onClick={() => setGiveaways((giveaways) => removeIndex(giveaways, i))}>
                                        <FaTrash></FaTrash>
                                    </Button>
                                    <DrawerDialog
                                        trigger={
                                            <Button variant="outline">
                                                <FaPencil></FaPencil>
                                            </Button>
                                        }
                                    >
                                        <div>
                                            <Panel>
                                                <h1 className="text-xl">Creating New Giveaway</h1>
                                                <h2 className="text-lg">Name (for display on dashboard)</h2>
                                                <Input
                                                    value={giveaway.name}
                                                    onChange={({ currentTarget: { value } }) => setGiveaway((giveaway) => ({ ...giveaway, name: value }))}
                                                    maxLength={128}
                                                ></Input>
                                            </Panel>
                                            <GiveawayBaseEditor data={giveaway} setData={setGiveaway}></GiveawayBaseEditor>
                                            <Panel>
                                                <h1 className="text-xl">Deadline</h1>
                                                <DatetimePicker
                                                    date={giveaway.deadline}
                                                    setDate={(deadline) => setGiveaway((giveaway) => ({ ...giveaway, deadline }))}
                                                ></DatetimePicker>
                                                <p>(in {formatDuration(giveaway.deadline - now, DurationStyle.Blank)})</p>
                                            </Panel>
                                        </div>
                                    </DrawerDialog>
                                    <span>{giveaway.name}</span>
                                </>
                            );
                        })}
                    </div>
                ) : null}
                <div>
                    <Button
                        variant="outline"
                        className="center-row gap-2"
                        onClick={() =>
                            setGiveaways((giveaways) => [
                                ...giveaways,
                                { ...template, id: -1, name: "New Giveaway", deadline: Date.now() + 86400000, messageId: null, error: null, closed: false },
                            ])
                        }
                    >
                        <FaPlus></FaPlus> Create Giveaway
                    </Button>
                </div>
            </Panel>
            <Panel>
                <p>
                    <span className="text-muted-foreground">If a giveaway is out of date or missing for any reason, click the button below to save again.</span>
                </p>
                <div>
                    <Button variant="outline" className="center-row gap-2" onClick={commitSave} disabled={saving}>
                        <FaFloppyDisk></FaFloppyDisk> Save
                    </Button>
                </div>
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => {
                    setTemplate(data.template);
                    setGiveaways(structuredClone(data.giveaways));
                }}
                save={commitSave}
                disabled={saving}
            ></SaveChangesBar>
        </>
    );
}

function GiveawayBaseEditor<T extends GiveawayBase>({ data, setData }: { data: T; setData: (fn: (data: T) => T) => unknown }) {
    return (
        <>
            <Panel>
                <h1 className="text-xl">Giveaway Display</h1>
                <div className="center-row gap-4">
                    <b>Channel</b>
                    <SingleChannelSelector
                        channel={data.channel}
                        setChannel={(channel) => setData((data) => ({ ...data, channel }))}
                        types={textTypes}
                    ></SingleChannelSelector>
                </div>
                <MessageEditor
                    data={data.message}
                    setData={(message) => !_.isEqual(message, data.message) && setData((data) => ({ ...data, message }))}
                    static
                ></MessageEditor>
            </Panel>
            <Panel>
                <h1 className="text-xl">Restrictions</h1>
                <h2 className="text-lg">Required Roles</h2>
                <MultiRoleSelector
                    roles={data.requiredRoles}
                    setRoles={(requiredRoles) => setData((data) => ({ ...data, requiredRoles }))}
                    showEveryone
                    showHigher
                    showManaged
                ></MultiRoleSelector>
                <div className="center-row gap-4">
                    User Has Any
                    <Switch checked={data.requiredRolesAll} onCheckedChange={(ch) => setData((data) => ({ ...data, requiredRolesAll: ch }))}></Switch>
                    User Has All
                </div>
                <h2 className="text-lg">Blocked Roles</h2>
                <MultiRoleSelector
                    roles={data.blockedRoles}
                    setRoles={(blockedRoles) => setData((data) => ({ ...data, blockedRoles }))}
                    showEveryone
                    showHigher
                    showManaged
                ></MultiRoleSelector>
                <div className="center-row gap-4">
                    User Has Any
                    <Switch checked={data.blockedRolesAll} onCheckedChange={(ch) => setData((data) => ({ ...data, blockedRolesAll: ch }))}></Switch>
                    User Has All
                </div>
                <h2 className="text-lg">Bypass Roles</h2>
                <p>A user that meets the bypass role requirements circumvents both the required and blocked role restrictions.</p>
                <MultiRoleSelector
                    roles={data.bypassRoles}
                    setRoles={(bypassRoles) => setData((data) => ({ ...data, bypassRoles }))}
                    showEveryone
                    showHigher
                    showManaged
                ></MultiRoleSelector>
                <div className="center-row gap-4">
                    User Has Any
                    <Switch checked={data.bypassRolesAll} onCheckedChange={(ch) => setData((data) => ({ ...data, bypassRolesAll: ch }))}></Switch>
                    User Has All
                </div>
            </Panel>
            <Panel>
                <h1 className="text-xl">Weights (Entries / Role)</h1>
                <div className="center-row gap-4">
                    <Switch checked={data.stackWeights} onCheckedChange={(stackWeights) => setData((data) => ({ ...data, stackWeights }))}></Switch>
                    Stack Bonus Entries
                </div>
                {data.weights.length > 0 ? (
                    <div className="grid grid-cols-[max-content_max-content_1fr] items-center gap-4">
                        {data.weights.map((weight, i) => (
                            <React.Fragment key={`${i}`}>
                                <Button variant="outline" onClick={() => setData((data) => ({ ...data, weights: removeIndex(data.weights, i) }))}>
                                    <FaTrash></FaTrash>
                                </Button>
                                <SingleRoleSelector
                                    role={weight.role}
                                    setRole={(role) =>
                                        setData((data) => ({ ...data, weights: applyIndex(data.weights, i, (weight) => ({ ...weight, role })) }))
                                    }
                                    showEveryone
                                    showHigher
                                    showManaged
                                ></SingleRoleSelector>
                                <Input
                                    type="number"
                                    value={weight.weight}
                                    onChange={({ currentTarget: { value } }) =>
                                        setData((data) => ({ ...data, weights: applyIndex(data.weights, i, (weight) => ({ ...weight, weight: +value ?? 1 })) }))
                                    }
                                    min={1}
                                ></Input>
                            </React.Fragment>
                        ))}
                    </div>
                ) : null}
                <div>
                    <Button
                        variant="outline"
                        className="center-row gap-2"
                        onClick={() => setData((data) => ({ ...data, weights: [...data.weights, { role: null, weight: 1 }] }))}
                    >
                        <FaPlus></FaPlus> Add Weight
                    </Button>
                </div>
            </Panel>
            <Panel>
                <h1 className="text-xl">Winning</h1>
                <div className="center-row gap-4">
                    <b>Winners</b>
                    <Input
                        type="number"
                        value={data.winners}
                        onChange={({ currentTarget: { value } }) => setData((data) => ({ ...data, winners: +value ?? 1 }))}
                        min={1}
                    ></Input>
                </div>
                <div className="center-row gap-4">
                    <Switch checked={data.allowRepeatWinners} onCheckedChange={(ch) => setData((data) => ({ ...data, allowRepeatWinners: ch }))}></Switch>
                    Allow Winning Multiple Times
                </div>
            </Panel>
        </>
    );
}
