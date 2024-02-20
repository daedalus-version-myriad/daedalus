"use client";

import Container from "@/components/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { INVITE_LINK } from "@/lib/data";
import { PartialGuild } from "@/lib/types";
import { fuzzy } from "@daedalus/global-utils";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaArrowsRotate } from "react-icons/fa6";
import { fetchGuilds } from "./fetch";

export default function ManageHomePage() {
    const [data, setData] = useState<{ updated: number; servers: PartialGuild[] } | null>(null);
    const [query, setQuery] = useState("");

    async function load() {
        setData(null);
        const data = { updated: Date.now(), servers: await fetchGuilds() };
        setData(data);
        localStorage.setItem("server-list", JSON.stringify(data));
    }

    useEffect(() => {
        const cache = localStorage.getItem("server-list");
        let hasData = false;

        if (cache)
            try {
                setData(JSON.parse(cache));
                hasData = true;
            } catch {}

        if (!hasData) load();
    }, []);

    return (
        <div className="center-col gap-16 my-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Manage Your Servers</h1>
            <Container>
                <div className="center-col gap-4">
                    <Input placeholder="Filter Servers" onChange={({ currentTarget: { value } }) => setQuery(value)}></Input>
                    <Button onClick={load} className="center-row gap-2" disabled={!data}>
                        <FaArrowsRotate></FaArrowsRotate> Reload Servers
                    </Button>
                    <div className="w-full grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
                        {data
                            ? data.servers.map((guild) => (
                                  <a
                                      key={guild.id}
                                      href={guild.hasBot ? `/manage/${guild.id}` : `${INVITE_LINK}&guild_id=${guild.id}`}
                                      className={fuzzy(guild.name, query) ? "" : "hidden"}
                                  >
                                      <div
                                          className={`p-4 grid grid-cols-[max-content_1fr] items-center gap-x-4 gap-y-2 h-24 border border-2 rounded ${guild.hasBot ? "bg-secondary dark:bg-secondary/60" : "text-muted-foreground"}`}
                                      >
                                          <div className="row-span-2">
                                              {guild.icon ? (
                                                  <Image
                                                      src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                                      alt="Icon"
                                                      width={64}
                                                      height={64}
                                                      className="rounded-full"
                                                  ></Image>
                                              ) : (
                                                  <span className="h-16 w-16 grid items-center justify-center bg-foreground/10 rounded-full">
                                                      {guild.name
                                                          .split(/\W+/)
                                                          .map((x) => x[0])
                                                          .join("")}
                                                  </span>
                                              )}
                                          </div>
                                          <b className="max-h-16 text-lg truncate">{guild.name}</b>
                                          <div className="center-row gap-2">
                                              {guild.owner ? (
                                                  <Badge variant="secondary">owner</Badge>
                                              ) : BigInt(guild.permissions) & 8n ? (
                                                  <Badge variant="secondary">admin</Badge>
                                              ) : BigInt(guild.permissions) & 32n ? (
                                                  <Badge variant="secondary">manager</Badge>
                                              ) : (
                                                  <Badge variant="destructive">no permissions</Badge>
                                              )}
                                              {guild.features.includes("COMMUNITY") ? <Badge variant="secondary">community</Badge> : null}
                                          </div>
                                      </div>
                                  </a>
                              ))
                            : new Array(12).fill(0).map((_, i) => <Skeleton key={`${i}`} className="h-24 rounded"></Skeleton>)}
                    </div>
                </div>
            </Container>
        </div>
    );
}
