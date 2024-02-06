"use client";

import EnableModule from "@/components/EnableModule";
import MessageEditor from "@/components/MessageEditor";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleChannelSelector from "@/components/SingleChannelSelector";
import SingleRoleSelector from "@/components/SingleRoleSelector";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { textTypes } from "@/lib/data";
import { applyIndex, clone, removeIndex } from "@/lib/processors";
import { GuildSupporterAnnouncementsSettings } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import { FaCopy, FaPlus, FaTrash } from "react-icons/fa6";
import save from "./save";

export function Body({ data: initial, limit, disabled }: { data: GuildSupporterAnnouncementsSettings; limit: number; disabled: boolean }) {
    const [data, setData] = useState<GuildSupporterAnnouncementsSettings>(initial);
    const [announcements, setAnnouncements] = useState<GuildSupporterAnnouncementsSettings["announcements"]>(structuredClone(data.announcements));

    const updated = { guild: data.guild, announcements };

    return (
        <>
            <EnableModule guild={data.guild} module="supporter-announcements" disabled={disabled}></EnableModule>
            {announcements.length > limit ? (
                <p>
                    <b>Warning:</b> You have too many supporter announcements ({announcements.length} &gt; {limit}). The ones at the bottom of the list are
                    disabled. Please upgrade your plan or remove ones you do not need anymore.
                </p>
            ) : null}
            {announcements.map((announcement, i) => (
                <Item
                    key={`${i}`}
                    announcement={announcement}
                    setAnnouncement={(fn) => setAnnouncements((announcements) => applyIndex(announcements, i, fn))}
                    showClone={announcements.length < limit}
                    clone={() => setAnnouncements((announcements) => clone(announcements, i))}
                    del={() => setAnnouncements((announcements) => removeIndex(announcements, i))}
                ></Item>
            ))}
            {announcements.length < limit ? (
                <Button
                    variant="outline"
                    className="center-row gap-2"
                    onClick={() =>
                        setAnnouncements((announcements) => [
                            ...announcements,
                            {
                                useBoosts: true,
                                role: null,
                                channel: null,
                                message: { content: "", embeds: [] },
                            },
                        ])
                    }
                >
                    <FaPlus></FaPlus> Add Supporter Announcement
                </Button>
            ) : null}
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => setAnnouncements(structuredClone(data.announcements))}
                save={async () => {
                    const error = await save(updated);
                    if (error) return alert(error);
                    setData(updated);
                }}
            ></SaveChangesBar>
        </>
    );
}

function Item({
    announcement,
    setAnnouncement,
    showClone,
    clone,
    del,
}: {
    announcement: GuildSupporterAnnouncementsSettings["announcements"][number];
    setAnnouncement: (
        fn: (announcement: GuildSupporterAnnouncementsSettings["announcements"][number]) => GuildSupporterAnnouncementsSettings["announcements"][number],
    ) => unknown;
    showClone: boolean;
    clone: () => unknown;
    del: () => unknown;
}) {
    return (
        <Panel>
            <div className="center-row justify-between">
                <div className="center-row gap-2">
                    <b>Detect Role</b>
                    <Switch
                        checked={announcement.useBoosts}
                        onCheckedChange={(useBoosts) => setAnnouncement((announcement) => ({ ...announcement, useBoosts }))}
                    ></Switch>
                    <b>Detect Boosts</b>
                </div>
                <div className="center-row gap-1">
                    {showClone ? (
                        <Button variant="ghost" onClick={clone}>
                            <FaCopy></FaCopy>
                        </Button>
                    ) : null}
                    <Button variant="ghost" onClick={del}>
                        <FaTrash></FaTrash>
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-[max-content_1fr] items-center gap-4">
                {announcement.useBoosts ? null : (
                    <>
                        <b>Role:</b>
                        <SingleRoleSelector
                            role={announcement.role}
                            setRole={(role) => setAnnouncement((announcement) => ({ ...announcement, role }))}
                            showHigher
                            showManaged
                        ></SingleRoleSelector>
                    </>
                )}
                <b>Channel:</b>
                <SingleChannelSelector
                    channel={announcement.channel}
                    setChannel={(channel) => setAnnouncement((announcement) => ({ ...announcement, channel }))}
                    types={textTypes}
                ></SingleChannelSelector>
            </div>
            <MessageEditor
                data={announcement.message}
                setData={(message) => !_.isEqual(message, announcement.message) && setAnnouncement((announcement) => ({ ...announcement, message }))}
            ></MessageEditor>
        </Panel>
    );
}
