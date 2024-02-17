import type { ClientManager } from "@daedalus/clients";

let manager: ClientManager;

export function setManager(clients: ClientManager) {
    manager = clients;
}

export function getManager() {
    return manager;
}
