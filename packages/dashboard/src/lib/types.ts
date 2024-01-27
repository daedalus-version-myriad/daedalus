export type Awaitable<T> = Promise<T> | T;

export type User = {
    id: string;
    name: string;
    image: string;
    admin: boolean;
};

export type PartialGuild = {
    id: string;
    name: string;
    icon?: string;
    owner: boolean;
    permissions: string;
    hasBot: boolean;
    features: string[];
};

export type FormHandler<T> = (data: T) => Awaitable<{ name: keyof T; type: string; message: string }[] | undefined>;
