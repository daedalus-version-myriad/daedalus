export type Secrets = {
    PORTS: {
        API: number;
    };
    DATABASE: {
        NAME: string;
        USERNAME: string;
        HOST: string;
        PASSWORD: string;
    };
    DISCORD: {
        CLIENT: {
            ID: string;
            SECRET: string;
        };
    };
    NEXT_AUTH_SECRET: string;
};

export * from "./secrets.ts";
