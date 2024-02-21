import type { MessageData, ParsedMessage } from "../types/index.js";

export function splitMessage(message: MessageData & { parsed: ParsedMessage }) {
    return { message: { content: message.content, embeds: message.embeds }, parsed: message.parsed };
}
