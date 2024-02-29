import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { FaChevronRight } from "react-icons/fa6";

export default function PartnersBody({ tcnSize }: { tcnSize: number | null }) {
    return (
        <div className="center-col gap-8 py-16">
            <div className="center-col gap-2 md:gap-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Daedalus Partners</h1>
            </div>
            <Container>
                <div className="center-col">
                    <div className="flex flex-col gap-4">
                        <p className="prose-lg">
                            Interested in partnering with Daedalus for mutual benefits and perks like free access to certain premium features? Reach out to us
                            through our support server!
                        </p>
                        <Separator></Separator>
                        <h2 className="text-lg md:text-xl lg:text-2xl center-row gap-2">
                            <Image src="https://teyvatcollective.network/favicon.png" alt="TCN Icon" width={32} height={32}></Image>
                            <a href="/partners/tcn" className="link" target="_blank">
                                Teyvat Collective Network
                            </a>
                        </h2>
                        <p className="prose-lg">
                            <span className="text-muted-foreground">Partnered since Feb. 28th, 2024</span>
                        </p>
                        <p className="prose-lg">
                            The TCN is a network of {tcnSize ?? ""} high-quality Genshin Impact servers whose mission is to unite all mains servers across
                            Teyvat and provide support and promote collaboration between partners.
                        </p>
                        <p className="prose-lg">
                            Daedalus started out in the Genshin Impact subcommunity and owes large amounts of its present existence to the space that in no
                            small part has been supported by the TCN as well as direct word of mouth within the TCN and its affiliated servers.
                        </p>
                        <p className="prose-lg">
                            This partnership helps both parties grow and establishes a formal connection, bringing the community support and technical sides of
                            Discord server management together.
                        </p>
                        <p className="prose-lg">
                            Servers in the TCN gain access to the custom client feature, a feature that is particularly well-suited to Genshin Impact character
                            servers as servers can run Daedalus through a bot that takes on the appearance of their mascot character.
                        </p>
                        <div>
                            <a href="/partners/tcn">
                                <Button className="center-row gap-2">
                                    Learn More about the TCN <FaChevronRight></FaChevronRight>
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
