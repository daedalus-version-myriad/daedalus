"use client";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { modules, permissions } from "@daedalus/data";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Panel from "../../../components/Panel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";

export default function ModuleList() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();

    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(params.get("module") ?? "logging");

    useEffect(() => {
        const current = new URLSearchParams([...params.entries()]);
        current.set("module", value);
        router.replace(`${pathname}?${current}`);
    }, [router, pathname, params, value]);

    const data = modules[value];

    return (
        <>
            <Popover open={open} onOpenChange={setOpen} modal>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-[max-content] justify-between">
                        {value ? data?.name ?? value : "Select a module"}
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50"></CaretSortIcon>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[max-content] p-0">
                    <Command>
                        <CommandInput placeholder="Search modules" className="h-9"></CommandInput>
                        <CommandEmpty>No modules found</CommandEmpty>
                        <ScrollArea className="h-72">
                            <CommandGroup>
                                {Object.entries(modules).map(([id, data]) => (
                                    <CommandItem
                                        key={id}
                                        value={data.name}
                                        onSelect={() => {
                                            setValue(id);
                                            setOpen(false);
                                        }}
                                    >
                                        {data.name}
                                        <CheckIcon className={cn("ml-auto h-4 w-4", value === id ? "opacity-100" : "opacity-0")}></CheckIcon>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </ScrollArea>
                    </Command>
                </PopoverContent>
            </Popover>
            {data ? (
                <>
                    <h2 className="text-xl">{data.name}</h2>
                    <p>{data.description}</p>
                    {data.selfPermissions ? (
                        <>
                            <p>This module requires the following permission{data.selfPermissions.length === 1 ? "" : "s"}:</p>
                            <ul className="list-disc ml-4">
                                {data.selfPermissions.map((x) => {
                                    const permission = permissions[x as keyof typeof permissions];
                                    if (!permission)
                                        return (
                                            <li key={x}>
                                                <b>{x}</b>
                                            </li>
                                        );

                                    return (
                                        <li key={x}>
                                            <b>{permissions[x as keyof typeof permissions]?.name}</b>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" className="ml-4">
                                                        ?
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>{permission.name}</DialogTitle>
                                                    </DialogHeader>
                                                    <div dangerouslySetInnerHTML={{ __html: permission.description }}></div>
                                                    {permission.callouts ? (
                                                        <div>
                                                            {permission.callouts.map((x, i) => (
                                                                <Panel key={i}>
                                                                    <div dangerouslySetInnerHTML={{ __html: x.content }}></div>
                                                                </Panel>
                                                            ))}
                                                        </div>
                                                    ) : null}
                                                </DialogContent>
                                            </Dialog>
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    ) : null}
                    {data.commands ? (
                        <>
                            <h3 className="text-lg">Commands</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Command</TableHead>
                                        <TableHead>Usage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.values(data.commands).flatMap((command) =>
                                        command.syntaxes.map(([syntax, description]) => (
                                            <TableRow key={syntax}>
                                                <TableCell className="pr-8">
                                                    <code>{syntax}</code>
                                                </TableCell>
                                                <TableCell dangerouslySetInnerHTML={{ __html: description }}></TableCell>
                                            </TableRow>
                                        )),
                                    )}
                                </TableBody>
                            </Table>
                        </>
                    ) : null}
                </>
            ) : (
                <p>
                    <b>Not Implemented</b>
                </p>
            )}
        </>
    );
}
