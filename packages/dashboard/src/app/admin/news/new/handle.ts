"use server";

import type { NewsFormData } from "@/forms/admin-news.jsx";
import { FormHandler } from "@/lib/types.js";
import { trpc } from "@daedalus/api";
import { redirect } from "next/navigation";

export const handle: FormHandler<NewsFormData> = async (data) => {
    const error = await trpc.newsCreate.mutate(data);
    if (!error) redirect("/admin/news");

    return [{ name: "code", type: "Duplicate Code", message: error }];
};
