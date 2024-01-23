import { trpc } from "@daedalus/api";

console.log(await trpc.userList.query());
