import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { FaChevronLeft } from "react-icons/fa6";

export default function Docs() {
    return (
        <div className="center-col gap-8 py-16">
            <div className="center-col gap-2 md:gap-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Daedalus Documentation</h1>
                <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">Guides</h2>
            </div>
            <Container className="center-col">
                <div className="flex flex-col gap-4">
                    <a href="/docs">
                        <Button variant="outline" className="center-row gap-2">
                            <FaChevronLeft></FaChevronLeft> Back
                        </Button>
                    </a>
                    <a href="/docs/guides/custom-messages">
                        <Button>Custom Messages</Button>
                    </a>
                    <p>Learn how to write fully custom messages with Daedalus to give your members an immersive environment.</p>
                    <a href="/docs/guides/custom-clients">
                        <Button>Custom Clients</Button>
                    </a>
                    <p>
                        Learn how to set up and operate custom clients using Daedalus Ultimate Premium, as long as the caveats of the feature and some necessary
                        adjustments.
                    </p>
                </div>
            </Container>
        </div>
    );
}
