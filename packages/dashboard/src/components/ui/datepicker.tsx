"use client";

import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FaCalendar } from "react-icons/fa6";

export function DatePicker({ date, setDate }: { date: number; setDate: (date: number) => unknown }) {
    const obj = new Date(date);

    return (
        <Popover modal>
            <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <FaCalendar className="mr-2" />
                    {format(obj, "PPP")}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={obj} onSelect={(input) => input && setDate(input.getTime() + (date % 86400000))} initialFocus />
            </PopoverContent>
        </Popover>
    );
}
