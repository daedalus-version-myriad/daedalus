"use client";

import { DashboardGuild } from "@daedalus/types";
import { createContext, useContext } from "react";

const GuildContext = createContext<DashboardGuild | null>(null);

export function GuildWrapper({ guild, children }: React.PropsWithChildren<{ guild: DashboardGuild | null }>) {
    return <GuildContext.Provider value={guild}>{children}</GuildContext.Provider>;
}

export function useGuildContext() {
    return useContext(GuildContext);
}
