import { ButtonStyle, ComponentType, User, type ButtonComponentData } from "discord.js";

export function stopButton(caller: User): ButtonComponentData {
    return { type: ComponentType.Button, customId: `:${caller.id}:stop`, style: ButtonStyle.Danger, label: "HALT" };
}
