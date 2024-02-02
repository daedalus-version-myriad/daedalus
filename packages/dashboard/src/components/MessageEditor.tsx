"use client";

import { clone, swap, without } from "@/lib/processors";
import { IEmbed, IField, MessageData } from "@daedalus/types";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FaChevronDown, FaChevronRight, FaChevronUp, FaCopy, FaPencil, FaPlus, FaTrash } from "react-icons/fa6";
import ColorPicker from "./ColorPicker";
import { DrawerDialog } from "./DrawerDialog";
import NormalSelect from "./NormalSelect";
import Panel from "./Panel";
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";

type EditableMessage = {
    content: string;
    embeds: (Omit<IEmbed, "fields"> &
        Record<"open" | "authorOpen" | "bodyOpen" | "fieldsOpen" | "imagesOpen" | "footerOpen", boolean> & {
            fields: (IField & { open: boolean })[];
        })[];
};

function toEditable(base: Omit<MessageData, "parsed">): EditableMessage {
    return {
        ...base,
        embeds: base.embeds.map((embed) => ({
            ...embed,
            fields: embed.fields.map((field) => ({ ...field, open: true })),
            open: true,
            authorOpen: embed.author.name.length > 0 || embed.author.iconURL.length > 0 || embed.author.url.length > 0,
            bodyOpen: true,
            fieldsOpen: embed.fields.length > 0,
            imagesOpen: embed.image.url.length > 0 || embed.thumbnail.url.length > 0,
            footerOpen: embed.footer.text.length > 0 || embed.footer.iconURL.length > 0,
        })),
    };
}

function fromEditable(base: EditableMessage): Omit<MessageData, "parsed"> {
    return {
        ...base,
        embeds: base.embeds.map((embed) => ({
            ...Object.fromEntries(
                Object.entries(embed).filter(([k]) => !["open", "authorOpen", "bodyOpen", "fieldsOpen", "imagesOpen", "footerOpen"].includes(k)),
            ),
            fields: embed.fields.map((field) => Object.fromEntries(Object.entries(field).filter(([k]) => k !== "open"))) as IField[],
        })) as IEmbed[],
    };
}

function useEditableMessage(
    base: Omit<MessageData, "parsed">,
    setBase: Dispatch<SetStateAction<Omit<MessageData, "parsed">>>,
): [EditableMessage, Dispatch<SetStateAction<EditableMessage>>] {
    const [data, setData] = useState(toEditable(base));

    useEffect(() => {
        setBase(fromEditable(data));
    }, [setBase, data]);

    return [data, setData];
}

