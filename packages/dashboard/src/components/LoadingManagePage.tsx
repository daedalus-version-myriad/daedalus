"use server";

import Panel from "./Panel";
import { Skeleton } from "./ui/skeleton";

function rng<T>(...array: T[]) {
    return array[Math.floor(Math.random() * array.length)];
}

export default async function LoadingManagePage() {
    return new Array(rng(3, 5, 7)).fill(0).map((_, i) => <RandomPanel key={i}></RandomPanel>);
}

function RandomPanel() {
    return (
        <Panel className="w-full overflow-x-hidden">
            <Skeleton style={{ height: "2rem", width: rng("12rem", "20rem", "28rem") }}></Skeleton>
            {Math.random() < 0.5 ? (
                <>
                    <Skeleton style={{ height: rng("4rem", "6rem", "8rem"), width: rng("32rem", "36rem", "40rem") }}></Skeleton>
                    <Skeleton style={{ height: "2rem", width: rng("8rem", "10rem", "12rem") }}></Skeleton>
                </>
            ) : (
                <>
                    <div className="center-row gap-4">
                        <Skeleton style={{ height: "6rem", width: rng("6rem", "8rem") }}></Skeleton>
                        <Skeleton style={{ height: "6rem", width: rng("8rem", "10rem") }}></Skeleton>
                        <Skeleton style={{ height: "6rem", width: rng("10rem", "12rem") }}></Skeleton>
                    </div>
                </>
            )}
        </Panel>
    );
}
