import { proc } from "../trpc.js";

export default {
    checkStatus: proc.query(() => true),
} as const;
