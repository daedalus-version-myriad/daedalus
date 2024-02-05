export type Secrets = {
    OWNER: string;
    DOMAIN: string;
    PORTS: {
        API: number;
        WS: number;
        LOG: number;
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
    STRIPE: {
        SECRET_KEY: string;
        PRICES: Record<`${"PREMIUM" | "CUSTOM"}_${"MONTHLY" | "YEARLY"}`, string>;
        PRODUCTS: Record<"PREMIUM" | "CUSTOM", string>;
    };
    ASSETS: {
        XP_LEVELUP_IMAGE: string;
        XP_RANK_CARD_IMAGE: string;
    };
};

export * from "./secrets";
