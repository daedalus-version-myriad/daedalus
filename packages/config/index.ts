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
        CALLBACK: string;
    };
};

export * from "./secrets";
