import React from "react";
import Panel from "./Panel";

export default function CenterPanel({ children }: { children: React.ReactNode }) {
    return (
        <div className="grow w-full center-row justify-center">
            <Panel className="mx-2 p-4 md:p-8 hover:scale-[102%] transition-[scale_250ms]">{children}</Panel>
        </div>
    );
}
