"use client";

import { DrawerDialog } from "@/components/DrawerDialog";
import EnableModule from "@/components/EnableModule";
import MessageEditor from "@/components/MessageEditor";
import MultiRoleSelector from "@/components/MultiRoleSelector";
import NormalSelect from "@/components/NormalSelect";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import SingleEmojiSelector from "@/components/SingleEmojiSelector";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { textTypes } from "@/lib/data";
import { applyIndex, clone, removeIndex } from "@/lib/processors";
import { GuildTicketsSettings } from "@daedalus/types";
import _ from "lodash";
import React, { useCallback, useState } from "react";
import { FaCopy, FaExclamation, FaFloppyDisk, FaPencil, FaPlus, FaTrash } from "react-icons/fa6";
import save from "./save";

const defaultTarget = (): GuildTicketsSettings["prompts"][number]["targets"][number] => ({
    id: -1,
    name: "New Ticket Target",
    channel: null,
    category: null,
    buttonLabel: "",
    buttonColor: "gray",
    dropdownLabel: "",
    dropdownDescription: "",
    emoji: null,
    pingRoles: [],
    pingHere: false,
    accessRoles: [],
    postCustomOpenMessage: false,
    customOpenMessage: { content: "", embeds: [] },
    customOpenParsed: { content: [], embeds: [] },
});

