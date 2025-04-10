import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { UserWrapper } from "@/context/user";
import getUser from "@/lib/get-user";
import type { Metadata, Viewport } from "next";
import { Exo_2 } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "../components/ThemeProvider";
import "./globals.css";

const exo2 = Exo_2({ subsets: ["latin"] });

const description =
    "Daedalus is a highly customizable and powerful modular discord bot supporting a variety of core tools, as well as many extra features to help you improve your server's environment. Daedalus has a focus on transparency and giving you full control over how the bot operates in your server.";

export const metadata: Metadata = {
    metadataBase: new URL("https://daedalusbot.xyz"),
    title: "Daedalus Dashboard",
    description,
    keywords: ["daedalus", "discord", "bot"],
    openGraph: {
        type: "website",
        title: "Daedalus Dashboard",
        description,
        url: "https://daedalusbot.xyz",
        images: { url: "https://daedalusbot.xyz/favicon.ico" },
    },
    twitter: { card: "summary" },
};

export const viewport: Viewport = {
    colorScheme: "dark",
    themeColor: "#009688",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const user = await getUser();

    return (
        <html lang="en">
            <Script src="https://kit.fontawesome.com/a7d0a79103.js"></Script>
            <body className={exo2.className}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <UserWrapper user={user}>
                        <div className="min-h-[100vh] flex flex-col">
                            <Navbar></Navbar>
                            <div className="grow flex flex-col">{children}</div>
                            <Footer></Footer>
                        </div>
                    </UserWrapper>
                </ThemeProvider>
            </body>
        </html>
    );
}
