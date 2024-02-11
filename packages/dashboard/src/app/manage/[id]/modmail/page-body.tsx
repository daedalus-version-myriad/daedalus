"use client";

import EnableModule from "@/components/EnableModule";
import MultiRoleSelector from "@/components/MultiRoleSelector";
import NormalSelect from "@/components/NormalSelect";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import SingleEmojiSelector from "@/components/SingleEmojiSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { applyIndex, removeIndex } from "@/lib/processors";
import { GuildModmailSettings } from "@daedalus/types";
import _ from "lodash";
import { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa6";
import save from "./save";

export function Body({ data: initial, disabled, canUseMulti, limit }: { data: GuildModmailSettings; disabled: boolean; canUseMulti: boolean; limit: number }) {
    const [data, setData] = useState<GuildModmailSettings>(initial);
    const [useMulti, setUseMulti] = useState<boolean>(data.useMulti);
    const [targets, setTargets] = useState<GuildModmailSettings["targets"]>(structuredClone(data.targets));
    const [snippets, setSnippets] = useState<GuildModmailSettings["snippets"]>(structuredClone(data.snippets));
    const [index, setIndex] = useState<number>(0);

    const updated = { guild: data.guild, useMulti, targets, snippets };

    const target = targets[index];

    function setTarget(fn: (target: GuildModmailSettings["targets"][number]) => GuildModmailSettings["targets"][number]) {
        setTargets((targets) => applyIndex(targets, index, fn));
    }

    useEffect(() => {
        if (!useMulti) setIndex(0);
    }, [useMulti]);

    return (
        <>
            <EnableModule guild={data.guild} module="modmail" disabled={disabled}></EnableModule>
            {canUseMulti && targets.length > limit ? (
                <p>
                    <b>Warning:</b> You have too many modmail targets ({targets.length} &gt; {limit}). The ones at the bottom of the list are disabled. Please
                    upgrade your plan or remove ones you do not need anymore.
                </p>
            ) : null}
            <Tabs defaultValue="modmail">
                <TabsList>
                    <TabsTrigger value="modmail">Modmail</TabsTrigger>
                    <TabsTrigger value="snippets">Snippets</TabsTrigger>
                </TabsList>
                <TabsContent value="modmail">
                    {canUseMulti ? (
                        <Panel>
                            <h1 className="text-xl">Multi-Modmail</h1>
                            <p>
                                This server has access to the <b>multi-modmail</b> feature. While enabled, you can set up multiple modmail targets and users
                                will be able to choose which one they will use when sending a message.
                            </p>
                            <p>If you enable this setting but only set up one modmail target, it will act the same as if the setting were off.</p>
                            <div className="center-row gap-4">
                                <Switch checked={useMulti} onCheckedChange={setUseMulti}></Switch>
                                <b>Use Multi-Modmail</b>
                            </div>
                        </Panel>
                    ) : null}
                    {canUseMulti && useMulti ? (
                        <div className="center-row gap-4 flex-wrap">
                            <NormalSelect
                                value={`${index}`}
                                setValue={(idx) => setIndex(+idx)}
                                options={targets.map((target, i) => [`${i}`, target.name || "Unnamed Modmail Target"])}
                            ></NormalSelect>
                            <Button
                                variant="outline"
                                className="center-row gap-2"
                                onClick={() =>
                                    setTargets((targets) => [
                                        ...targets,
                                        {
                                            id: -1,
                                            name: "New Modmail Target",
                                            description: "Remove/replace this description",
                                            emoji: null,
                                            useThreads: true,
                                            channel: null,
                                            category: null,
                                            pingRoles: [],
                                            pingHere: false,
                                            accessRoles: [],
                                            openMessage: "",
                                            closeMessage: "",
                                            openParsed: [],
                                            closeParsed: [],
                                        },
                                    ])
                                }
                                disabled={targets.length >= limit}
                            >
                                <FaPlus></FaPlus>
                                Add New Target
                            </Button>
                            <Button
                                variant="outline"
                                className="center-row gap-2"
                                onClick={() =>
                                    setTargets((targets) => {
                                        if (index >= targets.length - 1) setIndex((idx) => idx - 1);
                                        return removeIndex(targets, index);
                                    })
                                }
                                disabled={targets.length <= 1}
                            >
                                <FaTrash></FaTrash>
                                Delete This Target
                            </Button>
                        </div>
                    ) : null}
                    <Panel>
                        <h1 className="text-xl">Modmail Configuration</h1>
                        <div className="grid grid-cols-[max-content_1fr] items-center gap-4">
                            {canUseMulti && useMulti ? (
                                <>
                                    <b>Target Name</b>
                                    <Input
                                        value={target.name}
                                        className="min-w-60"
                                        onChange={({ currentTarget: { value } }) => setTarget((target) => ({ ...target, name: value }))}
                                    ></Input>
                                    <b>Target Description</b>
                                    <Input
                                        value={target.description}
                                        onChange={({ currentTarget: { value } }) => setTarget((target) => ({ ...target, description: value }))}
                                    ></Input>
                                    <b>Emoji</b>
                                    <SingleEmojiSelector
                                        emoji={target.emoji}
                                        setEmoji={(emoji) => setTarget((target) => ({ ...target, emoji }))}
                                    ></SingleEmojiSelector>
                                    <Separator className="col-span-2"></Separator>
                                </>
                            ) : null}
                            <b>Use Threads</b>
                            <Switch checked={target.useThreads} onCheckedChange={(useThreads) => setTarget((target) => ({ ...target, useThreads }))}></Switch>
                            <b>{target.useThreads ? "Parent Channel" : "Log Channel"}</b>
                            <SingleChannelSelector
                                channel={target.channel}
                                setChannel={(channel) => setTarget((target) => ({ ...target, channel }))}
                                types={[0, 5]}
                            ></SingleChannelSelector>
                            {target.useThreads ? null : (
                                <>
                                    <b>Category</b>
                                    <SingleChannelSelector
                                        channel={target.category}
                                        setChannel={(category) => setTarget((target) => ({ ...target, category }))}
                                        types={[4]}
                                    ></SingleChannelSelector>
                                </>
                            )}
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
                            <b>On-Open Message</b>
                            <Input
                                value={target.openMessage}
                                onChange={({ currentTarget: { value } }) => setTarget((target) => ({ ...target, openMessage: value }))}
                            ></Input>
                            <b>On-Close Message</b>
                            <Input
                                value={target.closeMessage}
                                onChange={({ currentTarget: { value } }) => setTarget((target) => ({ ...target, closeMessage: value }))}
                            ></Input>
                        </div>
                        <p>
                            <span className="text-muted-foreground">
                                The on-open and on-close messages can be configured using custom message syntax. See{" "}
                                <a href="/docs/guides/custom-messages" className="link">
                                    the docs
                                </a>{" "}
                                for more info.
                            </span>
                        </p>
                    </Panel>
                </TabsContent>
                <TabsContent value="snippets">
                    <Panel>
                        <h1 className="text-xl">Snippets</h1>
                        <p>
                            Modmail snippets let you define standard messages / templates that mods can use when responding. Mods will be able to send a snippet
                            directly or use it as a starting point and edit the message before sending.
                        </p>
                        <p>
                            Snippets can use custom message syntax. See{" "}
                            <a href="/docs/guides/custom-messaages" className="link">
                                the docs
                            </a>{" "}
                            for more info.
                        </p>
                        {snippets.length > 0 ? (
                            <div>
                                {snippets.map((snippet, i) => {
                                    function setSnippet(fn: (snippet: GuildModmailSettings["snippets"][number]) => GuildModmailSettings["snippets"][number]) {
                                        setSnippets((snippets) => applyIndex(snippets, i, fn));
                                    }

                                    return (
                                        <Panel key={`${i}`}>
                                            <div className="center-row justify-between">
                                                <h2 className="text-lg">Name</h2>
                                                <Button variant="ghost" onClick={() => setSnippets((snippets) => removeIndex(snippets, i))}>
                                                    <FaTrash></FaTrash>
                                                </Button>
                                            </div>
                                            <Input
                                                value={snippet.name}
                                                onChange={({ currentTarget: { value } }) => setSnippet((snippet) => ({ ...snippet, name: value }))}
                                                maxLength={100}
                                            ></Input>
                                            <h2 className="text-lg">Content</h2>
                                            <Textarea
                                                value={snippet.content}
                                                onChange={({ currentTarget: { value } }) => setSnippet((snippet) => ({ ...snippet, content: value }))}
                                            ></Textarea>
                                        </Panel>
                                    );
                                })}
                            </div>
                        ) : null}
                        {snippets.length < 25 ? (
                            <div>
                                <Button
                                    variant="outline"
                                    className="center-row gap-2"
                                    onClick={() => setSnippets((snippets) => [...snippets, { name: "New Snippet", content: "", parsed: [] }])}
                                >
                                    <FaPlus></FaPlus> Add Snippet
                                </Button>
                            </div>
                        ) : null}
                    </Panel>
                </TabsContent>
            </Tabs>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => {
                    setUseMulti(data.useMulti);
                    setTargets(structuredClone(data.targets));
                    setSnippets(structuredClone(data.snippets));
                }}
                save={async () => {
                    const [error, output] = (await save(updated)) ?? [null, data];
                    if (error) return alert(error);
                    setData(output);
                    setTargets(structuredClone(output.targets));
                    setSnippets(structuredClone(output.snippets));
                }}
            ></SaveChangesBar>
        </>
    );
}
