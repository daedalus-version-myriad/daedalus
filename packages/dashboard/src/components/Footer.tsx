import Link from "next/link";

export default function Footer() {
    return (
        <div className="w-full h-16 px-4 flex items-center gap-1 border-t border-border">
            <span>
                &copy;{" "}
                <Link href="https://github.com/hyper-neutrino" className="border-b border-muted-foreground">
                    hyper-neutrino
                </Link>{" "}
                <span className="hidden md:inline-block">2024</span>
            </span>
            &mdash;
            <Link href="/terms" className="border-b border-muted-foreground">
                Terms <span className="hidden md:inline-block">of Service</span>
            </Link>
            &mdash;
            <Link href="/privacy" className="border-b border-muted-foreground">
                Privacy <span className="hidden md:inline-block">Policy</span>
            </Link>
        </div>
    );
}
