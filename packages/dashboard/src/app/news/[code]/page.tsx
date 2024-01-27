import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { trpc } from "@daedalus/api";
import { redirect } from "next/navigation";

export default async function NewsArticle({ params }: { params: { code: string } }) {
    const item = await trpc.newsGet.query(params.code);
    if (!item) redirect("/");

    return (
        <Container>
            <div className="my-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-4">{item.title}</h1>
                <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">{item.subtitle}</h2>
                <br />
                <div className="flex flex-col gap-4" dangerouslySetInnerHTML={{ __html: item.body }}></div>
                <br />
                <a href="/news">
                    <Button>Back</Button>
                </a>
            </div>
        </Container>
    );
}
