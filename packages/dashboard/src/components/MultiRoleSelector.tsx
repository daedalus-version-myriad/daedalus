import { useRoleMap } from "@/hooks/roles";
import { cn } from "@/lib/utils";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { FaTrash, FaXmark } from "react-icons/fa6";
import { Button } from "./ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";

export default function MultiRoleSelector({
    roles: ids,
    setRoles,
    showManaged = false,
    showHigher = false,
    showEveryone = false,
}: {
    roles: string[];
    setRoles: (role: string[]) => unknown;
    showManaged?: boolean;
    showHigher?: boolean;
    showEveryone?: boolean;
}) {
    const [open, setOpen] = useState(false);

    const roles = useRoleMap();
    if (!roles) return <></>;

    return (
        <div className="center-row gap-2 flex-wrap">
            <Popover open={open} onOpenChange={setOpen} modal>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-[max-content] justify-between">
                        Select roles
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50"></CaretSortIcon>
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[max-content] max-w-[320px] p-0">
                    <Command>
                        <CommandInput placeholder="Search roles" className="h-9"></CommandInput>
                        <CommandEmpty>No roles found</CommandEmpty>
                        <ScrollArea className="h-72">
                            <CommandGroup>
                                {Object.values(roles)
                                    .filter((role) => (showManaged || !role.managed) && (showHigher || !role.higher) && (showEveryone || !role.everyone))
                                    .map((role) => (
                                        <CommandItem
                                            key={role.id}
                                            value={role.id + "/" + role.name}
                                            onSelect={(newRole) => {
                                                const newId = newRole.split("/")[0];
                                                setRoles(
                                                    ids.includes(newId)
                                                        ? ids.filter((x) => x !== newId)
                                                        : [...ids, newId].sort((x, y) => roles[y].position - roles[x].position),
                                                );
                                            }}
                                        >
                                            <div
                                                className="w-4 h-4 mr-2 rounded-full"
                                                style={{ backgroundColor: `#${role.color.toString(16).padStart(6, "0")}` }}
                                            ></div>
                                            {role.name}
                                            <CheckIcon className={cn("ml-auto h-4 w-4", ids.includes(role.id) ? "opacity-100" : "opacity-0")}></CheckIcon>
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        </ScrollArea>
                    </Command>
                </PopoverContent>
            </Popover>
            {ids.map((id) => (
                <Button variant="outline" className="h-9 center-row gap-4" key={id} onClick={() => setRoles(ids.filter((x) => x !== id))}>
                    <FaXmark></FaXmark>
                    {roles[id].name}
                </Button>
            ))}
            {ids.length > 0 ? (
                <Button variant="outline" className="h-9 center-row gap-4" onClick={() => setRoles([])}>
                    <FaTrash color="#ff0000aa"></FaTrash>
                    Clear Roles
                </Button>
            ) : null}
        </div>
    );
}
