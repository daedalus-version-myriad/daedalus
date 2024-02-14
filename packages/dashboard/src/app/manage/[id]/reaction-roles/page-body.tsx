"use client";

import { DrawerDialog } from "@/components/DrawerDialog";
import EnableModule from "@/components/EnableModule";
import MessageEditor from "@/components/MessageEditor";
import NormalSelect from "@/components/NormalSelect";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import SingleEmojiSelector from "@/components/SingleEmojiSelector";
import SingleRoleSelector from "@/components/SingleRoleSelector";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { textTypes } from "@/lib/data";
import { applyIndex, clone, removeIndex } from "@/lib/processors";
import { GuildReactionRolesSettings } from "@daedalus/types";
import _ from "lodash";
import React, { useState } from "react";
import { FaCopy, FaExclamation, FaFloppyDisk, FaPencil, FaPlus, FaTrash } from "react-icons/fa6";
import save from "./save";

export function Body({ data: initial, limit, disabled }: { data: GuildReactionRolesSettings; limit: number; disabled: boolean }) {
    const [data, setData] = useState<GuildReactionRolesSettings>(initial);
    const [prompts, setPrompts] = useState<GuildReactionRolesSettings["prompts"]>(structuredClone(data.prompts));
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
            <EnableModule guild={data.guild} module="reaction-roles" disabled={disabled}></EnableModule>
            {prompts.length > limit ? (
                <p>
                    <b>Warning:</b> You have too many reaction role prompts ({prompts.length} &gt; {limit}). The ones at the bottom of the list are disabled.
                    Please upgrade your plan or remove ones you do not need anymore.
                </p>
            ) : null}
            <Panel>
                <h1 className="text-xl">Reaction Role Prompts</h1>
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
                                                An error occurred writing your reaction role prompt to Discord. This may be caused by invalid prompt message
                                                data or missing permissions.
                                            </DialogDescription>
                                            <Separator></Separator>
                                            <p>{prompt.error}</p>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <div></div>
                                )}
                                <b className="mr-2">{prompt.name}</b>
                                <Item prompt={prompt} setPrompt={(fn) => setPrompts((prompts) => applyIndex(prompts, i, fn))}></Item>
                                <Button
                                    variant="outline"
                                    onClick={() => setPrompts((prompts) => clone(prompts, i, (p) => ({ ...p, id: -1 })))}
                                    disabled={prompts.length >= limit}
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
                {prompts.length < limit ? (
                    <div>
                        <Button
                            variant="outline"
                            className="center-row gap-2"
                            onClick={() =>
                                setPrompts((prompts) => [
                                    ...prompts,
                                    {
                                        id: -1,
                                        name: "New Reaction Role Prompt",
                                        addToExisting: false,
                                        channel: null,
                                        message: null,
                                        url: "",
                                        style: "buttons",
                                        type: "normal",
                                        dropdownData: [],
                                        buttonData: [],
                                        reactionData: [],
                                        promptMessage: { content: "", embeds: [] },
                                        error: null,
                                    },
                                ])
                            }
                        >
                            <FaPlus></FaPlus> Create Reaction Role Prompt
                        </Button>
                    </div>
                ) : null}
            </Panel>
            <Panel>
                <p>
                    <span className="text-muted-foreground">
                        If a reaction role prompt is out of date or missing for any reason, click the button below to save again.
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
                reset={() => {
                    setPrompts(structuredClone(data.prompts));
                }}
                save={commitSave}
                disabled={saving}
            ></SaveChangesBar>
        </>
    );
}

