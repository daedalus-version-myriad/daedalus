export type Secrets = {
    API_PORT: number;
    DATABASE: {
        NAME: string;
        USERNAME: string;
        HOST: string;
        PASSWORD: string;
    };
};

export * from "./secrets.ts";
