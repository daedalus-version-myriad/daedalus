/*
 * Thanks to AroLeaf on GitHub
 * Copied from https://github.com/Teyvat-Collective-Network/relay-bot/blob/6a1ec9746b0af8248e681d46e6816b8116c7b3dc/lib/StickerCache.js
 * with permission
 */

import { Sticker, StickerFormatType } from "discord.js";
import { existsSync, mkdirSync } from "fs";
import * as path from "path";

import { $ } from "zx";
$.verbose = false;

class StickerCache {
    base: string;

    constructor(base: string) {
        this.base = base;
        if (!existsSync(base)) mkdirSync(base);
    }

    async store(sticker: Sticker): Promise<string | undefined> {
        const sticker_path = this.path(sticker);

        switch (sticker.format) {
            case StickerFormatType.PNG:
                await $`ffmpeg -y -i ${sticker.url} -lavfi "format=rgba,scale=160:160:flags=lanczos:force_original_aspect_ratio=decrease" ${sticker_path}`;
                return sticker_path;
            case StickerFormatType.APNG:
                await $`ffmpeg -y -i ${sticker.url} -lavfi "[0:v] scale=160:160:flags=lanczos:force_original_aspect_ratio=decrease,split [a][b]; [a] palettegen [p]; [b][p] paletteuse" ${sticker_path}`;
                return sticker_path;
        }
    }

    async fetch(sticker: Sticker): Promise<string | null> {
        const sticker_path = this.path(sticker);

        if (!existsSync(sticker_path))
            try {
                await this.store(sticker);
            } catch {
                return null;
            }

        return sticker_path;
    }

    path(sticker: Sticker): string {
        return `${path.resolve(this.base, sticker.id)}.${this.ext(sticker)}`;
    }

    ext(sticker: Sticker): string | undefined {
        switch (sticker.format) {
            case StickerFormatType.PNG:
                return "png";
            case StickerFormatType.APNG:
                return "gif";
        }
    }
}

export default new StickerCache("../../sticker-cache");
