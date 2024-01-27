import { z } from "zod";

export const snowflake = z.string().regex(/^[1-9][0-9]{16,19}$/);
