"use server";

import Container from "@/components/Container";
import Icon from "@/components/Icon";
import LoginButton from "@/components/LoginButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import getUser from "@/lib/get-user";
import { trpc } from "@daedalus/api";

export default async function Home() {
    const user = await getUser();
    const { news } = await trpc.newsList.query();

    return (
        <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2 md:gap-4 py-16">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">Welcome to Daedalus</h1>
                <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">the future of server management</h2>
                {user ? (
                    <a href="/manage">
                        <Button>
                            <span className="flex items-center gap-2 text-sm md:text-md lg:text-lg">
                                <Icon icon="gear"></Icon> Manage Servers
                            </span>
                        </Button>
                    </a>
                ) : (
                    <LoginButton>
                        <span className="flex items-center gap-2 text-sm md:text-md lg:text-lg">
                            <Icon icon="discord" brand></Icon> Log In
                        </span>
                    </LoginButton>
                )}
            </div>
            <Container>
                <div className="flex flex-col items-center gap-8">
                    <p className="text-lg">
                        Daedalus offers a high-quality, highly-customizable, and modern out-of-the-box experience. Offer only the best for your server members
                        and server staff with advanced functionality, intuitive design, and features designed with convenience and accessibility in mind.
                    </p>
                    <p className="text-lg">
                        See something you need but we don't have? We're constantly implementing new features and enhancing existing ones to continuously build a
                        better experience for you, so stop by our support server and let us know what you need!
                    </p>
                </div>
            </Container>
            <Container>
                <div className="flex flex-col gap-4">
                    <div>
                        <a href="/news" className="border-b border-muted-foreground">
                            Latest Updates <Icon icon="arrow-right"></Icon>
                        </a>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-4">
                        {news.map((item) => (
                            <Card key={item.date}>
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
