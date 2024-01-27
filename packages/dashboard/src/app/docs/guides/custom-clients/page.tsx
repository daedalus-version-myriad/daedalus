import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { FaChevronLeft } from "react-icons/fa6";

export default function DocsCustomClients() {
    return (
        <div className="center-col gap-8 py-16">
            <div className="center-col gap-2 md:gap-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Daedalus Documentation</h1>
                <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">Custom Clients</h2>
            </div>
            <Container className="center-col">
                <div className="flex flex-col gap-4">
                    <a href="/docs/guides">
                        <Button variant="outline" className="center-row gap-2">
                            <FaChevronLeft></FaChevronLeft> Back
                        </Button>
                    </a>
                    <h1 className="text-2xl">Custom Clients</h1>
                    <p>
                        Custom clients are a feature available with certain tiers of{" "}
                        <a href="/premium" target="_blank" className="link">
                            Daedalus Premium
                        </a>
                        . It allows you to set up a custom bot account and run Daedalus through it, giving you full control over the bot&apos;s appearance.
                    </p>
                    <p>Here is a list of what you need to keep in mind before using this feature:</p>
                    <ul className="list-disc ml-4 space-y-2">
                        <li>
                            Modmail behavior is improved when using custom clients. When the user DMs your bot, they will be asked for confirmation that they
                            want to message your server instead of receiving a server selection. This makes the process simpler and faster.
                        </li>
                        <li>
                            Reaction role prompts and ticket prompts must be set up again when switching clients, as the old prompt will not respond. You can do
                            this by just going into the module settings and clicking &quot;Save&quot;. The new client will post all of the prompts (if
                            possible). The old ones will also be deleted if possible, as the client does not check that it was the one who posted them.
                        </li>
                        <li>
                            You should kick any clients not in use as they pollute the command list. When you switch to a custom client, you should remove the
                            Daedalus bot account itself from your server.
                        </li>
                        <li>
                            You should not run any other bots in the same account as a Daedalus client. Daedalus periodically overwrites the command list which
                            will cause interference. Additionally, message components may cause problems as Discord bots cannot detect which process is supposed
                            to handle a given component. If you decide to operate a separate bot alongside Daedalus in the same client, you are responsible for
                            any issues that occur.
                        </li>
                    </ul>
                    <p>
                        Before using this feature, make sure you read the disclaimer in the info pop-up in the Premium settings page. This feature can only be
                        managed by the server owner.
                    </p>
                </div>
            </Container>
        </div>
    );
}
