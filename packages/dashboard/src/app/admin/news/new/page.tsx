"use client";

import Container from "@/components/Container";
import { Card } from "@/components/ui/card";
import NewsForm from "@/forms/admin-news";
import { handle } from "./handle";

export default function AdminNewsNew() {
    return (
        <Container>
            <div className="my-8">
                <Card className="p-4">
                    <NewsForm handler={handle} buttonText="Post"></NewsForm>
                </Card>
            </div>
        </Container>
    );
}
