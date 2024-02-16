"use client";

import { DatePicker } from "./ui/datepicker";
import { TimePicker } from "./ui/timepicker";

export default function DatetimePicker({ date, setDate }: { date: number; setDate: (date: number) => unknown }) {
    return (
        <div className="center-row gap-2 flex-wrap">
            <DatePicker date={date} setDate={setDate}></DatePicker>
            <TimePicker date={date} setDate={setDate}></TimePicker>
        </div>
    );
}
