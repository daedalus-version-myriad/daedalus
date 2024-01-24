export default function Footer() {
    return (
        <div className="w-full h-16 px-4 flex items-center gap-1 border-t border-border">
            <span>
                &copy;{" "}
                <a href="https://github.com/hyper-neutrino" className="border-b border-muted-foreground">
                    hyper-neutrino
                </a>{" "}
                <span className="hidden md:inline-block">2024</span>
            </span>
            &mdash;
            <a href="/terms" className="border-b border-muted-foreground">
                Terms <span className="hidden md:inline-block">of Service</span>
            </a>
            &mdash;
            <a href="/privacy" className="border-b border-muted-foreground">
                Privacy <span className="hidden md:inline-block">Policy</span>
            </a>
        </div>
    );
}
