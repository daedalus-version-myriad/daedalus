"use server";

import Container from "@/components/Container";
import PageSelector from "@/components/PageSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@daedalus/api";

export default async function AdminNews({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
    const page = +(searchParams?.page ?? 1);
    const { news, pages } = await trpc.newsList.query({ page });

    return (
        <Container>
            <div className="mt-8 flex flex-col items-center gap-4">
                <div className="w-full grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-4">
                    {news.map((item) => (
                        <Card key={`${item.date}`}>
                            <CardHeader>
                                <CardTitle>{item.title}</CardTitle>
                                <CardDescription>{item.subtitle}</CardDescription>
                            </CardHeader>
                            <CardContent>{item.summary}</CardContent>
                            <CardFooter>
                                <a href={`/news/${item.code}`}>
                                    <Button>Read More</Button>
                                </a>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                <PageSelector page={page} pages={pages}></PageSelector>
            </div>
        </Container>
    );
}
