"use client";

import { secrets } from "@daedalus/config";
import { DefaultSession } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import Icon from "./Icon";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "./ui/sheet";

const links: [string, string, string, boolean?][] = [
    ["/docs", "book", "Docs"],
    [
        `https://discord.com/api/oauth2/authorize?client_id=${secrets.DISCORD.CLIENT.ID}&permissions=1428010036470&scope=applications.commands+bot`,
        "add",
        "Invite",
    ],
    ["https://discord.gg/7TRKfSK7EU", "discord", "Support", true],
    ["/premium", "crown", "Premium"],
];

export default function Navbar({ user }: { user: DefaultSession["user"] }) {
    const { setTheme } = useTheme();

    return (
        <>
            <nav className="fixed w-full flex items-center justify-between border-b border-border overflow-hidden bg-background/75 backdrop-blur-[2px]">
                <div className="flex items-center">
                    <Link href="/" className="flex items-center gap-4 px-4 py-2 hover:bg-foreground/5">
                        <Image className="rounded" width={48} height={48} src="/favicon.ico" alt="Daedalus Icon"></Image>
                        <h1 className="text-2xl font-bold">Daedalus</h1>
                    </Link>
                    {links.map(([href, icon, label, brand], index) => (
                        <React.Fragment key={`${index}`}>
                            <Separator className="hidden lg:block h-8" orientation="vertical"></Separator>
                            <Link
                                href={href}
                                target={href.startsWith("/") ? "_self" : "_blank"}
                                className="hidden lg:flex items-center gap-4 px-4 py-5 hover:bg-foreground/5"
                            >
                                <Icon icon={icon} brand={brand}></Icon>
                                <span>{label}</span>
                            </Link>
                        </React.Fragment>
                    ))}
                </div>
                <div className="flex items-center">
                    {user ? (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-4 px-4 py-3 hover:bg-foreground/5 outline-none">
                                    <Avatar>
                                        <AvatarImage src={user.image ?? ""} alt={`@${user.name}`}></AvatarImage>
                                        <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="hidden sm:block">Hello, {user.name}!</span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>
                                        <Link href="/account">My Account</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <button onClick={() => signOut()}>Sign Out</button>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <button className="px-4 py-5 hover:bg-foreground/5" onClick={() => signIn("discord")}>
                            Log In
                        </button>
                    )}
                    <button className="hidden dark:block w-16 py-5 hover:bg-foreground/5" onClick={() => setTheme("light")}>
                        <Icon icon="sun"></Icon>
                    </button>
                    <button className="block dark:hidden w-16 py-5 hover:bg-foreground/5" onClick={() => setTheme("dark")}>
                        <Icon icon="moon"></Icon>
                    </button>
                    <Sheet>
                        <SheetTrigger className="lg:hidden w-16 py-5 hover:bg-foreground/5">
                            <Icon icon="bars"></Icon>
                        </SheetTrigger>
                        <SheetContent>
                            <div className="flex flex-col items-center">
                                {links.map(([href, icon, label, brand], index) => (
                                    <Link
                                        key={`${index}`}
                                        href={href}
                                        target={href.startsWith("/") ? "_self" : "_blank"}
                                        className="flex items-center gap-4 px-4 py-2 w-full hover:bg-foreground/5"
                                    >
                                        <Icon icon={icon} brand={brand}></Icon>
                                        <span>{label}</span>
                                    </Link>
                                ))}
                            </div>
                        </SheetContent>
                        <SheetClose className="outline-none"></SheetClose>
                    </Sheet>
                </div>
            </nav>
            <div className="pt-16"></div>
        </>
    );
}
