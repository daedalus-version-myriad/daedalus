"use client";

import Panel from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUserContext } from "@/context/user";
import { PremiumStripeSession } from "@daedalus/types";
import React, { useState } from "react";
import { deleteKey, provisionNewKey } from "./actions";

export function AccountPremiumBody({
    sessions,
    links,
    keys: initial,
    activations,
}: {
    sessions: PremiumStripeSession[];
    links: [string, string, string, string];
    keys: { key: string; disabled: boolean }[];
    activations: Record<string, string>;
}) {
    const [keys, setKeys] = useState(initial);
    const [annual, setAnnual] = useState(false);

    const user = useUserContext();
    if (!user) return <></>;

    const { admin } = user;

    let premiumKeyTotal = admin ? Infinity : 0;
    let customKeyTotal = admin ? Infinity : 0;

    if (!admin)
        for (const session of sessions)
            for (const sub of session.subscriptions)
                if (sub.type === "premium") premiumKeyTotal += sub.quantity;
                else customKeyTotal += sub.quantity;

    const premiumKeys = keys.filter(({ key }) => key.startsWith("pk_"));
    const customKeys = keys.filter(({ key }) => key.startsWith("ck_"));

    const premiumKeysRemaining = premiumKeyTotal - premiumKeys.length;
    const customKeysRemaining = customKeyTotal - customKeys.length;

    return (
        <>
            <p>
                Make sure you read the{" "}
                <a href="/premium/info" className="link">
                    Daedalus Premium Info Page
                </a>{" "}
                before purchasing a subscription!
            </p>
            <Panel>
                <h1 className="text-2xl">Your Premium Status</h1>
                <h2 className="text-xl">Edit Existing Subscriptions</h2>
                <div>
                    {sessions.map((session, i) => (
                        <Panel key={`${i}`}>
                            <h3 className="text-lg flex flex-col gap-2">
                                {session.subscriptions.map(({ created, product, quantity }, i) => (
                                    <span key={`${i}`}>
                                        {product} {quantity !== 1 ? <>(&times; {quantity})</> : null}{" "}
                                        <span className="text-muted-foreground">created {new Date(created * 1000).toLocaleString()}</span>
                                    </span>
                                ))}
                            </h3>
                            <div>
                                <a href={session.url}>
                                    <Button>Edit on Stripe</Button>
                                </a>
                            </div>
                        </Panel>
                    ))}
                </div>
                <h2 className="text-xl">Add New Subscriptions</h2>
                <Panel>
                    <h3 className="text-lg center-row gap-4">
                        Monthly
                        <Switch checked={annual} onCheckedChange={setAnnual}></Switch>
                        <span>
                            Annual <span className="text-muted-foreground">(save 16%!)</span>
                        </span>
                    </h3>
                    {annual ? (
                        <>
                            <a href={links[1]}>
                                <Button>Premium &mdash; $50/yr</Button>
                            </a>
                            <a href={links[3]}>
                                <Button>Custom Client &mdash; $40/yr</Button>
                            </a>
                        </>
                    ) : (
                        <>
                            <a href={links[0]}>
                                <Button>Premium &mdash; $5/mo</Button>
                            </a>
                            <a href={links[2]}>
                                <Button>Custom Client &mdash; $4/mo</Button>
                            </a>
                        </>
                    )}
                    <p>
                        <span className="text-muted-foreground">
                            Please contact support if you do not see your subscription show up here within a few minutes of purchase.
                        </span>
                    </p>
                </Panel>
            </Panel>
            <Panel>
                <h1 className="text-2xl">Premium Keys</h1>
                <p>
                    To use a key, go to the premium tab in your server&apos;s management page and paste it into the key input field. You can also give your key
                    to someone else to use in their server instead, but the key remains in your ownership and can be revoked at any time.
                </p>
                {(
                    [
                        [premiumKeysRemaining, "premium", "Premium", premiumKeys],
                        [customKeysRemaining, "custom", "Custom", customKeys],
                    ] as [number, "premium" | "custom", string, { key: string; disabled: boolean }[]][]
                ).map(([remaining, type, typename, list]) => (
                    <React.Fragment key={type}>
                        <div>
                            <Button
                                disabled={remaining <= 0}
                                onClick={async () => {
                                    const key = await provisionNewKey(type).catch(() => alert("An error occurred; please try again."));
                                    if (key) setKeys((keys) => [...keys, { key, disabled: false }]);
                                }}
                            >
                                <span>
                                    New {typename} Key {remaining > 0 ? <span>(&times; {remaining} remaining)</span> : ""}
                                </span>
                            </Button>
                        </div>
                        {remaining < 0 ? (
                            <p>
                                {-remaining} of your keys {remaining === -1 ? "is" : "are"} deactivated because you no longer have enough subscriptions for it.
                                Please purchase more subscriptions to re-enable them. You can also delete active keys and the oldest inactive key will be
                                reactivated.
                            </p>
                        ) : null}
                        <div className="flex flex-col gap-1">
                            {list.map(({ key }, i) => (
                                <div key={key} className="center-row gap-2">
                                    {/* We use this calculation instead of the disabled property to dynamically update the data without needing to re-fetch. */}
                                    <code>{i - list.length >= remaining ? <s>{key}</s> : <b>{key}</b>}</code>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            confirm(
                                                "Are you sure you want to delete this key? This cannot be undone, but you can provision a new key at any time.",
                                            ) &&
                                            deleteKey(key)
                                                .then(() => setKeys((keys) => keys.filter(({ key: k }) => k !== key)))
                                                .catch(() => alert("An error occurred; please try again."))
                                        }
                                    >
                                        delete
                                    </Button>
                                    {key in activations ? (
                                        <span className="whitespace-nowrap">
                                            in use by <code>{activations[key]}</code>
                                        </span>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </React.Fragment>
                ))}
            </Panel>
        </>
    );
}
