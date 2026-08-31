import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function tryParse<T = number>(text: string, fallback: T): number | T {
    if (/^\d+$/.test(text)) return parseInt(text);
    return fallback;
}