function Item({
    prompt,
    setPrompt,
}: {
    prompt: GuildReactionRolesSettings["prompts"][number];
    setPrompt: (fn: (prompt: GuildReactionRolesSettings["prompts"][number]) => GuildReactionRolesSettings["prompts"][number]) => unknown;
}) {
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
                <Panel>
                    <b>Name (for display on dashboard only)</b>
                    <Input
                        value={prompt.name}
                        onChange={({ currentTarget: { value } }) => setPrompt((prompt) => ({ ...prompt, name: value }))}
                        maxLength={128}
                    ></Input>
                </Panel>
                <Panel>
                    <Label className="center-row gap-4">
                        <Switch
                            checked={prompt.addToExisting}
                            onCheckedChange={(addToExisting) => setPrompt((prompt) => ({ ...prompt, addToExisting }))}
                            disabled={prompt.id !== -1}
                        ></Switch>
                        <b>Add reactions to existing message</b>
                    </Label>
                    <div className="grid grid-cols-[max-content_1fr] items-center gap-2">
                        {prompt.addToExisting ? (
                            <>
                                <b>Message URL:</b>
                                <Input
                                    value={prompt.url}
                                    onChange={({ currentTarget: { value } }) => setPrompt((prompt) => ({ ...prompt, url: value }))}
                                    maxLength={128}
                                ></Input>
                            </>
                        ) : (
                            <>
                                <b>Channel:</b>
                                <SingleChannelSelector
                                    channel={prompt.channel}
                                    setChannel={(channel) => setPrompt((prompt) => ({ ...prompt, channel }))}
                                    types={textTypes}
                                ></SingleChannelSelector>
                                <b>Style:</b>
                                <NormalSelect
                                    value={prompt.style}
                                    setValue={(style) => setPrompt((prompt) => ({ ...prompt, style }))}
                                    options={[
                                        ["dropdown", "Dropdown Menu"],
                                        ["buttons", "Buttons"],
                                        ["reactions", "Reactions"],
                                    ]}
                                ></NormalSelect>
                            </>
                        )}
                        <b>Type:</b>
                        <NormalSelect
                            value={prompt.type}
                            setValue={(type) => setPrompt((prompt) => ({ ...prompt, type }))}
                            options={[
                                ["normal", "Normal"],
                                ["unique", "Unique"],
                                ["verify", "Verify"],
                                ["lock", "Lock"],
                            ]}
                        ></NormalSelect>
                    </div>
                </Panel>
                <Panel>
                    {prompt.style === "reactions" || prompt.addToExisting ? (
                        <>
                            <h1 className="text-xl">Reaction Options</h1>
                            <div>
                                {prompt.reactionData.map((entry, i) => (
                                    <React.Fragment key={`${i}`}>
                                        {prompt.reactionData.length < 20 ? (
                                            <Button
                                                variant="outline"
                                                className="center-row gap-2"
                                                onClick={() =>
                                                    setPrompt((prompt) => ({
                                                        ...prompt,
                                                        reactionData: [
                                                            ...prompt.reactionData.slice(0, i),
                                                            { emoji: null, role: null },
                                                            ...prompt.reactionData.slice(i),
                                                        ],
                                                    }))
                                                }
                                            >
                                                <FaPlus></FaPlus> Add Reaction
                                            </Button>
                                        ) : null}
                                        <Panel>
                                            <div className="center-row justify-between gap-8">
                                                <div className="center-row gap-4 flex-wrap">
                                                    <b>Emoji:</b>
                                                    <SingleEmojiSelector
                                                        emoji={entry.emoji}
                                                        setEmoji={(emoji) =>
                                                            setPrompt((prompt) => ({
                                                                ...prompt,
                                                                reactionData: applyIndex(prompt.reactionData, i, (e) => ({ ...e, emoji })),
                                                            }))
                                                        }
                                                    ></SingleEmojiSelector>
                                                    <Separator orientation="vertical" className="h-8"></Separator>
                                                    <b>Role:</b>
                                                    <SingleRoleSelector
                                                        role={entry.role}
                                                        setRole={(role) =>
                                                            setPrompt((prompt) => ({
                                                                ...prompt,
                                                                reactionData: applyIndex(prompt.reactionData, i, (e) => ({ ...e, role })),
                                                            }))
                                                        }
                                                    ></SingleRoleSelector>
                                                </div>
                                                <div className="center-row gap-1">
                                                    {prompt.reactionData.length < 20 ? (
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => setPrompt((prompt) => ({ ...prompt, reactionData: clone(prompt.reactionData, i) }))}
                                                        >
                                                            <FaCopy></FaCopy>
                                                        </Button>
                                                    ) : null}
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() =>
                                                            setPrompt((prompt) => ({ ...prompt, reactionData: removeIndex(prompt.reactionData, i) }))
                                                        }
                                                    >
                                                        <FaTrash></FaTrash>
                                                    </Button>
                                                </div>
                                            </div>
                                        </Panel>
                                    </React.Fragment>
                                ))}
                                {prompt.reactionData.length < 20 ? (
                                    <Button
                                        variant="outline"
                                        className="center-row gap-2"
                                        onClick={() =>
                                            setPrompt((prompt) => ({ ...prompt, reactionData: [...prompt.reactionData, { emoji: null, role: null }] }))
                                        }
                                    >
                                        <FaPlus></FaPlus> Add Reaction
                                    </Button>
                                ) : null}
                            </div>
                        </>
                    ) : prompt.style === "dropdown" ? (
                        <>
                            <h1 className="text-xl">Dropdown Options</h1>
                            <div>
                                {prompt.dropdownData.map((option, i) => (
                                    <React.Fragment key={`${i}`}>
                                        {prompt.dropdownData.length < 25 ? (
                                            <Button
                                                variant="outline"
                                                className="center-row gap-2"
                                                onClick={() =>
                                                    setPrompt((prompt) => ({
                                                        ...prompt,
                                                        dropdownData: [
                                                            ...prompt.dropdownData.slice(0, i),
                                                            { emoji: null, role: null, label: "", description: "" },
                                                            ...prompt.dropdownData.slice(i),
                                                        ],
                                                    }))
                                                }
                                            >
                                                <FaPlus></FaPlus> Add Option
                                            </Button>
                                        ) : null}
                                        <Panel>
                                            <div className="center-row justify-between gap-8">
                                                <div className="center-row gap-4 flex-wrap">
                                                    <b>Emoji:</b>
                                                    <SingleEmojiSelector
                                                        emoji={option.emoji}
                                                        setEmoji={(emoji) =>
                                                            setPrompt((prompt) => ({
                                                                ...prompt,
                                                                dropdownData: applyIndex(prompt.dropdownData, i, (e) => ({ ...e, emoji })),
                                                            }))
                                                        }
                                                    ></SingleEmojiSelector>
                                                    <Separator orientation="vertical" className="h-8"></Separator>
                                                    <b>Role:</b>
                                                    <SingleRoleSelector
                                                        role={option.role}
                                                        setRole={(role) =>
                                                            setPrompt((prompt) => ({
                                                                ...prompt,
                                                                dropdownData: applyIndex(prompt.dropdownData, i, (e) => ({ ...e, role })),
                                                            }))
                                                        }
                                                    ></SingleRoleSelector>
                                                </div>
                                                <div className="center-row gap-1">
                                                    {prompt.dropdownData.length < 25 ? (
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => setPrompt((prompt) => ({ ...prompt, dropdownData: clone(prompt.dropdownData, i) }))}
                                                        >
                                                            <FaCopy></FaCopy>
                                                        </Button>
                                                    ) : null}
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() =>
                                                            setPrompt((prompt) => ({ ...prompt, dropdownData: removeIndex(prompt.dropdownData, i) }))
                                                        }
                                                    >
                                                        <FaTrash></FaTrash>
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-[max-content_1fr] items-center gap-2">
                                                <b>Label:</b>
                                                <Input
                                                    value={option.label}
                                                    onChange={({ currentTarget: { value } }) =>
                                                        setPrompt((prompt) => ({
                                                            ...prompt,
                                                            dropdownData: applyIndex(prompt.dropdownData, i, (e) => ({ ...e, label: value })),
                                                        }))
                                                    }
                                                    maxLength={100}
                                                ></Input>
                                                <b>Description:</b>
                                                <Input
                                                    value={option.description}
                                                    onChange={({ currentTarget: { value } }) =>
                                                        setPrompt((prompt) => ({
                                                            ...prompt,
                                                            dropdownData: applyIndex(prompt.dropdownData, i, (e) => ({ ...e, description: value })),
                                                        }))
                                                    }
                                                    maxLength={100}
                                                ></Input>
                                            </div>
                                        </Panel>
                                    </React.Fragment>
                                ))}
                                {prompt.dropdownData.length < 25 ? (
                                    <Button
                                        variant="outline"
                                        className="center-row gap-2"
                                        onClick={() =>
                                            setPrompt((prompt) => ({
                                                ...prompt,
                                                dropdownData: [...prompt.dropdownData, { emoji: null, role: null, label: "", description: "" }],
                                            }))
                                        }
                                    >
                                        <FaPlus></FaPlus> Add Option
                                    </Button>
                                ) : null}
                            </div>
                        </>
                    ) : prompt.style === "buttons" ? (
                        <>
                            <h1 className="text-xl">Button Options</h1>
                            <div>
                                {prompt.buttonData.map((row, i) => {
                                    function setRow(
                                        fn: (
                                            row: GuildReactionRolesSettings["prompts"][number]["buttonData"][number],
                                        ) => GuildReactionRolesSettings["prompts"][number]["buttonData"][number],
                                    ) {
                                        setPrompt((prompt) => ({ ...prompt, buttonData: applyIndex(prompt.buttonData, i, fn) }));
                                    }

                                    return (
                                        <React.Fragment key={`${i}`}>
                                            {prompt.buttonData.length < 5 ? (
                                                <Button
                                                    variant="outline"
                                                    className="center-row gap-2"
                                                    onClick={() =>
                                                        setPrompt((prompt) => ({
                                                            ...prompt,
                                                            buttonData: [...prompt.buttonData.slice(0, i), [], ...prompt.buttonData.slice(i)],
                                                        }))
                                                    }
                                                >
                                                    <FaPlus></FaPlus> Add Row
                                                </Button>
                                            ) : null}
                                            <Panel>
                                                <div className="center-row justify-between gap-8">
                                                    <h2 className="text-lg">Row {i + 1}</h2>
                                                    <div className="center-row gap-1">
                                                        {row.length < 5 ? (
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => setPrompt((prompt) => ({ ...prompt, buttonData: clone(prompt.buttonData, i) }))}
                                                            >
                                                                <FaCopy></FaCopy>
                                                            </Button>
                                                        ) : null}
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setPrompt((prompt) => ({ ...prompt, buttonData: removeIndex(prompt.buttonData, i) }))
                                                            }
                                                        >
                                                            <FaTrash></FaTrash>
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div>
                                                    {row.map((button, j) => (
                                                        <React.Fragment key={`${i}-${j}`}>
                                                            {row.length < 5 ? (
                                                                <Button
                                                                    variant="outline"
                                                                    className="center-row gap-2"
                                                                    onClick={() =>
                                                                        setRow((row) => [
                                                                            ...row.slice(0, j),
                                                                            { emoji: null, role: null, color: "gray", label: "" },
                                                                            ...row.slice(j),
                                                                        ])
                                                                    }
                                                                >
                                                                    <FaPlus></FaPlus> Add Button
                                                                </Button>
                                                            ) : null}
                                                            <Panel>
                                                                <div className="center-row justify-between gap-8">
                                                                    <div className="center-row gap-4 flex-wrap">
                                                                        <b>Emoji:</b>
                                                                        <SingleEmojiSelector
                                                                            emoji={button.emoji}
                                                                            setEmoji={(emoji) => setRow((row) => applyIndex(row, j, (e) => ({ ...e, emoji })))}
                                                                        ></SingleEmojiSelector>
                                                                        <Separator orientation="vertical" className="h-8"></Separator>
                                                                        <b>Role:</b>
                                                                        <SingleRoleSelector
                                                                            role={button.role}
                                                                            setRole={(role) => setRow((row) => applyIndex(row, j, (e) => ({ ...e, role })))}
                                                                        ></SingleRoleSelector>
                                                                        <Separator orientation="vertical" className="h-8"></Separator>
                                                                        <b>Color:</b>
                                                                        <NormalSelect
                                                                            value={button.color}
                                                                            setValue={(color) => setRow((row) => applyIndex(row, j, (e) => ({ ...e, color })))}
                                                                            options={[
                                                                                ["gray", "Gray"],
                                                                                ["blue", "Blue"],
                                                                                ["green", "Green"],
                                                                                ["red", "Red"],
                                                                            ]}
                                                                            className="w-[min-content] bg-background hover:bg-accent"
                                                                        ></NormalSelect>
                                                                    </div>
                                                                    <div className="center-row gap-1">
                                                                        {row.length < 5 ? (
                                                                            <Button variant="ghost" onClick={() => setRow((row) => clone(row, j))}>
                                                                                <FaCopy></FaCopy>
                                                                            </Button>
                                                                        ) : null}
                                                                        <Button variant="ghost" onClick={() => setRow((row) => removeIndex(row, j))}>
                                                                            <FaTrash></FaTrash>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <div className="center-row gap-2">
                                                                    <b>Label:</b>
                                                                    <Input
                                                                        value={button.label}
                                                                        onChange={({ currentTarget: { value } }) =>
                                                                            setRow((row) => applyIndex(row, j, (e) => ({ ...e, label: value })))
                                                                        }
                                                                        maxLength={80}
                                                                    ></Input>
                                                                </div>
                                                            </Panel>
                                                        </React.Fragment>
                                                    ))}
                                                    {row.length < 5 ? (
                                                        <Button
                                                            variant="outline"
                                                            className="center-row gap-2"
                                                            onClick={() => setRow((row) => [...row, { emoji: null, role: null, color: "gray", label: "" }])}
                                                        >
                                                            <FaPlus></FaPlus> Add Button
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </Panel>
                                        </React.Fragment>
                                    );
                                })}
                                {prompt.buttonData.length < 5 ? (
                                    <Button
                                        variant="outline"
                                        className="center-row gap-2"
                                        onClick={() =>
                                            setPrompt((prompt) => ({
                                                ...prompt,
                                                buttonData: [...prompt.buttonData, []],
                                            }))
                                        }
                                    >
                                        <FaPlus></FaPlus> Add Row
                                    </Button>
                                ) : null}
                            </div>
                        </>
                    ) : (
                        <b>Unrecognized style {prompt.style}!</b>
                    )}
                </Panel>
                <Panel>
                    <MessageEditor
                        data={prompt.promptMessage}
                        setData={(promptMessage) => !_.isEqual(promptMessage, prompt.promptMessage) && setPrompt((prompt) => ({ ...prompt, promptMessage }))}
                        static
                    ></MessageEditor>
                </Panel>
            </div>
        </DrawerDialog>
    );
}
