"use client";

import { signIn } from "next-auth/react";
import React from "react";
import { Button } from "./ui/button";

export default function LoginButton({ children }: React.PropsWithChildren) {
    return <Button onClick={() => signIn("discord")}>{children}</Button>;
}
