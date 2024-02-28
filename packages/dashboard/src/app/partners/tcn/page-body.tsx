import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { FaChevronLeft, FaDiscord, FaEarthAmericas } from "react-icons/fa6";

export default function TCNBody({ guilds }: { guilds: { name: string; mascot: string; invite: string }[] }) {
    return (
        <div className="center-col gap-8 py-16">
            <div className="center-col gap-2 md:gap-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Daedalus Partners</h1>
                <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">Teyvat Collective Network</h2>
                <div className="center-row gap-4 flex-wrap">
                    <a href="/partners">
                        <Button className="center-row gap-2">
                            <FaChevronLeft></FaChevronLeft> Back to Partners
                        </Button>
                    </a>
                    <a href="https://teyvatcollective.network" target="_blank">
                        <Button className="center-row gap-2">
                            <FaEarthAmericas></FaEarthAmericas> TCN Website
                        </Button>
                    </a>
                    <a href="https://teyvatcollective.network/discord" target="_blank">
                        <Button className="center-row gap-2">
                            <FaDiscord></FaDiscord> TCN Public Discord
                        </Button>
                    </a>
                </div>
            </div>
            <Container className="center-col gap-4">
                <div className="flex flex-col gap-4">
                    <p className="prose-lg">
                        The Teyvat Collective Network (TCN) is a collaborative of Genshin Impact &quot;mains-style&quot; servers dedicated to improving the
                        Genshin Impact Discord subcommunity through providing resources, promoting collaboration and positive relationships, and uniting
                        communities.
                    </p>
                    <p className="prose-lg">
                        The TCN is a high-quality but low-control network that has a selective induction process but does not require any more of its servers
                        than to help promote the network and its partners and maintain a safe and healthy environment.
                    </p>
                    <p className="prose-lg">
                        If you run a Genshin Impact character mains-style server and are interested in joining the TCN for access to collaboration
                        opportunities, connections with other server owners/admins, and more, check out their website for more information.
                    </p>
                    <p className="prose-lg">
                        The TCN also has its own partners that are not directly affiliated with Daedalus. This partnership was established by a majority vote
                        from all TCN servers but not its external partners.
                    </p>
                </div>
                <Separator></Separator>
                {guilds.length === 0 ? (
                    <p>The list of the TCN&apos;s constituent servers could not be fetched at this time.</p>
                ) : (
                    <>
                        <p>The TCN consists of {guilds.length} servers, listed below in alphabetical order.</p>
                        <div className="w-full grid grid-cols-[repeat(auto-fit,minmax(min(max(320px,30%),100%),1fr))] gap-4">
                            {guilds
                                .sort((x, y) => x.name.toLowerCase().localeCompare(y.name.toLowerCase()))
                                .map(({ name, mascot, invite }) => (
                                    <a key={invite} href={`https://discord.gg/${invite}`} target="_blank">
                                        <div
                                            className={`p-4 grid grid-cols-[max-content_1fr] items-center gap-x-4 h-24 border border-2 rounded bg-secondary dark:bg-secondary/60`}
                                        >
                                            <div className="row-span-2">
                                                <Image
                                                    src={`https://teyvatcollective.network/files/${mascot}.png`}
                                                    alt={`${name} Icon`}
                                                    width={64}
                                                    height={64}
                                                    className="rounded-xl"
                                                ></Image>
                                            </div>
                                            <b className="max-h-16 text-lg truncate">{name}</b>
                                            <span className="truncate">https://discord.gg/{invite}</span>
                                        </div>
                                    </a>
                                ))}
                        </div>
                    </>
                )}
            </Container>
        </div>
    );
}