export default function MessageEditor({
    data: base,
    setData: setBase,
    flat = false,
}: {
    data: Omit<MessageData, "parsed">;
    setData: Dispatch<SetStateAction<Omit<MessageData, "parsed">>>;
    flat?: boolean;
}) {
    const [data, setData] = useEditableMessage(base, setBase);

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

function Core({ data, setData }: { data: EditableMessage; setData: Dispatch<SetStateAction<EditableMessage>> }) {
    return (
        <>
            <h1 className="text-2xl">Content</h1>
            <Textarea value={data.content} onChange={({ currentTarget: { value } }) => setData((data) => ({ ...data, content: value }))}></Textarea>
            <div>
                {data.embeds.map((embed, i) => {
                    function setEmbed(fn: (embed: EditableMessage["embeds"][number]) => EditableMessage["embeds"][number]) {
                        setData((data) => ({ ...data, embeds: [...data.embeds.slice(0, i), fn(data.embeds[i]), ...data.embeds.slice(i + 1)] }));
                    }

                    return (
                        <Panel key={`${i}`}>
                            <Collapsible open={embed.open} onOpenChange={(open) => setEmbed((embed) => ({ ...embed, open }))}>
                                <div className="center-row justify-between">
                                    <CollapsibleTrigger>
                                        <div className="center-row gap-4">
                                            <FaChevronRight className={`${embed.open ? "rotate-90" : ""} transition-transform`}></FaChevronRight>
                                            <h2 className="max-w-[50vw] text-xl truncate">
                                                Embed {i + 1}: {embed.title}
                                            </h2>
                                        </div>
                                    </CollapsibleTrigger>
                                    <div className="center-row gap-1">
                                        {i > 0 ? (
                                            <Button variant="ghost" onClick={() => setData((data) => ({ ...data, embeds: swap(data.embeds, i - 1, i) }))}>
                                                <FaChevronUp></FaChevronUp>
                                            </Button>
                                        ) : null}
                                        {i < data.embeds.length - 1 ? (
                                            <Button variant="ghost" onClick={() => setData((data) => ({ ...data, embeds: swap(data.embeds, i, i + 1) }))}>
                                                <FaChevronDown></FaChevronDown>
                                            </Button>
                                        ) : null}
                                        {data.embeds.length < 10 ? (
                                            <Button variant="ghost" onClick={() => setData((data) => ({ ...data, embeds: clone(data.embeds, i) }))}>
                                                <FaCopy></FaCopy>
                                            </Button>
                                        ) : null}
                                        <Button variant="ghost" onClick={() => setData((data) => ({ ...data, embeds: without(data.embeds, i) }))}>
                                            <FaTrash></FaTrash>
                                        </Button>
                                    </div>
                                </div>
                                <CollapsibleContent className="mt-2">
                                    <div className="center-row gap-2 flex-wrap">
                                        <h3 className="text-lg">Color:</h3>
                                        <NormalSelect
                                            value={embed.colorMode}
                                            setValue={(mode) => setEmbed((embed) => ({ ...embed, colorMode: mode as IEmbed["colorMode"] }))}
                                            options={[
                                                ["guild", "Use Guild Default"],
                                                ["member", "Use Member Highlight Color"],
                                                ["user", "Use User Highlight Color"],
                                                ["fixed", "Use Fixed Color"],
                                            ]}
                                            className="w-60"
                                        ></NormalSelect>
                                        <ColorPicker
                                            color={embed.color}
                                            setColor={(color) => setEmbed((embed) => ({ ...embed, color }))}
                                            hideButton
                                        ></ColorPicker>
                                    </div>
                                    <div>
                                        <Panel>
                                            <Collapsible open={embed.authorOpen} onOpenChange={(authorOpen) => setEmbed((embed) => ({ ...embed, authorOpen }))}>
                                                <CollapsibleTrigger>
                                                    <div className="center-row gap-2">
                                                        <FaChevronRight
                                                            className={`${embed.authorOpen ? "rotate-90" : ""} transition-transform`}
                                                        ></FaChevronRight>
                                                        <h3 className="text-lg">Author</h3>
                                                    </div>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="flex flex-col gap-4">
                                                    <div></div>
                                                    <div>
                                                        <Label className="flex flex-col gap-2">
                                                            Author Name
                                                            <Input
                                                                value={embed.author.name}
                                                                onChange={({ currentTarget: { value } }) =>
                                                                    setEmbed((embed) => ({ ...embed, author: { ...embed.author, name: value } }))
                                                                }
                                                            ></Input>
                                                        </Label>
                                                    </div>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="flex flex-col gap-2">
                                                                Author Icon URL
                                                                <Input
                                                                    value={embed.author.iconURL}
                                                                    onChange={({ currentTarget: { value } }) =>
                                                                        setEmbed((embed) => ({ ...embed, author: { ...embed.author, iconURL: value } }))
                                                                    }
                                                                ></Input>
                                                            </Label>
                                                        </div>
                                                        <div>
                                                            <Label className="flex flex-col gap-2">
                                                                Author URL
                                                                <Input
                                                                    value={embed.author.url}
                                                                    onChange={({ currentTarget: { value } }) =>
                                                                        setEmbed((embed) => ({ ...embed, author: { ...embed.author, url: value } }))
                                                                    }
                                                                ></Input>
                                                            </Label>
                                                        </div>
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </Panel>
                                        <Panel>
                                            <Collapsible open={embed.bodyOpen} onOpenChange={(bodyOpen) => setEmbed((embed) => ({ ...embed, bodyOpen }))}>
                                                <CollapsibleTrigger>
                                                    <div className="center-row gap-2">
                                                        <FaChevronRight
                                                            className={`${embed.bodyOpen ? "rotate-90" : ""} transition-transform`}
                                                        ></FaChevronRight>
                                                        <h3 className="text-lg">Body</h3>
                                                    </div>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="flex flex-col gap-4">
                                                    <div></div>
                                                    <div>
                                                        <Label className="flex flex-col gap-2">
                                                            Title
                                                            <Input
                                                                value={embed.title}
                                                                onChange={({ currentTarget: { value } }) => setEmbed((embed) => ({ ...embed, title: value }))}
                                                            ></Input>
                                                        </Label>
                                                    </div>
                                                    <div>
                                                        <Label className="flex flex-col gap-2">
                                                            Description
                                                            <Textarea
                                                                value={embed.description}
                                                                onChange={({ currentTarget: { value } }) =>
                                                                    setEmbed((embed) => ({ ...embed, description: value }))
                                                                }
                                                            ></Textarea>
                                                        </Label>
                                                    </div>
                                                    <div>
                                                        <Label className="flex flex-col gap-2">
                                                            URL
                                                            <Input
                                                                value={embed.url}
                                                                onChange={({ currentTarget: { value } }) => setEmbed((embed) => ({ ...embed, url: value }))}
                                                            ></Input>
                                                        </Label>
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </Panel>
                                        <Panel>
                                            <Collapsible open={embed.fieldsOpen} onOpenChange={(fieldsOpen) => setEmbed((embed) => ({ ...embed, fieldsOpen }))}>
                                                <CollapsibleTrigger>
                                                    <div className="center-row gap-2">
                                                        <FaChevronRight
                                                            className={`${embed.fieldsOpen ? "rotate-90" : ""} transition-transform`}
                                                        ></FaChevronRight>
                                                        <h3 className="text-lg">Fields</h3>
                                                    </div>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="flex flex-col gap-4">
                                                    <div></div>
                                                    {embed.fields.map((field, i) => {
                                                        function setField(
                                                            fn: (
                                                                field: EditableMessage["embeds"][number]["fields"][number],
                                                            ) => EditableMessage["embeds"][number]["fields"][number],
                                                        ) {
                                                            setEmbed((embed) => ({
                                                                ...embed,
                                                                fields: [...embed.fields.slice(0, i), fn(embed.fields[i]), ...embed.fields.slice(i + 1)],
                                                            }));
                                                        }

                                                        return (
                                                            <Panel key={`field-${i}`}>
                                                                <Collapsible
                                                                    open={field.open}
                                                                    onOpenChange={(open) => setField((field) => ({ ...field, open }))}
                                                                >
                                                                    <div className="center-row justify-between">
                                                                        <CollapsibleTrigger>
                                                                            <div className="center-row gap-2">
                                                                                <FaChevronRight
                                                                                    className={`${field.open ? "rotate-90" : ""} transition-transform`}
                                                                                ></FaChevronRight>
                                                                                <h4 className="max-w-[45vw] text-md truncate">
                                                                                    Field {i + 1}: {field.name}
                                                                                </h4>
                                                                            </div>
                                                                        </CollapsibleTrigger>
                                                                        <div className="center-row gap-1">
                                                                            {i > 0 ? (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    onClick={() =>
                                                                                        setEmbed((embed) => ({
                                                                                            ...embed,
                                                                                            fields: swap(embed.fields, i - 1, i),
                                                                                        }))
                                                                                    }
                                                                                >
                                                                                    <FaChevronUp></FaChevronUp>
                                                                                </Button>
                                                                            ) : null}
                                                                            {i < embed.fields.length - 1 ? (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    onClick={() =>
                                                                                        setEmbed((embed) => ({
                                                                                            ...embed,
                                                                                            fields: swap(embed.fields, i, i + 1),
                                                                                        }))
                                                                                    }
                                                                                >
                                                                                    <FaChevronDown></FaChevronDown>
                                                                                </Button>
                                                                            ) : null}
                                                                            {embed.fields.length < 25 ? (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    onClick={() =>
                                                                                        setEmbed((embed) => ({ ...embed, fields: clone(embed.fields, i) }))
                                                                                    }
                                                                                >
                                                                                    <FaCopy></FaCopy>
                                                                                </Button>
                                                                            ) : null}
                                                                            <Button
                                                                                variant="ghost"
                                                                                onClick={() =>
                                                                                    setEmbed((embed) => ({ ...embed, fields: without(embed.fields, i) }))
                                                                                }
                                                                            >
                                                                                <FaTrash></FaTrash>
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                    <CollapsibleContent className="flex flex-col gap-4">
                                                                        <div></div>
                                                                        <div>
                                                                            <Label className="flex flex-col gap-2">
                                                                                Name
                                                                                <Input
                                                                                    value={field.name}
                                                                                    onChange={({ currentTarget: { value } }) =>
                                                                                        setField((field) => ({ ...field, name: value }))
                                                                                    }
                                                                                    className="border-muted-foreground/25"
                                                                                ></Input>
                                                                            </Label>
                                                                        </div>
                                                                        <div>
                                                                            <Label className="flex flex-col gap-2">
                                                                                Value
                                                                                <Input
                                                                                    value={field.value}
                                                                                    onChange={({ currentTarget: { value } }) =>
                                                                                        setField((field) => ({ ...field, value }))
                                                                                    }
                                                                                    className="border-muted-foreground/25"
                                                                                ></Input>
                                                                            </Label>
                                                                        </div>
                                                                        <div>
                                                                            <Label className="center-row gap-2">
                                                                                <Switch
                                                                                    checked={field.inline}
                                                                                    onCheckedChange={(inline) => setField((field) => ({ ...field, inline }))}
                                                                                ></Switch>
                                                                                <p>Inline</p>
                                                                            </Label>
                                                                        </div>
                                                                    </CollapsibleContent>
                                                                </Collapsible>
                                                            </Panel>
                                                        );
                                                    })}
                                                    {embed.fields.length < 25 ? (
                                                        <div>
                                                            <Button
                                                                variant="outline"
                                                                className="center-row gap-2"
                                                                onClick={() =>
                                                                    setEmbed((embed) => ({
                                                                        ...embed,
                                                                        fields: [...embed.fields, { name: "", value: "", inline: false, open: true }],
                                                                    }))
                                                                }
                                                            >
                                                                <FaPlus></FaPlus> Add Field
                                                            </Button>
                                                        </div>
                                                    ) : null}
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </Panel>
                                        <Panel>
                                            <Collapsible open={embed.imagesOpen} onOpenChange={(imagesOpen) => setEmbed((embed) => ({ ...embed, imagesOpen }))}>
                                                <CollapsibleTrigger>
                                                    <div className="center-row gap-2">
                                                        <FaChevronRight
                                                            className={`${embed.imagesOpen ? "rotate-90" : ""} transition-transform`}
                                                        ></FaChevronRight>
                                                        <h3 className="text-lg">Images</h3>
                                                    </div>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="flex flex-col gap-4">
                                                    <div></div>
                                                    <div>
                                                        <Label className="flex flex-col gap-2">
                                                            Image URL
                                                            <Input
                                                                value={embed.image.url}
                                                                onChange={({ currentTarget: { value } }) =>
                                                                    setEmbed((embed) => ({ ...embed, image: { url: value } }))
                                                                }
                                                            ></Input>
                                                        </Label>
                                                    </div>
                                                    <div>
                                                        <Label className="flex flex-col gap-2">
                                                            Thumbnail URL
                                                            <Input
                                                                value={embed.thumbnail.url}
                                                                onChange={({ currentTarget: { value } }) =>
                                                                    setEmbed((embed) => ({ ...embed, thumbnail: { url: value } }))
                                                                }
                                                            ></Input>
                                                        </Label>
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </Panel>
                                        <Panel>
                                            <Collapsible open={embed.footerOpen} onOpenChange={(footerOpen) => setEmbed((embed) => ({ ...embed, footerOpen }))}>
                                                <CollapsibleTrigger>
                                                    <div className="center-row gap-2">
                                                        <FaChevronRight
                                                            className={`${embed.footerOpen ? "rotate-90" : ""} transition-transform`}
                                                        ></FaChevronRight>
                                                        <h3 className="text-lg">Footer</h3>
                                                    </div>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="flex flex-col gap-4">
                                                    <div></div>
                                                    <div>
                                                        <Label className="flex flex-col gap-2">
                                                            Footer Text
                                                            <Input
                                                                value={embed.footer.text}
                                                                onChange={({ currentTarget: { value } }) =>
                                                                    setEmbed((embed) => ({ ...embed, footer: { ...embed.footer, text: value } }))
                                                                }
                                                            ></Input>
                                                        </Label>
                                                    </div>
                                                    <div>
                                                        <Label className="flex flex-col gap-2">
                                                            Footer Icon URL
                                                            <Input
                                                                value={embed.footer.iconURL}
                                                                onChange={({ currentTarget: { value } }) =>
                                                                    setEmbed((embed) => ({ ...embed, footer: { ...embed.footer, iconURL: value } }))
                                                                }
                                                            ></Input>
                                                        </Label>
                                                    </div>
                                                    <div>
                                                        <Label className="center-row gap-2">
                                                            <Switch
                                                                checked={embed.showTimestamp}
                                                                onCheckedChange={(showTimestamp) => setEmbed((embed) => ({ ...embed, showTimestamp }))}
                                                            ></Switch>
                                                            <p>Show Timestamp of Post</p>
                                                        </Label>
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </Panel>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </Panel>
                    );
                })}
            </div>
            {data.embeds.length < 10 ? (
                <div>
                    <Button
                        variant="outline"
                        className="center-row gap-2"
                        onClick={() =>
                            setData((data) => ({
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
                                        open: true,
                                        authorOpen: false,
                                        bodyOpen: true,
                                        fieldsOpen: false,
                                        footerOpen: false,
                                        imagesOpen: false,
                                    },
                                ],
                            }))
                        }
                    >
                        <FaPlus></FaPlus> Add Embed
                    </Button>
                </div>
            ) : null}
        </>
    );
}
