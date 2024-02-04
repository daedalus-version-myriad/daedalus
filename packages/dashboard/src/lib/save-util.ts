"use server";

export async function trpcSave(fn: () => unknown) {
    try {
        const res = await fn();
        console.log(res);
        return res;
    } catch (error: any) {
        console.log(error);

        try {
            return error.meta.responseJSON.flatMap((e: any) => JSON.parse(e.error.message).map((m: any) => m.message)).join(" ");
        } catch {
            console.log(Date.now(), error);
            return "An unexpected error occurred. Please contact support if this issue persists.";
        }
    }
}
