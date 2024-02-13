"use client";

import { useEmojisMap } from "@/hooks/emojis";
import { emojiList, nameMap } from "@/lib/data";
import { cn } from "@/lib/utils";
import { fuzzy } from "@daedalus/global-utils";
import data from "@emoji-mart/data";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { useMemo, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { Button } from "./ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";

export default function SingleEmojiSelector({ emoji: id, setEmoji }: { emoji: string | null; setEmoji: (emoji: string | null) => unknown }) {
    const emojis = useEmojisMap();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const subset = useMemo(
        () =>
            emojiList
                .filter((e) => fuzzy(e.toLowerCase(), query.toLowerCase()) || fuzzy((data as any).emojis[e]?.name.toLowerCase() ?? "", query.toLowerCase()))
                .slice(0, 100),
        [query],
    );

    if (!emojis) return <></>;

    return (
        <div className="center-row gap-2">
            <Popover open={open} onOpenChange={setOpen} modal>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-[max-content] justify-between">
                        {id ? (
                            <div className="center-row gap-2">
                                {id.match(/^[1-9][0-9]{16,19}$/) ? (
                                    id in emojis ? (
                                        <>
                                            <Image src={emojis[id]?.url} alt="" width={20} height={20}></Image>
                                            {emojis[id]?.name}
                                        </>
                                    ) : (
                                        <div className="center-row gap-2">
                                            <FaXmark></FaXmark> Invalid Emoji: <b>{id}</b>
                                        </div>
                                    )
                                ) : (
                                    <>
                                        <span>{id}</span>
                                        <span>{nameMap[id]}</span>
                                    </>
                                )}
                            </div>
                        ) : (
                            "Select an emoji"
                        )}
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50"></CaretSortIcon>
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[max-content] max-w-[500px] p-0">
                    <Command>
                        <CommandInput value={query} onValueChange={setQuery} placeholder="Search emoji" className="h-9"></CommandInput>
                        <CommandEmpty>No emoji found</CommandEmpty>
                        <ScrollArea className="h-72">
                            <CommandGroup>
                                {Object.values(emojis).map((emoji) => (
                                    <CommandItem
                                        key={emoji.id}
                                        value={emoji.id + "/" + emoji.name}
                                        onSelect={(newEmoji) => {
                                            const newId = newEmoji.split("/")[0];
                                            setEmoji(id === newId ? null : newId);
                                            setOpen(false);
                                        }}
                                        className="center-row gap-2"
                                    >
                                        <Image src={emoji.url} alt="" width={20} height={20}></Image>
                                        {emoji.name}
                                        <CheckIcon className={cn("ml-auto h-4 w-4", emoji.id === id ? "opacity-100" : "opacity-0")}></CheckIcon>
                                    </CommandItem>
                                ))}
                                {subset.map((id) => {
                                    const name: string = (data as any).emojis[id]?.name;
                                    const ch: string = (data as any).emojis[id]?.skins[0]?.native;
                                    if (!ch) return null;
                                    return (
                                        <CommandItem
                                            key={ch}
                                            value={ch + "/" + name + "/" + id}
                                            onSelect={(newEmoji) => {
                                                const newId = newEmoji.split("/")[0];
                                                setEmoji(id === newId ? null : newId);
                                                setOpen(false);
                                            }}
                                            className="center-row gap-2"
                                        >
                                            <span>{ch}</span>
                                            <span>{name}</span>
                                            <CheckIcon className={cn("ml-auto h-4 w-4", ch === id ? "opacity-100" : "opacity-0")}></CheckIcon>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </ScrollArea>
                    </Command>
                </PopoverContent>
            </Popover>
            {id ? (
                <Button variant="outline" className="h-9" onClick={() => setEmoji(null)}>
                    <FaXmark></FaXmark>
                </Button>
            ) : null}
        </div>
    );
}
