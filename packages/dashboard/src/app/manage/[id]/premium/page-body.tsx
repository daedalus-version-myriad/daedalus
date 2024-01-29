"use client";

import Panel from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GuildPremiumSettings } from "@daedalus/types";
import { useState } from "react";
import { FaInfo, FaXmark } from "react-icons/fa6";
import { bindKey, bindToken, reloadData, unbindKey } from "./actions";

export function Body({ data: initial }: { data: GuildPremiumSettings }) {
    const [data, setData] = useState(initial);
    const [key, setKey] = useState<string>("");
    const [infoOpen, setInfoOpen] = useState(false);
    const [customInfoOpen, setCustomInfoOpen] = useState(false);
    const [token, setToken] = useState("");

    return (
        <>
            <Panel>
                <h1 className="text-xl">Premium Status</h1>
                <p>
                    {data.hasPremium
                        ? data.hasCustom
                            ? "This server has Daedalus Premium and can use a custom client."
                            : "This server has Daedalus Premium."
                        : data.hasCustom
                          ? "This server can use a custom client."
                          : "This server has no paid features."}
                </p>
            </Panel>
            <Panel>
                <h1 className="text-xl center-row gap-4">
                    Premium Keys
                    <Button variant="outline" onClick={() => setInfoOpen(!infoOpen)}>
                        <FaInfo></FaInfo>
                    </Button>
                </h1>
                {infoOpen ? (
                    <>
                        <p>You can add multiple premium keys here as a back-up and to prevent premium from expiring when someone&apos;s subscription ends.</p>
                        <p>However, note that these do not stack, and having two keys active here will not give you any additional benefits.</p>
                        <p>
                            You also cannot use a premium key to obtain a custom client, just to avoid complicating the premium system. You can change your
                            subscription in your{" "}
                            <a href="/account/premium" className="link" target="_blank">
                                account page
                            </a>{" "}
                            and Stripe will automatically adjust pricing and give you credit on any existing payments, so you will not be charged extra.
                        </p>
                    </>
                ) : null}
                <div className="flex flex-col gap-1">
                    {data.keys.map(({ key, disabled }) => (
                        <div key={key} className="center-row gap-2">
                            <code>{disabled ? <s>{key}</s> : <b>{key}</b>}</code>
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    if (!confirm("Unbind this key? The key will become available. You can re-add the key afterwards.")) return;
                                    const error = await unbindKey(data.guild, key);
                                    if (error) return alert(error);
                                    setData(await reloadData(data.guild));
                                }}
                            >
                                Unbind Key
                            </Button>
                        </div>
                    ))}
                </div>
                <div className="center-row gap-4">
                    <div>
                        <Input value={key} onChange={(e) => setKey(e.currentTarget.value)} placeholder="Insert Key Here"></Input>
                    </div>
                    <Button
                        variant="outline"
                        onClick={async () => {
                            const error = await bindKey(data.guild, key.trim());
                            if (error) return alert(error);
                            setData(await reloadData(data.guild));
                            setKey("");
                        }}
                        disabled={key.trim().length === 0}
                    >
                        Add Key
                    </Button>
                    <a href="/account/premium" className="link" target="_blank">
                        View your premium keys
                    </a>
                </div>
            </Panel>
            <Panel>
                <h1 className="text-xl center-row gap-4">
                    Custom Client
                    <Button variant="outline" onClick={() => setCustomInfoOpen(!customInfoOpen)}>
                        <FaInfo></FaInfo>
                    </Button>
                </h1>
                {data.hasCustom ? (
                    <>
                        <p>
                            This guild is currently operated by <b>{data.tag}</b>.
                        </p>
                        {customInfoOpen ? (
                            <>
                                <p>
                                    Daedalus&apos; custom client feature allows you to run Daedalus on your own bot, letting you customize the username, avatar,
                                    bio, and status.
                                </p>
                                <p>
                                    <span className="text-[#009688]">
                                        You may need to make some changes. Please refer to the{" "}
                                        <a href="/docs/guides/custom-clients" className="link" target="_blank">
                                            <span className="text-[#009688]">custom clients guide</span>
                                        </a>{" "}
                                        for reference.
                                    </span>
                                </p>
                                <p>
                                    To set this up, first visit the{" "}
                                    <a href="https://discord.com/developers/applications" className="link" target="_blank">
                                        Developer Portal
                                    </a>
                                    . Don&apos;t worry, you won&apos;t be writing any code. You&apos;ll need to create a new application using the button in the
                                    top-right corner. Once you have a new application, you can set its name, avatar, and bio. In the application page, go to the
                                    &quot;Bot&quot; tab in the left sidebar.
                                </p>
                                <p>
                                    Now, you&apos;ll need to create a bot account for this application. Once you have your bot, scroll down and enable the
                                    &quot;Server Members Intent&quot; and &quot;Message Content Intent&quot; options.
                                </p>
                                <p>
                                    To add your bot, copy-paste the following URL and replace <code>APP_ID</code> with your application ID (you can find this in
                                    the General tab or just copy-paste the ID out of the URL):
                                </p>
                                <p className="overflow-x-scroll">
                                    <code>
                                        https://discord.com/api/oauth2/authorize?client_id=APP_ID&permissions=1428010036470&scope=applications.commands+bot
                                    </code>
                                </p>
                                <p>
                                    Finally, go back to the bot settings, click &quot;Reset Token&quot;, and then copy-paste the token into the input field. For
                                    security reasons, we never show you your token here after you submit it.{" "}
                                    <b>
                                        <u>Make sure you keep this token secret.</u>
                                    </b>{" "}
                                    Anyone who has your token gains full control of your bot.
                                </p>
                                <p>
                                    <span className="text-xs">
                                        Disclaimer: NSFW client profiles and misuse of custom clients in any way including impersonation, scamming, violations
                                        of terms of service, etc. may result in custom client privilieges being temporarily or permanently revoked or your
                                        server being temporarily or permanently banned from use of Daedalus altogether. There is no strict policy for this as
                                        generally it should be obvious what is allowed or not, but we will reach out to you first if we believe your use
                                        constitutes abuse before applying any sanctions.
                                    </span>
                                </p>
                            </>
                        ) : null}
                        <div className="center-row gap-4">
                            <div>
                                <Input type="password" placeholder="Bot Token" value={token} onChange={(e) => setToken(e.currentTarget.value)}></Input>
                            </div>
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    const error = await bindToken(data.guild, token.trim());
                                    if (error) return alert(error);
                                    setData(await reloadData(data.guild));
                                    setToken("");
                                }}
                                disabled={token.trim().length === 0}
                            >
                                Set Token
                            </Button>
                            <Button
                                variant="outline"
                                className="center-row gap-2 text-[#ff0000] dark:text-[#aa0000]"
                                onClick={async () => {
                                    if (!confirm("Are you sure you want to reset back to the main Daedalus client?")) return;
                                    const error = await bindToken(data.guild, null);
                                    if (error) return alert(error);
                                    setData(await reloadData(data.guild));
                                }}
                            >
                                <FaXmark></FaXmark> Reset Client
                            </Button>
                        </div>
                    </>
                ) : (
                    <p>Connect a custom client key to gain access to this feature!</p>
                )}
            </Panel>
            <Panel>
                <pre>{JSON.stringify(data, undefined, 4)}</pre>
            </Panel>
        </>
    );
}
