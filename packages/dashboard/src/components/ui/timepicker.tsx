"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { FaAngleDown, FaAngleUp } from "react-icons/fa6";

export function TimePicker({ date, setDate }: { date: number; setDate: (date: number) => unknown }) {
    const obj = useMemo(() => new Date(date), [date]);

    const [hours, setHours] = useState<string>(`${obj.getHours() % 12 || 12}`);
    const [minutes, setMinutes] = useState<string>(`${obj.getMinutes()}`);
    const [seconds, setSeconds] = useState<string>(`${obj.getSeconds()}`);

    useEffect(() => {
        setHours(`${obj.getHours() % 12 || 12}`);
        setMinutes(`${obj.getMinutes()}`);
        setSeconds(`${obj.getSeconds()}`);
    }, [obj]);

    return (
        <Popover modal>
            <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    {format(obj, "ppp")}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                <div className="center-row gap-1">
                    <div className="center-col gap-1">
                        <Button variant={"outline"} className="w-16" onClick={() => setDate(date + 3600000)}>
                            <FaAngleUp></FaAngleUp>
                        </Button>
                        <Input
                            type="number"
                            className="textlike w-16 text-center"
                            value={hours}
                            onChange={({ currentTarget: { value } }) => {
                                setHours(value);
                                const int = +value;
                                if (isNaN(int)) return;
                                const date = obj;
                                date.setHours((int === 12 ? 0 : int === 0 ? -12 : int) + (date.getHours() >= 12 ? 12 : 0));
                                setDate(date.getTime());
                            }}
                        ></Input>
                        <Button variant={"outline"} className="w-16" onClick={() => setDate(date - 3600000)}>
                            <FaAngleDown></FaAngleDown>
                        </Button>
                    </div>
                    <div className="center-col gap-1">
                        <Button variant={"outline"} className="w-16" onClick={() => setDate(date + 60000)}>
                            <FaAngleUp></FaAngleUp>
                        </Button>
                        <Input
                            type="number"
                            className="textlike w-16 text-center"
                            value={minutes}
                            onChange={({ currentTarget: { value } }) => {
                                setMinutes(value);
                                const int = +value;
                                if (isNaN(int)) return;
                                const date = obj;
                                date.setMinutes(int);
                                setDate(date.getTime());
                            }}
                        ></Input>
                        <Button variant={"outline"} className="w-16" onClick={() => setDate(date - 60000)}>
                            <FaAngleDown></FaAngleDown>
                        </Button>
                    </div>
                    <div className="center-col gap-1">
                        <Button variant={"outline"} className="w-16" onClick={() => setDate(date + 1000)}>
                            <FaAngleUp></FaAngleUp>
                        </Button>
                        <Input
                            type="number"
                            className="textlike w-16 text-center"
                            value={seconds}
                            onChange={({ currentTarget: { value } }) => {
                                setSeconds(value);
                                const int = +value;
                                if (isNaN(int)) return;
                                const date = obj;
                                date.setSeconds(int);
                                setDate(date.getTime());
                            }}
                        ></Input>
                        <Button variant={"outline"} className="w-16" onClick={() => setDate(date - 1000)}>
                            <FaAngleDown></FaAngleDown>
                        </Button>
                    </div>
                    <Button
                        variant={"outline"}
                        className="w-16"
                        onClick={() => {
                            const date = obj;
                            date.setHours((date.getHours() + 12) % 24);
                            setDate(date.getTime());
                        }}
                    >
                        {obj.getHours() < 12 ? "AM" : "PM"}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
