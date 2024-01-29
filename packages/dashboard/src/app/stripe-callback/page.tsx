import CenterPanel from "@/components/CenterPanel";
import { Separator } from "@/components/ui/separator";

export default function StripeCallback() {
    return (
        <CenterPanel>
            <h1 className="text-4xl font-semibold">Thank You!</h1>
            <Separator></Separator>
            <p>
                Thank you for subscribing and supporting Daedalus! To manage your premium servers, visit your{" "}
                <a href="/account/premium" className="link">
                    account settings
                </a>
                .
            </p>
        </CenterPanel>
    );
}
