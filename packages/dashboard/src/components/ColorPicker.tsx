import { useCallback, useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export default function ColorPicker({ color, setColor, hideButton = false }: { color: number; setColor: (color: number) => unknown; hideButton?: boolean }) {
    const hex = `#${color.toString(16).padStart(6, "0")}`;
    const [input, setInput] = useState<string>(hex);
    const set = useCallback((raw: string) => (raw.match(/^#[0-9a-f]{6}$/) ? setColor(parseInt(raw.substring(1), 16)) : null), [setColor]);

    useEffect(() => {
        setInput(hex);
    }, [hex]);

    return (
        <div className="center-row gap-2">
            <Popover modal>
                <PopoverTrigger asChild>
                    <div className="w-[max-content] center-row gap-2">
                        <div className="h-9 w-9 rounded" style={{ backgroundColor: hex }}></div>
                        {hideButton ? null : <Button variant="secondary">Select Color</Button>}
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-[max-content]">
                    <HexColorPicker color={hex} onChange={set}></HexColorPicker>
                </PopoverContent>
            </Popover>
            <div>
                <Input value={input} onInput={({ currentTarget: { value } }) => (setInput(value), set(value))}></Input>
            </div>
        </div>
    );
}
