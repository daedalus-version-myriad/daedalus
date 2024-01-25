"use client";

import Icon from "@/components/Icon";
import LoginButton from "@/components/LoginButton";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/context/user";

export default function TopButton() {
    const user = useUserContext();

    return user ? (
        <a href="/manage">
            <Button>
                <span className="flex items-center gap-2 text-sm md:text-md lg:text-lg">
                    <Icon icon="gear"></Icon> Manage Servers
                </span>
            </Button>
        </a>
    ) : (
        <LoginButton>
            <span className="flex items-center gap-2 text-sm md:text-md lg:text-lg">
                <Icon icon="discord" brand></Icon> Log In
            </span>
        </LoginButton>
    );
}
