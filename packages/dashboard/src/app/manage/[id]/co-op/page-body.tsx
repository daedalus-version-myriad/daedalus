"use client";

import EnableModule from "@/components/EnableModule";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import SingleRoleSelector from "@/components/SingleRoleSelector";
import { GuildCoOpSettings } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import save from "./save";

export function Body({ data: initial, disabled }: { data: GuildCoOpSettings; disabled: boolean }) {
    const [data, setData] = useState<GuildCoOpSettings>(initial);
    const [wl0, setWL0] = useState<string | null>(data.wl0);
    const [wl1, setWL1] = useState<string | null>(data.wl1);
    const [wl2, setWL2] = useState<string | null>(data.wl2);
    const [wl3, setWL3] = useState<string | null>(data.wl3);
    const [wl4, setWL4] = useState<string | null>(data.wl4);
    const [wl5, setWL5] = useState<string | null>(data.wl5);
    const [wl6, setWL6] = useState<string | null>(data.wl6);
    const [wl7, setWL7] = useState<string | null>(data.wl7);
    const [wl8, setWL8] = useState<string | null>(data.wl8);
    const [regionNA, setRegionNA] = useState<string | null>(data.regionNA);
    const [regionEU, setRegionEU] = useState<string | null>(data.regionEU);
    const [regionAS, setRegionAS] = useState<string | null>(data.regionAS);
    const [regionSA, setRegionSA] = useState<string | null>(data.regionSA);
    const [helperNA, setHelperNA] = useState<string | null>(data.helperNA);
    const [helperEU, setHelperEU] = useState<string | null>(data.helperEU);
    const [helperAS, setHelperAS] = useState<string | null>(data.helperAS);
    const [helperSA, setHelperSA] = useState<string | null>(data.helperSA);

    const updated = {
        guild: data.guild,
        wl0,
        wl1,
        wl2,
        wl3,
        wl4,
        wl5,
        wl6,
        wl7,
        wl8,
        regionNA,
        regionEU,
        regionAS,
        regionSA,
        helperNA,
        helperEU,
        helperAS,
        helperSA,
    };

    return (
        <>
            <EnableModule guild={data.guild} module="co-op" disabled={disabled}></EnableModule>
            <Panel>
                <h1 className="text-xl">Genshin Impact Co-op</h1>
                <p>
                    World level and region roles are used to automatically detect users&apos; world level and region when they use the <b>/co-op</b> command.
                </p>
                <p>If they have exactly one world level role, they will not be required to specify their world level, and likewise for region.</p>
                <p>The helper role for the region selected by the user will be pinged if set.</p>
                <p>There is a 30-minute per-user cooldown on using the co-op command.</p>
            </Panel>
            <Panel>
                <h1 className="text-xl">World Level Roles</h1>
                <div className="grid sm:grid-cols-[repeat(2,max-content_1fr)] lg:grid-cols-[repeat(3,max-content_1fr)] items-center gap-4">
                    <b>WL0</b>
                    <SingleRoleSelector role={wl0} setRole={setWL0} showHigher showManaged></SingleRoleSelector>
                    <b>WL1</b>
                    <SingleRoleSelector role={wl1} setRole={setWL1} showHigher showManaged></SingleRoleSelector>
                    <b>WL2</b>
                    <SingleRoleSelector role={wl2} setRole={setWL2} showHigher showManaged></SingleRoleSelector>
                    <b>WL3</b>
                    <SingleRoleSelector role={wl3} setRole={setWL3} showHigher showManaged></SingleRoleSelector>
                    <b>WL4</b>
                    <SingleRoleSelector role={wl4} setRole={setWL4} showHigher showManaged></SingleRoleSelector>
                    <b>WL5</b>
                    <SingleRoleSelector role={wl5} setRole={setWL5} showHigher showManaged></SingleRoleSelector>
                    <b>WL6</b>
                    <SingleRoleSelector role={wl6} setRole={setWL6} showHigher showManaged></SingleRoleSelector>
                    <b>WL7</b>
                    <SingleRoleSelector role={wl7} setRole={setWL7} showHigher showManaged></SingleRoleSelector>
                    <b>WL8</b>
                    <SingleRoleSelector role={wl8} setRole={setWL8} showHigher showManaged></SingleRoleSelector>
                </div>
            </Panel>
            <Panel>
                <h1 className="text-xl">Region Roles</h1>
                <div className="grid sm:grid-cols-[repeat(2,max-content_1fr)] lg:grid-cols-[repeat(3,max-content_1fr)] items-center gap-4">
                    <b>NA</b>
                    <SingleRoleSelector role={regionNA} setRole={setRegionNA} showHigher showManaged></SingleRoleSelector>
                    <b>EU</b>
                    <SingleRoleSelector role={regionEU} setRole={setRegionEU} showHigher showManaged></SingleRoleSelector>
                    <b>AS</b>
                    <SingleRoleSelector role={regionAS} setRole={setRegionAS} showHigher showManaged></SingleRoleSelector>
                    <b>SAR</b>
                    <SingleRoleSelector role={regionSA} setRole={setRegionSA} showHigher showManaged></SingleRoleSelector>
                </div>
            </Panel>
            <Panel>
                <h1 className="text-xl">Helper Roles</h1>
                <div className="grid sm:grid-cols-[repeat(2,max-content_1fr)] lg:grid-cols-[repeat(3,max-content_1fr)] items-center gap-4">
                    <b>NA</b>
                    <SingleRoleSelector role={helperNA} setRole={setHelperNA} showHigher showManaged></SingleRoleSelector>
                    <b>EU</b>
                    <SingleRoleSelector role={helperEU} setRole={setHelperEU} showHigher showManaged></SingleRoleSelector>
                    <b>AS</b>
                    <SingleRoleSelector role={helperAS} setRole={setHelperAS} showHigher showManaged></SingleRoleSelector>
                    <b>SAR</b>
                    <SingleRoleSelector role={helperSA} setRole={setHelperSA} showHigher showManaged></SingleRoleSelector>
                </div>
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => {
                    setWL0(data.wl0);
                    setWL1(data.wl1);
                    setWL2(data.wl2);
                    setWL3(data.wl3);
                    setWL4(data.wl4);
                    setWL5(data.wl5);
                    setWL6(data.wl6);
                    setWL7(data.wl7);
                    setWL8(data.wl8);
                    setRegionNA(data.regionNA);
                    setRegionEU(data.regionEU);
                    setRegionAS(data.regionAS);
                    setRegionSA(data.regionSA);
                    setHelperNA(data.helperNA);
                    setHelperEU(data.helperEU);
                    setHelperAS(data.helperAS);
                    setHelperSA(data.helperSA);
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
