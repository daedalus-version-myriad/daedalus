"use server";

import { GuildWrapper } from "@/context/guild";
import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { redirect } from "next/navigation";
import React from "react";
import { INVITE_LINK } from "../../../lib/data";
import ManageLayoutBody from "./layout-body";

export default async function ManageLayout({ children, params: { id: guildId } }: Readonly<{ children: React.ReactNode; params: { id: string } }>) {
    const id = await getId();
    if (!id) return <></>;

    const guild = await trpc.userGuild.query({ id, guild: guildId });

    if ("error" in guild) return void redirect(`${INVITE_LINK}&guild_id=${guildId}`);

    return (
        <GuildWrapper guild={guild}>
            <ManageLayoutBody id={guildId} name={guild.name}>
                {children}
            </ManageLayoutBody>
        </GuildWrapper>
    );
}
