"use client";

import EnableModule from "@/components/EnableModule";
import MessageEditor from "@/components/MessageEditor";
import Panel from "@/components/Panel";
import { SaveChangesBar } from "@/components/SaveChangesBar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DurationStyle, formatDuration, parseDuration } from "@daedalus/global-utils";
import { GuildAutokickSettings, MessageData } from "@daedalus/types";
import _ from "lodash";
import { useState } from "react";
import { FaPencil } from "react-icons/fa6";
import save from "./save";

export function Body({ data: initial, disabled }: { data: GuildAutokickSettings; disabled: boolean }) {
    const [data, setData] = useState<GuildAutokickSettings>(initial);
    const [minimumAge, setMinimumAge] = useState<number>(data.minimumAge);
    const [sendMessage, setSendMessage] = useState<boolean>(data.sendMessage);
    const [message, setMessage] = useState<MessageData>(data.message);

    const updated = { guild: data.guild, minimumAge, sendMessage, message, parsed: data.parsed };

    return (
        <>
            <EnableModule guild={data.guild} module="autokick" disabled={disabled}></EnableModule>
            <Panel>
                <h1 className="text-xl">Autokick</h1>
                <p>Autokick filters new members only; these restrictions will not be applied retroactively.</p>
                <div className="center-row gap-4">
                    <span>
                        <b>Minimum Account Age:</b> {minimumAge ? formatDuration(minimumAge, DurationStyle.Blank) : "0 seconds"}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => {
                            const input = prompt("Enter a new duration (e.g. 20h, 3 days 12 hours, forever).");
                            if (!input) return;

                            try {
                                const age = parseDuration(input, false);
                                setMinimumAge(age);
                            } catch (error) {
                                alert(error);
                            }
                        }}
                    >
                        <FaPencil></FaPencil>
                    </Button>
                </div>
                <div className="center-row gap-4">
                    <Switch checked={sendMessage} onCheckedChange={setSendMessage}></Switch>
                    <b>Send Message To User</b>
                </div>
                {sendMessage ? <MessageEditor data={message} setData={setMessage}></MessageEditor> : null}
            </Panel>
            <SaveChangesBar
                unsaved={!_.isEqual(updated, data)}
                reset={() => setMinimumAge(data.minimumAge)}
                save={async () => {
                    const error = await save(updated);
                    if (error) return alert(error);
                    setData(updated);
                }}
            ></SaveChangesBar>
        </>
    );
}
