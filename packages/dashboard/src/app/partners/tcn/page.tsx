import { secrets } from "@daedalus/config";
import TCNBody from "./page-body";

export default async function TCN() {
    return <TCNBody tcnURL={secrets.TCN.API}></TCNBody>;
}
