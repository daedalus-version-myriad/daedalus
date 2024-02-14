"use server";

import CenterPanel from "@/components/CenterPanel";
import Container from "@/components/Container";
import { Separator } from "@/components/ui/separator";
import { getId } from "@/lib/get-user";
import { trpc } from "@daedalus/api";
import { TicketLogviewer } from "./page-body";

export default async function TicketLogs({ params: { uuid } }: { params: { uuid: string } }) {
    try {
        const { ticket, messages } = await trpc.getTicketThread.query({ id: await getId(), uuid });

        return (
            <div className="center-col gap-8 py-16">
                <div className="center-col gap-2 md:gap-4">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Daedalus Logviewer</h1>
                    <h2 className="text-sm sm:text-md md:text-lg lg:text-xl text-muted-foreground">
                        Ticket with {ticket.username} (<code>{ticket.user}</code>)
                    </h2>
                </div>
                <Container>
                    <TicketLogviewer ticket={ticket} messages={messages}></TicketLogviewer>
                </Container>
            </div>
        );
    } catch (error) {
        return (
            <CenterPanel>
                <h1 className="text-xl">Modmail Thread Not Found</h1>
                <Separator></Separator>
                <p>Error: {`${(error as any).message ?? "An unknown error has occurred."}`}</p>
            </CenterPanel>
        );
    }
}
