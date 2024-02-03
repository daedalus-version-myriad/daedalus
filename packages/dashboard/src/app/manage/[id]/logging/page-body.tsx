"use client";

import EnableModule from "@/components/EnableModule";
import MultiChannelSelector from "@/components/MultiChannelSelector";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { textTypes } from "@/lib/data";
import { categoryToEventMap, logCategories, logEvents } from "@daedalus/logging";
import { GuildLoggingSettings } from "@daedalus/types";
import _ from "lodash";
import { Dispatch, SetStateAction, useState } from "react";
import save from "./save";

export function Body({ data: initial, module, disabled }: { data: GuildLoggingSettings; module: string; disabled: boolean }) {
    const [data, setData] = useState<GuildLoggingSettings>(initial);

    const [useWebhook, setUseWebhook] = useState<boolean>(data.useWebhook);
    const [channel, setChannel] = useState<string | null>(data.channel);
    const [webhook, setWebhook] = useState<string>(data.webhook);
    const [ignoredChannels, setIgnoredChannels] = useState<string[]>(data.ignoredChannels);
    const [fileOnlyMode, setFileOnlyMode] = useState<boolean>(data.fileOnlyMode);
    const [items, setItems] = useState<GuildLoggingSettings["items"]>(data.items);

    const updated = { guild: data.guild, useWebhook, channel, webhook, ignoredChannels, fileOnlyMode, items };

    return (
        <>
            <EnableModule guild={data.guild} module={module} disabled={disabled}></EnableModule>
            <Panel>
                <h1 className="text-xl">Default Log Output Settings</h1>
                <Label className="center-row gap-4">
                    <Switch checked={useWebhook} onCheckedChange={setUseWebhook}></Switch>
                    <b>Output to webhook</b>
                </Label>
                {useWebhook ? (
                    <Input
                        type="password"
                        placeholder="Webhook URL"
                        value={webhook}
                        onChange={({ currentTarget: { value } }) => setWebhook(value)}
                        maxLength={128}
                    ></Input>
                ) : (
                    <SingleChannelSelector channel={channel} setChannel={setChannel} types={textTypes}></SingleChannelSelector>
                )}
                <Separator></Separator>
                <h1 className="text-xl">Ignored Channels</h1>
                <MultiChannelSelector channels={ignoredChannels} setChannels={setIgnoredChannels} showReadonly></MultiChannelSelector>
                <Separator></Separator>
                <h1 className="text-xl">File-Only Mode</h1>
                <p>
                    When enabled, events in the <b>Message Logs</b> category will be ignored if not related to a message containing a file, and edits/deletions
                    will only log files. This is suitable for use as a supplement to another logging bot.
                </p>
                <Label className="center-row gap-4">
                    <Switch checked={fileOnlyMode} onCheckedChange={setFileOnlyMode}></Switch>
                    <b>Enable File-Only Mode</b>
                </Label>
            </Panel>
            <Panel>
                <h1 className="text-xl">Log Categories / Events</h1>
                <div className="center-row gap-4">
                    <Button
                        variant="outline"
                        onClick={() =>
                            setItems((items) => ({
                                ...items,
                                ...Object.fromEntries(Object.keys(logCategories).map((key) => [key, { ...items[key], enabled: false }])),
                            }))
                        }
                    >
                        Disable All Categories
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() =>
                            setItems((items) => ({
                                ...items,
                                ...Object.fromEntries(Object.keys(logCategories).map((key) => [key, { ...items[key], enabled: true }])),
                            }))
                        }
                    >
                        Enable All Categories
                    </Button>
                </div>
                <Accordion type="multiple">
                    {Object.entries(logCategories).map(([id, name]) => (
                        <AccordionItem key={id} value={id}>
                            <AccordionTrigger className="text-lg">
                                <b>{name}</b>
                            </AccordionTrigger>
                            <Item {...{ items, setItems, id }} name="category"></Item>
                            <AccordionContent>
                                {categoryToEventMap[id].map((id) => (
                                    <Panel key={id}>
                                        <h3 className="text-lg">
                                            Event: <b>{logEvents[id].name}</b>
                                        </h3>
                                        <Item {...{ items, setItems, id }} name="event"></Item>
                                    </Panel>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => {
                    setUseWebhook(data.useWebhook);
                    setChannel(data.channel);
                    setWebhook(data.webhook);
                    setIgnoredChannels(data.ignoredChannels);
                    setFileOnlyMode(data.fileOnlyMode);
                    setItems(data.items);
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

function Item({
    items,
    setItems,
    id,
    name,
}: {
    items: GuildLoggingSettings["items"];
    setItems: Dispatch<SetStateAction<GuildLoggingSettings["items"]>>;
    id: string;
    name: "category" | "event";
}) {
    function update<T extends keyof GuildLoggingSettings["items"][string]>(key: T, value: GuildLoggingSettings["items"][string][T]) {
        setItems((items) => ({ ...items, [id]: { ...items[id], [key]: value } }));
    }

    return (
        <div className="flex flex-col gap-4 mb-4">
            <Label className="center-row gap-4">
                <Switch checked={items[id]?.enabled} onCheckedChange={(checked) => update("enabled", checked)}></Switch>
                <b>Enable this {name}</b>
            </Label>
            <p>Set the values below to override the default output settings.</p>
            <Label className="center-row gap-4">
                <Switch checked={items[id]?.useWebhook} onCheckedChange={(checked) => update("useWebhook", checked)}></Switch>
                <b>Output to webhook</b>
            </Label>
            {items[id]?.useWebhook ? (
                <Input
                    type="password"
                    placeholder="Webhook URL"
                    value={items[id].webhook}
                    onChange={({ currentTarget: { value } }) => update("webhook", value)}
                    maxLength={128}
                ></Input>
            ) : (
                <SingleChannelSelector channel={items[id].channel} setChannel={(ch) => update("channel", ch)} types={textTypes}></SingleChannelSelector>
            )}
        </div>
    );
}
