import { useRoleMap } from "@/hooks/roles";
import { cn } from "@/lib/utils";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { Button } from "./ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";

export default function SingleRoleSelector({
    role: id,
    setRole,
    showManaged = false,
    showHigher = false,
    showEveryone = false,
}: {
    role: string | null;
    setRole: (role: string | null) => unknown;
    showManaged?: boolean;
    showHigher?: boolean;
    showEveryone?: boolean;
}) {
    const [open, setOpen] = useState(false);

    const roles = useRoleMap();
    if (!roles) return <></>;

    return (
        <div className="center-row gap-2">
            <Popover open={open} onOpenChange={setOpen} modal>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-[max-content] justify-between">
                        {id ? (
                            id in roles ? (
                                roles[id]?.name
                            ) : (
                                <div className="center-row gap-2">
                                    <FaXmark></FaXmark> Invalid Role: <b>{id}</b>
                                </div>
                            )
                        ) : (
                            "Select a role"
                        )}
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
                                                setRole(id === newId ? null : newId);
                                                setOpen(false);
                                            }}
                                        >
                                            <div
                                                className="w-4 h-4 mr-2 rounded-full"
                                                style={{ backgroundColor: `#${role.color.toString(16).padStart(6, "0")}` }}
                                            ></div>
                                            {role.name}
                                            <CheckIcon className={cn("ml-auto h-4 w-4", role.id === id ? "opacity-100" : "opacity-0")}></CheckIcon>
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        </ScrollArea>
                    </Command>
                </PopoverContent>
            </Popover>
            {id ? (
                <Button variant="outline" className="h-9" onClick={() => setRole(null)}>
                    <FaXmark></FaXmark>
                </Button>
            ) : null}
        </div>
    );
}
