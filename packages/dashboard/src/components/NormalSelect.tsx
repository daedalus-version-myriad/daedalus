"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export default function NormalSelect({
    value,
    setValue,
    options,
    placeholder,
}: {
    value: string;
    setValue: (t: string) => unknown;
    options: [string, string][];
    placeholder?: string;
}) {
    return (
        <Select value={value} onValueChange={setValue}>
            <SelectTrigger className="w-[min-content]">
                <SelectValue placeholder={placeholder}></SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {options.map(([value, label], i) => (
                        <SelectItem value={value} key={`${i}`}>
                            {label}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
