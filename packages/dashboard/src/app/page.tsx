"use server";

import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@daedalus/api";
import { FaArrowRight } from "react-icons/fa6";
import TopButton from "./top-button";

export default async function Home() {
    const online = await trpc.checkStatus.query().catch(() => false);
    const { news } = await trpc.newsList.query().catch(() => ({ news: [] }));

    return (
        <div className="center-col gap-8">
            <div className="center-col gap-2 md:gap-4 py-16">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">Welcome to Daedalus</h1>
                <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">the future of server management</h2>
                <TopButton></TopButton>
            </div>
            <Container>
                <div className="center-col gap-8">
                    {online ? null : (
                        <>
                            <h1 className="text-4xl">Backend Error</h1>
                            <p className="prose-lg">
                                Something went wrong connecting to the Daedalus backend, so all features are likely currently broken. Please reload this page
                                and contact support if this issue persists.
                            </p>
                            <Separator></Separator>
                        </>
                    )}
                    <p className="prose-lg">
                        Daedalus offers a high-quality, highly-customizable, and modern out-of-the-box experience. Offer only the best for your server members
                        and server staff with advanced functionality, intuitive design, and features designed with convenience and accessibility in mind.
                    </p>
                    <p className="prose-lg">
                        See something you need but we don&apos;t have? We&apos;re constantly implementing new features and enhancing existing ones to
                        continuously build a better experience for you, so stop by our support server and let us know what you need!
                    </p>
                </div>
            </Container>
            <Container>
                <div className="flex flex-col gap-4">
                    <div>
                        <a href="/news" className="link inline-flex items-center gap-2">
                            Latest Updates <FaArrowRight></FaArrowRight>
                        </a>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-4">
                        {news.map((item) => (
                            <Card key={`${item.date}`}>
                                <CardHeader>
                                    <CardTitle>{item.title}</CardTitle>
                                    <CardDescription>{item.subtitle}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p>{item.summary}</p>
                                </CardContent>
                                <CardFooter>
                                    <a href={`/news/${item.code}`}>
                                        <Button>Read More</Button>
                                    </a>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </Container>
            <div className="mb-16"></div>
        </div>
    );
}
