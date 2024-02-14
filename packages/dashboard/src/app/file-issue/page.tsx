import CenterPanel from "@/components/CenterPanel";
import { Separator } from "@/components/ui/separator";

export default function FileIssue() {
    return (
        <CenterPanel>
            <h1 className="text-xl">File Issue</h1>
            <Separator></Separator>
            <p>An error occurred fetching your file. Please contact support if this issue persists.</p>
        </CenterPanel>
    );
}
