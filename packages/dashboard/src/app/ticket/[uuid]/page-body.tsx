"use client";

import Panel from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { trpc } from "@daedalus/api";
import { useState } from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

type Thread = Awaited<ReturnType<(typeof trpc)["getTicketThread"]["query"]>>;

const types: Record<string, string> = { open: "Opened by", message: "Message by", close: "Closed by" };

export function TicketLogviewer({ ticket, messages }: Thread) {
    return (
        <>
            {ticket.closed ? null : (
                <Panel>
                    <p>
                        <span className="text-muted-foreground">This ticket is currently open.</span>
                    </p>
                </Panel>
            )}
            {messages.map((message, index) => (
                <Message key={`${index}`} ticket={ticket} message={message}></Message>
            ))}
        </>
    );
}

function Message({ ticket, message }: { ticket: Thread["ticket"]; message: Thread["messages"][number] }) {
    const [index, setIndex] = useState<number>(-1);
    const items = [message.content, ...(message.edits as string[])];
    const content = items.at(index) ?? "";

    return (
        <Panel>
            <h4 className="text-lg">
                {message.type ? types[message.type] : "Unknown Message Type by"} {message.type === "open" ? ticket.username : message.username}{" "}
                <span className="text-muted-foreground">
                    ({message.type === "open" ? ticket.user : message.author}) &mdash; {new Date(message.time).toLocaleString()}{" "}
                    {message.deleted ? <>&mdash; deleted</> : null}
                </span>
            </h4>
            {message.type === "message" ? (
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
            ) : null}
        </Panel>
    );
}
