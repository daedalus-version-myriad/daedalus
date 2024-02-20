import { proc } from "../trpc";

export default {
    checkStatus: proc.query(() => true),
} as const;
