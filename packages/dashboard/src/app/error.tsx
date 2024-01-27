"use client";

import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import Error from "next/error";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
    useEffect(() => console.error(error), [error]);

    return (
        <Container>
            <div className="mt-8 flex flex-col gap-4">
                <h1 className="text-2xl">An error occurred!</h1>
                <div className="center-row gap-2">
                    <a href="/">
                        <Button>Return to Home</Button>
                    </a>
                    <Button onClick={reset}>Try Again</Button>
                </div>
            </div>
        </Container>
    );
}
