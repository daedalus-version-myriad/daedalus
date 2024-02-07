"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { removeIndex } from "@/lib/processors";
import { useState } from "react";
import { FaPlus, FaTrash, FaXmark } from "react-icons/fa6";

export function snowflakeFilter(term: string) {
    if (!term.match(/^[1-9][0-9]{16,19}$/)) return "Discord IDs must be 17-20 digit numbers.";
    return null;
}

export default function ListInput({
    list,
    setList,
    filter = () => null,
    limit,
}: {
    list: string[];
    setList: (list: string[]) => unknown;
    filter?: (term: string) => string | null;
    limit?: number;
}) {
    const [useTextarea, setUseTextarea] = useState<boolean>(false);
    const [item, setItem] = useState<string>("");
    const [content, setContent] = useState<string>("");

    function addItem() {
        const trimmed = item.trim();
        if (!trimmed) return;

        const error = filter(trimmed);
        if (error) return alert(error);

        if (!list.includes(trimmed)) setList([...list, trimmed].sort());
        setItem("");
    }

    return (
        <>
            <div>
                <Button
                    variant="outline"
                    onClick={() =>
                        setUseTextarea((t) => {
                            if (!t) setContent(list.join(", "));
                            return !t;
                        })
                    }
                >
                    {useTextarea ? "Use interactive mode" : "Use textarea"}
                </Button>
            </div>
            {limit && list.length > limit ? <b>Limit ({limit}) exceeded.</b> : null}
            {useTextarea ? (
                <Textarea
                    value={content}
                    onChange={({ currentTarget: { value } }) => (setContent(value), setList([...new Set(value.split(","))].map((x) => x.trim()).sort()))}
                ></Textarea>
            ) : (
                <>
                    <div className="center-row gap-2 flex-wrap">
                        {list.map((item, i) => (
                            <Button
                                key={`${i}`}
                                variant="outline"
                                className={`center-row gap-2 ${filter(item) ? "border border-[#ff0000cc]" : ""}`}
                                onClick={() => setList(removeIndex(list, i))}
                            >
                                <FaXmark></FaXmark> {item}
                            </Button>
                        ))}
                        <Button variant="outline" className="center-row gap-2" onClick={() => confirm("Clear all items?") && setList([])}>
                            <FaTrash color="#ff0000aa"></FaTrash> Delete All
                        </Button>
                    </div>
                    <div className="center-row gap-2">
                        <div>
                            <Input
                                value={item}
                                onChange={({ currentTarget: { value } }) => setItem(value)}
                                placeholder="Add Item"
                                onKeyDown={(e) => e.key === "Enter" && addItem()}
                            ></Input>
                        </div>
                        <Button variant="outline" onClick={addItem}>
                            <FaPlus></FaPlus>
                        </Button>
                    </div>
                </>
            )}
        </>
    );
}
