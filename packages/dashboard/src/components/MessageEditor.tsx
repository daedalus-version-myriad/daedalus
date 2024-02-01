"use client";

import { MessageData } from "@daedalus/types";
import { useState } from "react";
import { FaChevronDown, FaChevronUp, FaCopy, FaPencil, FaPlus, FaTrash } from "react-icons/fa6";
import ColorPicker from "./ColorPicker";
import { DrawerDialog } from "./DrawerDialog";
import NormalSelect from "./NormalSelect";
import Panel from "./Panel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export default function MessageEditor({
    data,
    setData,
    flat = false,
}: {
    data: Omit<MessageData, "parsed">;
    setData: (data: Omit<MessageData, "parsed">) => unknown;
    flat?: boolean;
}) {
    return (
        <div className="flex flex-col gap-2">
            <p>
                See{" "}
                <a href="/docs/guides/custom-messages" className="link">
                    the docs
                </a>{" "}
                for how to format custom messages.
            </p>
            <div>
                {flat ? (
                    <Core data={data} setData={setData}></Core>
                ) : (
                    <DrawerDialog
                        trigger={
                            <Button variant="outline" className="center-row gap-2">
                                <FaPencil></FaPencil> Edit Message
                            </Button>
                        }
                    >
                        <Core data={data} setData={setData}></Core>
                    </DrawerDialog>
                )}
            </div>
        </div>
    );
}

function Core({ data, setData }: { data: Omit<MessageData, "parsed">; setData: (data: Omit<MessageData, "parsed">) => unknown }) {
    return (
        <>
            <h1 className="text-2xl">Content</h1>
            <Textarea value={data.content} onChange={(e) => setData({ ...data, content: e.currentTarget.value })}></Textarea>
            {data.embeds.map((embed, i) => (
                <Embed key={`${i}`} i={i} len={data.embeds.length} data={data} setData={setData}></Embed>
            ))}
            <div>
                <Button
                    variant="outline"
                    className="center-row gap-2"
                    onClick={() =>
                        setData({
                            ...data,
                            embeds: [
                                ...data.embeds,
                                {
                                    colorMode: "fixed",
                                    color: 0x009688,
                                    author: { name: "", iconURL: "", url: "" },
                                    title: "",
                                    description: "",
                                    url: "",
                                    fields: [],
                                    image: { url: "" },
                                    thumbnail: { url: "" },
                                    footer: { text: "", iconURL: "" },
                                    showTimestamp: false,
                                },
                            ],
                        })
                    }
                >
                    <FaPlus></FaPlus> Add Embed
                </Button>
            </div>
        </>
    );
}

function Embed({
    i,
    len,
    data,
    setData,
}: {
    i: number;
    len: number;
    data: Omit<MessageData, "parsed">;
    setData: (data: Omit<MessageData, "parsed">) => unknown;
}) {
    const [embed, setEmbed] = useState<MessageData["embeds"][number]>(data.embeds[i]);
    const [color, setColor] = useState<number>(embed.color);

    return (
        <Panel>
            <div className="center-row justify-between">
                <h2 className="max-w-[50vw] text-xl truncate">
                    Embed {i + 1}: {embed.title}
                </h2>
                <div className="center-row gap-1">
                    {i > 0 ? (
                        <Button variant="ghost">
                            <FaChevronUp></FaChevronUp>
                        </Button>
                    ) : null}
                    {i < len - 1 ? (
                        <Button variant="ghost">
                            <FaChevronDown></FaChevronDown>
                        </Button>
                    ) : null}
                    <Button variant="ghost">
                        <FaCopy></FaCopy>
                    </Button>
                    <Button variant="ghost">
                        <FaTrash></FaTrash>
                    </Button>
                </div>
            </div>
            <div className="center-row gap-2">
                <h3 className="text-lg">Color:</h3>
                <NormalSelect
                    value={embed.colorMode}
                    setValue={(mode) => setEmbed({ ...embed, colorMode: mode })}
                    options={[
                        ["guild", "Use Guild Default"],
                        ["member", "Use Member Highlight Color"],
                        ["user", "Use User Highlight Color"],
                        ["fixed", "Use Fixed Color"],
                    ]}
                    className="w-60"
                ></NormalSelect>
                <ColorPicker color={color} setColor={setColor} hideButton></ColorPicker>
            </div>
            <div>
                <Panel>
                    <h3 className="text-lg">Author</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label className="flex flex-col gap-2">
                                Author Name
                                <Input
                                    value={embed.author.name}
                                    onChange={(e) => setEmbed({ ...embed, author: { ...embed.author, name: e.currentTarget.value } })}
                                ></Input>
                            </Label>
                        </div>
                        <div>
                            <Label className="flex flex-col gap-2">
                                Author Icon URL
                                <Input
                                    value={embed.author.iconURL}
                                    onChange={(e) => setEmbed({ ...embed, author: { ...embed.author, iconURL: e.currentTarget.value } })}
                                ></Input>
                            </Label>
                        </div>
                        <div>
                            <Label className="flex flex-col gap-2">
                                Author URL
                                <Input
                                    value={embed.author.url}
                                    onChange={(e) => setEmbed({ ...embed, author: { ...embed.author, url: e.currentTarget.value } })}
                                ></Input>
                            </Label>
                        </div>
                    </div>
                </Panel>
                <Panel>
                    <h3 className="text-lg">Body</h3>
                    <div>
                        <Label className="flex flex-col gap-2">
                            Title
                            <Input value={embed.title} onChange={(e) => setEmbed({ ...embed, title: e.currentTarget.value })}></Input>
                        </Label>
                    </div>
                    <div>
                        <Label className="flex flex-col gap-2">
                            Description
                            <Textarea value={embed.description} onChange={(e) => setEmbed({ ...embed, description: e.currentTarget.value })}></Textarea>
                        </Label>
                    </div>
                    <div>
                        <Label className="flex flex-col gap-2">
                            URL
                            <Input value={embed.url} onChange={(e) => setEmbed({ ...embed, url: e.currentTarget.value })}></Input>
                        </Label>
                    </div>
                </Panel>
            </div>
        </Panel>
    );
}
