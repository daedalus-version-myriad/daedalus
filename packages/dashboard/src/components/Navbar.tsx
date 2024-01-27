"use client";

import { categories } from "@/app/manage/[id]/layout-body";
import { useUserContext } from "@/context/user";
import { INVITE_LINK } from "@/lib/data";
import { useTheme } from "next-themes";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React from "react";
import Icon from "./Icon";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "./ui/sheet";

export default function Navbar() {
    const { setTheme } = useTheme();
    const user = useUserContext();
    const pathname = usePathname();

    const links: [string, string, string, boolean?][] = [
        ["/docs", "book", "Docs"],
        [INVITE_LINK, "add", "Invite"],
        ["https://discord.gg/7TRKfSK7EU", "discord", "Support", true],
        ["/premium", "crown", "Premium"],
        ...(user?.admin ? [["/admin", "screwdriver-wrench", "Admin"] as [string, string, string]] : []),
    ];

    return (
        <>
            <nav className="fixed w-full center-row justify-between border-b border-border overflow-hidden bg-background/75 backdrop-blur-[2px]">
                <div className="center-row">
                    <a href="/" className="center-row gap-4 px-4 py-2 hover:bg-foreground/5">
                        <Image className="rounded" width={48} height={48} src="/favicon.ico" alt="Daedalus Icon"></Image>
                        <h1 className="text-2xl font-bold">Daedalus</h1>
                    </a>
                    {links.map(([href, icon, label, brand], index) => (
                        <React.Fragment key={`${index}`}>
                            <Separator className="hidden lg:block h-8" orientation="vertical"></Separator>
                            <a
                                href={href}
                                target={href.startsWith("/") ? "_self" : "_blank"}
                                className="hidden lg:flex center-row gap-4 px-4 py-5 hover:bg-foreground/5"
                            >
                                <Icon icon={icon} brand={brand}></Icon>
                                <span>{label}</span>
                            </a>
                        </React.Fragment>
                    ))}
                </div>
                <div className="center-row">
                    {user ? (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger className="center-row gap-4 px-4 py-3 hover:bg-foreground/5 outline-none">
                                    <Avatar>
                                        <AvatarImage src={user.image ?? ""} alt={`@${user.name}`}></AvatarImage>
                                        <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="hidden sm:block">Hello, {user.name}!</span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>
                                        <a href="/account">My Account</a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <a href={`/auth/logout?redirect=${encodeURIComponent(pathname)}`}>Sign Out</a>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <a href={`/auth/login?redirect=${encodeURIComponent(pathname)}`} className="px-4 py-5 hover:bg-foreground/5">
                            Log In
                        </a>
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
                            <div className="center-col">
                                {links.map(([href, icon, label, brand], index) => (
                                    <a
                                        key={`${index}`}
                                        href={href}
                                        target={href.startsWith("/") ? "_self" : "_blank"}
                                        className="center-row gap-4 px-4 py-2 w-full hover:bg-foreground/5"
                                    >
                                        <Icon icon={icon} brand={brand}></Icon>
                                        <span>{label}</span>
                                    </a>
                                ))}
                                {pathname.startsWith("/manage")
                                    ? ((id) => (
                                          <>
                                              <Separator className="my-4"></Separator>
                                              {categories.map(([suffix, icon, label, brand]) => (
                                                  <a
                                                      href={`/manage/${id}${suffix}`}
                                                      key={suffix}
                                                      className={`center-row gap-4 px-4 py-2 w-full hover:bg-foreground/5`}
                                                  >
                                                      <Icon icon={icon} brand={!!brand}></Icon> {label}
                                                  </a>
                                              ))}
                                          </>
                                      ))(pathname.substring(8).split("/")[0])
                                    : null}
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