export function Body({
    data: initial,
    disabled,
    canUseMulti,
    promptLimit,
    targetLimit,
    canCustomize,
}: {
    data: GuildTicketsSettings;
    disabled: boolean;
    canUseMulti: boolean;
    promptLimit: number;
    targetLimit: number;
    canCustomize: boolean;
}) {
    const [data, setData] = useState<GuildTicketsSettings>(initial);
    const [prompts, setPrompts] = useState<GuildTicketsSettings["prompts"]>(structuredClone(data.prompts));
    const [saving, setSaving] = useState<boolean>(false);

    const updated = { guild: data.guild, prompts };

    async function commitSave() {
        setSaving(true);

        try {
            const [error, output] = (await save(updated)) ?? [null, data];
            if (error) return alert(error);
            setData(output);
            setPrompts(structuredClone(output.prompts));
            if (output.prompts.some((prompt) => prompt.error)) alert("At least one prompt experienced an error during posting. Please inspect the errors.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <EnableModule guild={data.guild} module="autoroles" disabled={disabled}></EnableModule>
            {prompts.length > promptLimit ? (
                <p>
                    <b>Warning:</b> You have too many ticket prompts ({prompts.length} &gt; {promptLimit}). The ones at the bottom of the list are disabled.
                    Please upgrade your plan or remove ones you do not need anymore.
                </p>
            ) : null}
            <Panel>
                <h1 className="text-xl">Ticket Prompts</h1>
                {prompts.length > 0 ? (
                    <div className="grid grid-cols-[repeat(5,max-content)] items-center gap-2">
                        {prompts.map((prompt, i) => (
                            <React.Fragment key={`${i}`}>
                                {prompt.error ? (
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
                                                An error occurred writing your ticket prompt to Discord. This may be caused by invalid prompt message data or
                                                missing permissions.
                                            </DialogDescription>
                                            <Separator></Separator>
                                            <p>{prompt.error}</p>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <div></div>
                                )}
                                <b className="mr-2">{prompt.name}</b>
                                <Item
                                    {...{ prompt, canUseMulti, targetLimit, canCustomize }}
                                    setPrompt={(fn) => setPrompts((prompts) => applyIndex(prompts, i, fn))}
                                ></Item>
                                <Button
                                    variant="outline"
                                    onClick={() => setPrompts((prompts) => clone(prompts, i, (p) => ({ ...p, id: -1 })))}
                                    disabled={prompts.length >= promptLimit}
                                >
                                    <FaCopy></FaCopy>
                                </Button>
                                <Button variant="outline" onClick={() => setPrompts((prompts) => removeIndex(prompts, i))}>
                                    <FaTrash></FaTrash>
                                </Button>
                            </React.Fragment>
                        ))}
                    </div>
                ) : null}
                {prompts.length < promptLimit ? (
                    <div>
                        <Button
                            variant="outline"
                            className="center-row gap-2"
                            onClick={() =>
                                setPrompts((prompts) => [
                                    ...prompts,
                                    {
                                        id: -1,
                                        name: "New Ticket Prompt",
                                        channel: null,
                                        message: null,
                                        prompt: { content: "", embeds: [] },
                                        useMulti: false,
                                        error: null,
                                        targets: [defaultTarget()],
                                    },
                                ])
                            }
                        >
                            <FaPlus></FaPlus> Create Ticket Prompt
                        </Button>
                    </div>
                ) : null}
            </Panel>
            <Panel>
                <p>
                    <span className="text-muted-foreground">
                        If a ticket prompt is out of date or missing for any reason, click the button below to save again.
                    </span>
                </p>
                <div>
                    <Button variant="outline" className="center-row gap-2" onClick={commitSave} disabled={saving}>
                        <FaFloppyDisk></FaFloppyDisk> Save
                    </Button>
                </div>
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => setPrompts(structuredClone(data.prompts))}
                save={commitSave}
                disabled={saving}
            ></SaveChangesBar>
        </>
    );
}

function Item({
    prompt,
    setPrompt,
    canUseMulti,
    targetLimit,
    canCustomize,
}: {
    prompt: GuildTicketsSettings["prompts"][number];
    setPrompt: (fn: (prompt: GuildTicketsSettings["prompts"][number]) => GuildTicketsSettings["prompts"][number]) => unknown;
    canUseMulti: boolean;
    targetLimit: number;
    canCustomize: boolean;
}) {
    const [index, setIndex] = useState<number>(0);

    const target = prompt.targets[index];

    const setTarget = useCallback(
        (fn: (target: GuildTicketsSettings["prompts"][number]["targets"][number]) => GuildTicketsSettings["prompts"][number]["targets"][number]) =>
            setPrompt((prompt) => ({ ...prompt, targets: applyIndex(prompt.targets, index, fn) })),
        [index, setPrompt],
    );

    return (
        <DrawerDialog
            title={
                <span>
                    Editing <b>{prompt.name}</b>
                </span>
            }
            trigger={
                <Button variant="outline">
                    <FaPencil></FaPencil>
                </Button>
            }
        >
            <div>
                {canUseMulti && prompt.useMulti && prompt.targets.length > targetLimit ? (
                    <p>
                        <b>Warning:</b> This ticket prompt has too many targets ({prompt.targets.length} &gt; {targetLimit}). The ones at the bottom of the list
                        are disabled. Please upgrade your plan or remove ones you do not need anymore.
                    </p>
                ) : null}
                <Panel>
                    <b>Name (for display on dashboard only)</b>
                    <Input
                        value={prompt.name}
                        onChange={({ currentTarget: { value } }) => setPrompt((prompt) => ({ ...prompt, name: value }))}
                        maxLength={128}
                    ></Input>
                    <div className="center-row gap-4">
                        <b>Channel:</b>
                        <SingleChannelSelector
                            channel={prompt.channel}
                            setChannel={(channel) => setPrompt((prompt) => ({ ...prompt, channel }))}
                        ></SingleChannelSelector>
                    </div>
                </Panel>
                <Panel>
                    <h1 className="text-xl">Prompt Message</h1>
                    <MessageEditor
                        data={prompt.prompt}
                        setData={(p) => !_.isEqual(prompt.prompt, p) && setPrompt((prompt) => ({ ...prompt, prompt: p }))}
                        static
                    ></MessageEditor>
                </Panel>
                {canUseMulti ? (
                    <Panel>
                        <h1 className="text-xl">Multi-Target Tickets</h1>
                        <p>
                            This server has access to the <b>multi-target tickets</b> feature. While enabled, you will be able to specify multiple ticket
                            targets in one prompt. For example, you can allow users to create tickets with mods or admins within the same prompt.
                        </p>
                        <p>
                            If you enable this setting but only set up one target, it will act the same as if the setting were off, and if you set up no
                            targets, you will get an error.
                        </p>
                        <div className="center-row gap-4">
                            <Switch checked={prompt.useMulti} onCheckedChange={(useMulti) => setPrompt((prompt) => ({ ...prompt, useMulti }))}></Switch>
                            <b>Use Multi-Target</b>
                        </div>
                    </Panel>
                ) : null}
                {canUseMulti && prompt.useMulti ? (
                    <div className="center-row gap-4 flex-wrap">
                        <NormalSelect
                            value={`${index}`}
                            setValue={(idx) => setIndex(+idx)}
                            options={prompt.targets.map((target, i) => [`${i}`, target.name || "Unnamed Ticket Target"])}
                        ></NormalSelect>
                        <Button
                            variant="outline"
                            className="center-row gap-2"
                            onClick={() => setPrompt((prompt) => ({ ...prompt, targets: [...prompt.targets, defaultTarget()] }))}
                            disabled={prompt.targets.length >= targetLimit}
                        >
                            <FaPlus></FaPlus> Add New Target
                        </Button>
                        <Button
                            variant="outline"
                            className="center-row gap-2"
                            onClick={() => {
                                const result = removeIndex(prompt.targets, index);
                                if (index >= result.length) setIndex((idx) => idx - 1);
                                setPrompt((prompt) => ({ ...prompt, targets: result }));
                            }}
                            disabled={prompt.targets.length <= 1}
                        >
                            <FaTrash></FaTrash> Delete This Target
                        </Button>
                    </div>
                ) : null}
                <Panel>
                    <h1 className="text-xl">Target Configuration</h1>
                    <div className="grid grid-cols-[max-content_1fr] items-center gap-4">
                        {canUseMulti && prompt.useMulti ? (
                            <>
                                <b>Name</b>
                                <Input
                                    value={target.name}
                                    onChange={({ currentTarget: { value } }) => setTarget((target) => ({ ...target, name: value }))}
                                    maxLength={128}
                                ></Input>
                            </>
                        ) : null}
                        <b>Log Channel</b>
                        <SingleChannelSelector
                            channel={target.channel}
                            setChannel={(channel) => setTarget((target) => ({ ...target, channel }))}
                            types={textTypes}
                        ></SingleChannelSelector>
                        <b>Ticket Category</b>
                        <SingleChannelSelector
                            channel={target.category}
                            setChannel={(category) => setTarget((target) => ({ ...target, category }))}
                            types={[4]}
                        ></SingleChannelSelector>
                        <b>Roles To Ping</b>
                        <MultiRoleSelector
                            roles={target.pingRoles}
                            setRoles={(pingRoles) => setTarget((target) => ({ ...target, pingRoles }))}
                            showEveryone
                            showHigher
                            showManaged
                        ></MultiRoleSelector>
                        <b>
                            Ping <code>@here</code>
                        </b>
                        <Switch checked={target.pingHere} onCheckedChange={(pingHere) => setTarget((target) => ({ ...target, pingHere }))}></Switch>
                        <b>Log Access Roles</b>
                        <MultiRoleSelector
                            roles={target.accessRoles}
                            setRoles={(accessRoles) => setTarget((target) => ({ ...target, accessRoles }))}
                            showEveryone
                            showHigher
                            showManaged
                        ></MultiRoleSelector>
                        <b>Emoji</b>
                        <SingleEmojiSelector emoji={target.emoji} setEmoji={(emoji) => setTarget((target) => ({ ...target, emoji }))}></SingleEmojiSelector>
                        {canUseMulti && prompt.useMulti ? (
                            <>
                                <b>Dropdown Label</b>
                                <Input
                                    value={target.dropdownLabel}
                                    onChange={({ currentTarget: { value } }) => setTarget((target) => ({ ...target, dropdownLabel: value }))}
                                    maxLength={100}
                                    className="min-w-60"
                                ></Input>
                                <b>Dropdown Description</b>
                                <Input
                                    value={target.dropdownDescription}
                                    onChange={({ currentTarget: { value } }) => setTarget((target) => ({ ...target, dropdownDescription: value }))}
                                    maxLength={100}
                                ></Input>
                            </>
                        ) : (
                            <>
                                <b>Button Label</b>
                                <Input
                                    value={target.buttonLabel}
                                    onChange={({ currentTarget: { value } }) => setTarget((target) => ({ ...target, buttonLabel: value }))}
                                    maxLength={80}
                                    className="min-w-60"
                                ></Input>
                                <b>Button Color</b>
                                <NormalSelect
                                    value={target.buttonColor}
                                    setValue={(buttonColor) => setTarget((target) => ({ ...target, buttonColor }))}
                                    options={[
                                        ["gray", "Gray"],
                                        ["blue", "Blue"],
                                        ["green", "Green"],
                                        ["red", "Red"],
                                    ]}
                                ></NormalSelect>
                            </>
                        )}
                    </div>
                </Panel>
            </div>
        </DrawerDialog>
    );
}
