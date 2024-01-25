"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormHandler } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
    code: z.string().min(1).max(64),
    title: z.string().min(1).max(64),
    subtitle: z.string().min(1).max(64),
    summary: z.string().min(1).max(256),
    body: z.string().min(1),
});

export type NewsFormData = z.infer<typeof schema>;

export default function NewsForm(
    data: {
        handler: FormHandler<NewsFormData>;
        buttonText: string;
        readonlyCode?: boolean;
    } & Partial<NewsFormData>,
) {
    const form = useForm<NewsFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            code: data.code ?? "",
            title: data.title ?? "",
            subtitle: data.subtitle ?? "",
            summary: data.summary ?? "",
            body: data.body ?? "",
        },
    });

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(async (x) => {
                    const response = await data.handler({ ...x, code: data.readonlyCode ? data.code ?? x.code : x.code });
                    response?.forEach(({ name, type, message }) => form.setError(name, { type, message }));
                })}
            >
                <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL Code</FormLabel>
                            <FormControl>
                                <Input placeholder="big-things-happening" {...field} readOnly={data.readonlyCode ?? false}></Input>
                            </FormControl>
                            <FormDescription>This is the unique internal ID, also present in the URL.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                ></FormField>
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Cool Updates" {...field}></Input>
                            </FormControl>
                            <FormDescription>This will be the title displayed in the article and on the front page.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                ></FormField>
                <FormField
                    control={form.control}
                    name="subtitle"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subtitle</FormLabel>
                            <FormControl>
                                <Input placeholder="Things are happening." {...field}></Input>
                            </FormControl>
                            <FormDescription>This subtitle will be displayed under the title in the article and on the front page.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                ></FormField>
                <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Summary</FormLabel>
                            <FormControl>
                                <Textarea placeholder="A quick summary of what's happening" {...field}></Textarea>
                            </FormControl>
                            <FormDescription>This summary will be displayed on the front page but not when the article is opened.</FormDescription>
                            <FormMessage></FormMessage>
                        </FormItem>
                    )}
                ></FormField>
                <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Body</FormLabel>
                            <FormControl>
                                <Textarea placeholder="The full body of the article" {...field}></Textarea>
                            </FormControl>
                            <FormDescription>The body text is displayed in the full article.</FormDescription>
                            <FormMessage></FormMessage>
                        </FormItem>
                    )}
                ></FormField>
                <br />
                <Button type="submit">{data.buttonText}</Button>
            </form>
        </Form>
    );
}
