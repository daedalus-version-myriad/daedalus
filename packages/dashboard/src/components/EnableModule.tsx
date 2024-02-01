"use client";

import enableModule from "@/actions/enable-module";
import { useState } from "react";
import Panel from "./Panel";
import { Button } from "./ui/button";

export default function EnableModule({ guild, module, disabled: initial }: { guild: string; module: string; disabled: boolean }) {
    const [disabled, setDisabled] = useState<boolean>(initial);

    if (!disabled) return <></>;

    return (
        <Panel className="bg-[#aa000033] dark:bg-[#ff666633]">
            <div className="center-row gap-4">
                <span>
                    This module is disabled. You can manage module settings in the <b>Modules &amp; Permissions</b> tab.
                </span>
                <Button
                    variant="outline"
                    onClick={async () => {
                        const error = await enableModule(guild, module);
                        if (error) return alert(error);
                        setDisabled(false);
                    }}
                >
                    Enable Module
                </Button>
            </div>
        </Panel>
    );
}
