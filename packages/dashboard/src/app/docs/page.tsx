import Container from "@/components/Container";
import { Button } from "@/components/ui/button";

export default function Docs() {
    return (
        <div className="center-col gap-8 py-16">
            <div className="center-col gap-2 md:gap-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Daedalus Documentation</h1>
                <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">Landing Page</h2>
            </div>
            <Container>
                <div className="center-col">
                    <div className="flex flex-col gap-4">
                        <a href="/docs/introduction">
                            <Button>Introduction</Button>
                        </a>
                        <p className="prose-lg">View basic details about Daedalus and learn how to use this documentation.</p>
                        <a href="/docs/permissions">
                            <Button>Permissions</Button>
                        </a>
                        <p className="prose-lg">
                            View information on permissions Daedalus requests and which ones can be disabled depending on the modules you use.
                        </p>
                        <a href="/docs/modules-commands">
                            <Button>Modules &amp; Commands</Button>
                        </a>
                        <p className="prose-lg">
                            View a list of modules and commands and information on the bot&apos;s modular design and general information.
                        </p>
                        <a href="/docs/guides">
                            <Button>Guides</Button>
                        </a>
                        <p className="prose-lg">View a list of miscellaneous guides on how to use certain Daedalus features.</p>
                    </div>
                </div>
            </Container>
        </div>
    );
}
