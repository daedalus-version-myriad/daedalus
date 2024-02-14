"use client";

import Panel from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@daedalus/api";
import { useState } from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

type Thread = Awaited<ReturnType<(typeof trpc)["getModmailThread"]["query"]>>;

const types: Record<string, string> = { open: "Opened by", incoming: "Incoming from", outgoing: "Outgoing to", close: "Closed by", internal: "Internal by" };

export function ModmailLogviewer({ thread, messages }: Thread) {
    const [showInternal, setShowInternal] = useState<boolean>(false);
    const [onlyRecent, setOnlyRecent] = useState<boolean>(true);

    const recentCutoff = messages.findLastIndex(({ type }) => type === "open");

    return (
        <>
            <Panel>
                {thread.closed ? null : (
                    <p>
                        <span className="text-muted-foreground">This thread is currently open.</span>
                    </p>
                )}
                <div className="center-row gap-4">
                    <Switch checked={showInternal} onCheckedChange={setShowInternal}></Switch>
                    Show internal messages
                </div>
                <div className="center-row gap-4">
                    <Switch checked={onlyRecent} onCheckedChange={setOnlyRecent}></Switch>
                    Only show messages from the last time this thread was open
                </div>
            </Panel>
            {messages.map((message, index) => (
                <div key={`${index}`} className={(onlyRecent && index < recentCutoff) || (!showInternal && message.type === "internal") ? "hidden" : ""}>
                    <Message thread={thread} message={message}></Message>
                </div>
            ))}
        </>
    );
}

function Message({ thread, message }: { thread: Thread["thread"]; message: Thread["messages"][number] }) {
    const [index, setIndex] = useState<number>(-1);
    const items = [message.content, ...(message.edits as string[])];
    const content = items.at(index) ?? "";

    return (
        <Panel className={message.type === "internal" ? "opacity-80" : ""}>
            <h4 className="text-lg">
                {message.type ? types[message.type] : "Unknown Message Type by"} {message.username}{" "}
                <span className="text-muted-foreground">
                    ({message.type === "incoming" ? thread.user : message.author}) &mdash; {new Date(message.time).toLocaleString()}{" "}
                    {message.deleted ? <>&mdash; deleted</> : null}
                </span>
            </h4>
            {message.type === "incoming" || message.type === "outgoing" || message.type === "internal" ? (
                <>
                    {content
                        .split(/\n+/)
                        .map((x) => x.trim())
                        .map((x, i) => (x ? <p key={`${i}`}>{x}</p> : null))}
                    {content ? null : <b className="text-muted-foreground">(no content)</b>}
                    {items.length > 1 ? (
                        <div className="center-row gap-4">
                            This message has been edited.
                            <Button variant="outline" onClick={() => setIndex((index) => index - 1)} disabled={-index >= items.length}>
                                <FaAngleLeft></FaAngleLeft>
                            </Button>
                            <Button variant="outline" onClick={() => setIndex((index) => index + 1)} disabled={index >= -1}>
                                <FaAngleRight></FaAngleRight>
                            </Button>
                        </div>
                    ) : null}
                    {(message.attachments as any[]).length > 0 ? (
                        <ul className="list-disc pl-4">
                            {(message.attachments as { name: string; url: string }[]).map(({ name, url }, i) => (
                                <li key={`${i}`}>
                                    <a href={url} className="link" target="_blank">
                                        {name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </>
            ) : message.type === "close" ? (
                <>
                    <p>
                        <b className="text-muted-foreground">(the recipient was {message.sent ? "" : "not"} notified)</b>
                    </p>
                </>
            ) : null}
        </Panel>
    );
}
