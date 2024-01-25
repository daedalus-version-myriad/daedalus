export type Secrets = {
    OWNER: string;
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
        TOKEN: string;
    };
    NEXT_AUTH_SECRET: string;
};

export * from "./secrets.ts";
