"use client";

import { signIn } from "next-auth/react";

export default function () {
    return <button onClick={() => signIn("discord")}>Sign In</button>;
}
