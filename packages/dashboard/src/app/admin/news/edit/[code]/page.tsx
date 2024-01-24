"use server";

import Container from "@/components/Container";
import { Card } from "@/components/ui/card";
import NewsForm from "@/forms/admin-news";
import { trpc } from "@daedalus/api";
import { redirect } from "next/navigation";
import { handle } from "./handle";

export default async function AdminNewsEdit({ params }: { params: { code: string } }) {
    const item = await trpc.newsGet.query(params.code);
    if (!item) return void redirect("/admin/news");

    return (
        <Container>
            <div className="my-8">
                <Card className="p-4">
                    <NewsForm handler={handle} buttonText="Edit" {...item} readonlyCode></NewsForm>
                </Card>
            </div>
        </Container>
    );
}
