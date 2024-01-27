"use client";

import Icon from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/context/user";

export default function TopButton() {
    const user = useUserContext();

    return user ? (
        <a href="/manage">
            <Button>
                <span className="center-row gap-2 text-sm md:text-md lg:text-lg">
                    <Icon icon="gear"></Icon> Manage Servers
                </span>
            </Button>
        </a>
    ) : (
        <a href="/auth/login">
            <Button>
                <span className="center-row gap-2 text-sm md:text-md lg:text-lg">
                    <Icon icon="discord" brand></Icon> Log In
                </span>
            </Button>
        </a>
    );
}
