"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export default function NormalSelect<T extends string>({
    value,
    setValue,
    options,
    placeholder,
    className = "w-[min-content]",
}: {
    value: T;
    setValue: (t: T) => unknown;
    options: [T, string][];
    placeholder?: string;
    className?: string;
}) {
    return (
        <Select value={value} onValueChange={setValue}>
            <SelectTrigger className={className}>
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
