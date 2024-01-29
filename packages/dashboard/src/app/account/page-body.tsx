"use client";

import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import { Switch } from "@/components/ui/switch";
import { AccountSettings } from "@daedalus/types";
import { useState } from "react";
import save from "./save";

export function AccountRootBody(initial: AccountSettings) {
    const [data, setData] = useState(initial);

    const [notifyOwned, setNotifyOwned] = useState(data.notifyPremiumOwnedServers);
    const [notifyManaged, setNotifyManaged] = useState(data.notifyPremiumManagedServers);
    const [suppress, setSuppress] = useState(data.suppressAdminBroadcasts);

    const updated = { notifyPremiumOwnedServers: notifyOwned, notifyPremiumManagedServers: notifyManaged, suppressAdminBroadcasts: suppress };

    return (
        <>
            <Panel>
                <h1 className="text-xl">Account Settings</h1>
                <div className="grid grid-cols-[max-content_1fr] items-center gap-4">
                    <Switch checked={notifyOwned} onCheckedChange={setNotifyOwned}></Switch>
                    <b>Notify when the premium status of a server you own changes</b>
                    <Switch checked={notifyManaged} onCheckedChange={setNotifyManaged}></Switch>
                    <b>Notify when the premium status of a server you can manage changes</b>
                    <Switch checked={suppress} onCheckedChange={setSuppress}></Switch>
                    <span>
                        <b>Suppress Admin Broadcasts</b> (we will extremely rarely DM you if you own a server running Daedalus, only in situations that require
                        your immediate attention)
                    </span>
                </div>
            </Panel>
            <SaveChangesBar
                unsaved={JSON.stringify(updated) !== JSON.stringify(data)}
                reset={() => {
                    setNotifyOwned(data.notifyPremiumOwnedServers);
                    setNotifyManaged(data.notifyPremiumManagedServers);
                    setSuppress(data.suppressAdminBroadcasts);
                }}
                save={async () => {
                    const error = await save(updated);
                    if (error) return alert(error);
                    setData(updated);
                }}
            ></SaveChangesBar>
        </>
    );
}
