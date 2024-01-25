"use client";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { useState } from "react";

const map: Record<string, string> = { logging: "Logging" };
const modules = Object.entries(map).map(([key, value]) => ({ value: key, label: value }));

export default function ModuleList() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("logging");

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
                        {value ? modules.find((module) => module.value === value)?.label : "Select module..."}
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                        <CommandInput placeholder="Search modules..." className="h-9" />
                        <CommandEmpty>No modules found.</CommandEmpty>
                        <CommandGroup>
                            {modules.map((module) => (
                                <CommandItem
                                    key={module.value}
                                    value={module.value}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? "" : currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    {module.label}
                                    <CheckIcon className={cn("ml-auto h-4 w-4", value === module.value ? "opacity-100" : "opacity-0")} />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
            <h2 className="text-xl">{map[value]}</h2>
            {value === "logging" ? <>Logging</> : <>Not Implemented</>}
        </>
    );
}
