import type { ClientManager } from "../../clients/index.js";

let manager: ClientManager;

export function setManager(clients: ClientManager) {
    manager = clients;
}

export function getManager() {
    return manager;
}
