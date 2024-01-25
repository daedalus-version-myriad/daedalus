import Container from "@/components/Container";
import Icon from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function DocsIntroduction() {
    return (
        <div className="flex flex-col items-center gap-8 py-16">
            <div className="flex flex-col items-center gap-2 md:gap-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Daedalus Documentation</h1>
                <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">Introduction</h2>
            </div>
            <Container>
                <div className="flex flex-col gap-4">
                    <a href="/docs">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Icon icon="chevron-left"></Icon> Back
                        </Button>
                    </a>
                    <h1 className="text-2xl">Welcome!</h1>
                    <p>Welcome to the Daedalus documentation!</p>
                    <p>
                        The motivation behind this project was to provide a bot that is transparent about the permissions it wants and what it does, supports
                        modern Discord features so you can take advantage of all of the new Discord features with Daedalus by your side instead of fighting
                        against it, gives you the flexibility to set up your server how you would like, but is also straightforward enough to approach for a
                        beginner to use.
                    </p>
                    <Separator></Separator>
                    <h1 className="text-2xl">Guidance</h1>
                    <p>
                        Most commands are fairly intuitive. You can find a full list{" "}
                        <a href="/docs/modules-commands" className="link">
                            here
                        </a>{" "}
                        which has a list of all of the commands and full information on them.
                    </p>
                    <p>
                        Additionally, the module list provides you with a list of permissions the bot needs to work. If you are not comfortable giving the bot
                        all of the requested permissions, you can look through the modules you want to use to determine which permissions you can remove without
                        causing issues with functionality.
                    </p>
                    <p>
                        The{" "}
                        <a href="/docs/permissions" className="link">
                            permissions page
                        </a>{" "}
                        gives a list of requested permissions and why the bot wants them, so you can also check there to see if you can safely disable a
                        permission.
                    </p>
                    <Separator></Separator>
                    <h1 className="text-2xl">Tech Stack</h1>
                    <p>
                        The bot is written in the{" "}
                        <a href="https://bun.sh/" target="_blank" className="link">
                            Bun JavaScript Runtime
                        </a>{" "}
                        using{" "}
                        <a href="https://discord.js.org/" target="_blank" className="link">
                            discord.js
                        </a>
                        . This dashboard is made using with{" "}
                        <a href="https://nextjs.org/" target="_blank" className="link">
                            Next.JS
                        </a>{" "}
                        which is a{" "}
                        <a href="https://react.dev/" target="_blank" className="link">
                            React
                        </a>{" "}
                        framework,{" "}
                        <a href="https://tailwindcss.com/" target="_blank" className="link">
                            Tailwind CSS
                        </a>
                        , and{" "}
                        <a href="https://ui.shadcn.com/" target="_blank" className="link">
                            shadcn/ui
                        </a>
                        . The backend is written with{" "}
                        <a href="https://trpc.io/" target="_blank" className="link">
                            tRPC
                        </a>{" "}
                        and stores its data in a{" "}
                        <a href="https://www.mysql.com/" target="_blank" className="link">
                            MySQL
                        </a>{" "}
                        database hosted by{" "}
                        <a href="https://planetscale.com/" target="_blank" className="link">
                            Planetscale
                        </a>
                        , which is connected using the{" "}
                        <a href="https://orm.drizzle.team/" target="_blank" className="link">
                            Drizzle ORM
                        </a>
                        .
                    </p>
                </div>
            </Container>
        </div>
    );
}
