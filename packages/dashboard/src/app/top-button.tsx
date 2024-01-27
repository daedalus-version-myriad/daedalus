"use client";

import { Button } from "@/components/ui/button";
import { useUserContext } from "@/context/user";
import { FaDiscord, FaGear } from "react-icons/fa6";

export default function TopButton() {
    const user = useUserContext();

    return user ? (
        <a href="/manage">
            <Button>
                <span className="center-row gap-2 text-sm md:text-md lg:text-lg">
                    <FaGear></FaGear> Manage Servers
                </span>
            </Button>
        </a>
    ) : (
        <a href="/auth/login">
            <Button>
                <span className="center-row gap-2 text-sm md:text-md lg:text-lg">
                    <FaDiscord></FaDiscord> Log In
                </span>
            </Button>
        </a>
    );
}
