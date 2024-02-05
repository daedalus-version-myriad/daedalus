import Container from "@/components/Container";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FaCheck, FaXmark } from "react-icons/fa6";

export default function PremiumInfo() {
    return (
        <Container>
            <div className="mt-8 flex flex-col gap-4">
                <h1 className="text-2xl">How Premium Works</h1>
                <p>
                    Premium subscriptions are purchased through{" "}
                    <a href="https://stripe.com" className="link">
                        Stripe
                    </a>
                    . Billing and payment information is not sent through Daedalus and all of your purchases are done through Stripe&apos;s website.
                </p>
                <p>
                    When you purchase a premium subscription, you will have the option to choose monthly or annual. Once you pay, it should appear in your
                    account settings. Premium will not be immediately granted to a server; instead, you will find premium keys at the bottom of your account
                    premium settings.
                </p>
                <p>
                    To activate premium, go to server settings and redeem the key in the <b>Premium</b> section. If you get a premium key from a support agent
                    or other promotion, you can activate it here as well.
                </p>
                <p>
                    When a premium subscription ends, your premium key will stop working. If you purchase another subscription, your key will resume, but it is
                    recommended to delete them if you don&apos;s plan to re-enable it soon.
                </p>
                <h1 className="text-2xl">Premium Specifics</h1>
                <Table>
                    <TableCaption>All available premium benefits</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead></TableHead>
                            <TableHead>Free</TableHead>
                            <TableHead>Premium</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <b>Custom XP Card Backgrounds</b>
                            </TableCell>
                            <TableCell>
                                <FaXmark></FaXmark>
                            </TableCell>
                            <TableCell>
                                <FaCheck></FaCheck>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <b>Multi-Target Modmail</b>
                            </TableCell>
                            <TableCell>
                                <FaXmark></FaXmark>
                            </TableCell>
                            <TableCell>
                                <FaCheck></FaCheck>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <b>Multi-Target Tickets</b>
                            </TableCell>
                            <TableCell>
                                <FaXmark></FaXmark>
                            </TableCell>
                            <TableCell>
                                <FaCheck></FaCheck>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <b>Customize Ticket On-Open Message</b>
                            </TableCell>
                            <TableCell>
                                <FaXmark></FaXmark>
                            </TableCell>
                            <TableCell>
                                <FaCheck></FaCheck>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </Container>
    );
}
