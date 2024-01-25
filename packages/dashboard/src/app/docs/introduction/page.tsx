import Container from "@/components/Container";
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
                        <a href="/docs/modules-commands" className="border-b border-muted-foreground">
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
                        <a href="/docs/permissions" className="border-b border-muted-foreground">
                            permissions page
                        </a>{" "}
                        gives a list of requested permissions and why the bot wants them, so you can also check there to see if you can safely disable a
                        permission.
                    </p>
                </div>
            </Container>
        </div>
    );
}
