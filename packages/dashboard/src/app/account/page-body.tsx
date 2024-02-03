"use client";

import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AccountSettings } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import save from "./save";

export function AccountRootBody(initial: AccountSettings) {
    const [data, setData] = useState(initial);

    const [notifyOwned, setNotifyOwned] = useState(data.notifyPremiumOwnedServers);
    const [notifyManaged, setNotifyManaged] = useState(data.notifyPremiumManagedServers);

    const updated = { notifyPremiumOwnedServers: notifyOwned, notifyPremiumManagedServers: notifyManaged };

    return (
        <>
            <Panel>
                <h1 className="text-xl">Account Settings</h1>
                <Label className="center-row gap-4">
                    <Switch checked={notifyOwned} onCheckedChange={setNotifyOwned}></Switch>
                    <b>Notify when the premium status of a server you own changes</b>
                </Label>
                <Label className="center-row gap-4">
                    <Switch checked={notifyManaged} onCheckedChange={setNotifyManaged}></Switch>
                    <b>Notify when the premium status of a server you can manage changes</b>
                </Label>
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => {
                    setNotifyOwned(data.notifyPremiumOwnedServers);
                    setNotifyManaged(data.notifyPremiumManagedServers);
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
