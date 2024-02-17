"use client";

import Container from "@/components/Container";
import Panel from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { FaChevronRight } from "react-icons/fa6";

export default function Premium() {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    return (
        <Container>
            <div className="center-col gap-4">
                <div className={`mt-8 ${isDesktop ? "center-row" : "center-col"} gap-4`}>
                    {isDesktop ? (
                        <Panel>
                            <h1 className="text-2xl">Free Plan</h1>
                            <h2 className="text-md text-muted-foreground">Free for everyone!</h2>
                            <ul className="list-disc pl-4">
                                <li>All core functionality modules</li>
                                <li>Modmail</li>
                                <li>Advanced customization</li>
                            </ul>
                            <div>
                                <Button variant="outline" disabled>
                                    This tier is the default!
                                </Button>
                            </div>
                        </Panel>
                    ) : null}
                    <Panel>
                        <h1 className="text-2xl">Premium</h1>
                        <h2 className="text-md text-muted-foreground">$5/mo &middot; $50/yr</h2>
                        <ul className="list-disc pl-4">
                            <li>Raised module limits</li>
                            <li>Full customization</li>
                            <li>Early access to new features</li>
                        </ul>
                        <a href="/account/premium">
                            <Button variant="outline">Subscribe Now!</Button>
                        </a>
                    </Panel>
                    <Panel>
                        <h1 className="text-2xl">Custom Client</h1>
                        <h2 className="text-md text-muted-foreground">$4/mo &middot; $40/yr</h2>
                        <ul className="list-disc pl-4">
                            <li>Custom instance</li>
                            <li>Custom username and bot profile</li>
                            <li>Improved modmail functionality</li>
                        </ul>
                        <a href="/account/premium">
                            <Button variant="outline">Subscribe Now!</Button>
                        </a>
                    </Panel>
                </div>
                <div className="center-row gap-2">
                    <a href="/premium/info" className="link">
                        Premium Info Page
                    </a>
                    &mdash;
                    <a href="/account/premium" className="link center-row">
                        View your subscription status <FaChevronRight size="0.8rem"></FaChevronRight>
                    </a>
                </div>
            </div>
        </Container>
    );
}
