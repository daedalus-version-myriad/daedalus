import { useChannelMap, useChannelOrder } from "@/hooks/channels";
import { channelIcons } from "@/lib/data";
import { cn } from "@/lib/utils";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import _ from "lodash";
import { useState } from "react";
import { FaTrash, FaXmark } from "react-icons/fa6";
import { Button } from "./ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";

export default function MultiChannelSelector({
    channels: ids,
    setChannels,
    types,
    showReadonly = false,
}: {
    channels: string[];
    setChannels: (channel: string[]) => unknown;
    types?: number[];
    showReadonly?: boolean;
}) {
    const [open, setOpen] = useState(false);

    const channelMap = useChannelMap();
    const channelOrder = useChannelOrder();

    if (!channelMap || !channelOrder) return <></>;

    const [roots, childrenMap, channels] = channelOrder;
    const order = Object.fromEntries(channels.map((channel, i) => [channel.id, i]));

    return (
        <div className="center-row gap-2 flex-wrap">
            <Popover open={open} onOpenChange={setOpen} modal>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-[max-content] justify-between">
                        Select channels
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50"></CaretSortIcon>
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[max-content] max-w-[320px] p-0">
                    <Command>
                        <CommandInput placeholder="Search channels" className="h-9"></CommandInput>
                        <CommandEmpty>No channels found</CommandEmpty>
                        <ScrollArea className="h-72">
                            {_.isEqual(types, [4]) ? (
                                <CommandGroup>
                                    {roots
                                        .filter((channel) => channel.type === 4)
                                        .map((channel) => (
                                            <CommandItem
                                                key={channel.id}
                                                value={channel.id + "/" + channel.name}
                                                onSelect={(newChannel) => {
                                                    const newId = newChannel.split("/")[0];
                                                    setChannels(
                                                        ids.includes(newId)
                                                            ? ids.filter((x) => x !== newId)
                                                            : [...ids, newId].sort((x, y) => order[x] - order[y]),
                                                    );
                                                }}
                                            >
                                                <div className="w-4 mr-2 center-col">{channelIcons[channel.type]?.({})}</div>
                                                {channel.name}
                                                <CheckIcon
                                                    className={cn("ml-auto h-4 w-4", ids.includes(channel.id) ? "opacity-100" : "opacity-0")}
                                                ></CheckIcon>
                                            </CommandItem>
                                        ))}
                                </CommandGroup>
                            ) : (
                                <>
                                    <CommandGroup>
                                        {roots
                                            .filter(
                                                (channel) =>
                                                    (showReadonly || !channel.readonly) && channel.type !== 4 && (!types || types.includes(channel.type)),
                                            )
                                            .map((channel) => (
                                                <CommandItem
                                                    key={channel.id}
                                                    value={channel.id + "/" + channel.name}
                                                    onSelect={(newChannel) => {
                                                        const newId = newChannel.split("/")[0];
                                                        setChannels(
                                                            ids.includes(newId)
                                                                ? ids.filter((x) => x !== newId)
                                                                : [...ids, newId].sort((x, y) => order[x] - order[y]),
                                                        );
                                                    }}
                                                >
                                                    <div className="w-4 mr-2 center-col">{channelIcons[channel.type]?.({})}</div>
                                                    {channel.name}
                                                    <CheckIcon
                                                        className={cn("ml-auto h-4 w-4", ids.includes(channel.id) ? "opacity-100" : "opacity-0")}
                                                    ></CheckIcon>
                                                </CommandItem>
                                            ))}
                                    </CommandGroup>
                                    {roots
                                        .filter((channel) => channel.type === 4)
                                        .map((channel) => (
                                            <CommandGroup key={channel.id} heading={channel.name.toUpperCase()}>
                                                {[channel, ...(childrenMap.get(channel.id) ?? [])]
                                                    .filter((child) => (showReadonly || !channel.readonly) && (!types || types.includes(child.type)))
                                                    .map((child) => (
                                                        <CommandItem
                                                            key={child.id}
                                                            value={child.id + "/" + child.name}
                                                            onSelect={(newChannel) => {
                                                                const newId = newChannel.split("/")[0];
                                                                setChannels(
                                                                    ids.includes(newId)
                                                                        ? ids.filter((x) => x !== newId)
                                                                        : [...ids, newId].sort((x, y) => order[x] - order[y]),
                                                                );
                                                            }}
                                                        >
                                                            <div className="w-4 mr-2 center-col">{channelIcons[child.type]?.({})}</div>
                                                            {child.name}
                                                            <CheckIcon
                                                                className={cn("ml-auto h-4 w-4", ids.includes(child.id) ? "opacity-100" : "opacity-0")}
                                                            ></CheckIcon>
                                                        </CommandItem>
                                                    ))}
                                            </CommandGroup>
                                        ))}
                                </>
                            )}
                        </ScrollArea>
                    </Command>
                </PopoverContent>
            </Popover>
            {ids.map((id) => (
                <Button variant="outline" className="h-9 center-row gap-4" key={id} onClick={() => setChannels(ids.filter((x) => x !== id))}>
                    <FaXmark></FaXmark>
                    <div className="center-row gap-1">
                        {id in channelMap ? (
                            <>
                                {channelIcons[channelMap[id].type]?.({})} {channelMap[id].name}
                            </>
                        ) : (
                            <div className="center-row gap-2">
                                Invalid Channel: <b>{id}</b>
                            </div>
                        )}
                    </div>
                </Button>
            ))}
            {ids.length > 0 ? (
                <Button variant="outline" className="h-9 center-row gap-4" onClick={() => setChannels([])}>
                    <FaTrash color="#ff0000aa"></FaTrash>
                    Clear Channels
                </Button>
            ) : null}
        </div>
    );
}
