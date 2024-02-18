import type { MessageData, ParsedMessage } from "@daedalus/types";

export function splitMessage(message: MessageData & { parsed: ParsedMessage }) {
    return { message: { content: message.content, embeds: message.embeds }, parsed: message.parsed };
}
