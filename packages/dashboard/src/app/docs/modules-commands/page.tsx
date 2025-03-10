import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { FaChevronLeft } from "react-icons/fa6";
import ModuleList from "./module-list";

export default function DocsModulesCommands() {
    return (
        <div className="center-col gap-8 py-16">
            <div className="center-col gap-2 md:gap-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Daedalus Documentation</h1>
                <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">Modules &amp; Commands</h2>
                <a href="/docs">
                    <Button variant="outline" className="center-row gap-2">
                        <FaChevronLeft></FaChevronLeft> Back
                    </Button>
                </a>
                <p>
                    Like many bots, Daedalus&apos; features are mostly divided into modules, with the exception of some things like logging. Each module
                    contains functionalities that are of a similar purpose or integrate with each other. For example, all manual moderation commands (ban, kick,
                    slowmode, purge) are grouped in the Moderation module.
                </p>
                <p>
                    Disabling a module disables all commands within it as well as most automatic or user-triggered features within it (for example, disabling
                    automod disables message scanning entirely).
                </p>
                <p>
                    You can disable the core module and settings commands if you want, though it will prevent you from modifying some settings that will still
                    be used by the bot (that is, disabling settings commands does not make the bot act as though those settings are not set).
                </p>
            </div>
            <Container className="flex flex-col gap-4">
                <h1 className="text-2xl">Module List</h1>
                <ModuleList></ModuleList>
            </Container>
        </div>
    );
}
