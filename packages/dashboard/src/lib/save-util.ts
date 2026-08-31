"use server";

import { stringifyError } from "@daedalus/formatting";
import { Awaitable } from "./types";

export async function trpcSave<T>(fn: () => Awaitable<T | void>, errorMap: (error: string) => T = (e) => e as T) {
    try {
        const res = await fn();
        return res;
    } catch (error: any) {
        console.log(`error calling trpc-save:`, stringifyError(error));

        try {
            return errorMap(error.meta.responseJSON.flatMap((e: any) => JSON.parse(e.error.message).map((m: any) => m.message)).join(" "));
        } catch (error) {
            console.log(`error returning error map from trpc-save:`, Date.now(), stringifyError(error));
            return errorMap("An unexpected error occurred. Please contact support if this issue persists.");
        }
    }
}
