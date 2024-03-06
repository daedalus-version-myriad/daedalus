"use server";

import { secrets } from "@daedalus/config";
import PartnersBody from "./page-body";

export default async function Partners() {
    return <PartnersBody tcnURL={secrets.TCN.API}></PartnersBody>;
}
