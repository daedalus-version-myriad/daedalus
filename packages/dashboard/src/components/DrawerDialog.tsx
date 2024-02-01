"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ReactNode, useState } from "react";
import Container from "./Container";

export function DrawerDialog({
    trigger,
    title,
    description,
    children,
}: {
    trigger: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent className="max-w-[75vw] max-h-[75vh] overflow-y-scroll">
                    {title || description ? (
                        <DialogHeader>
                            {title ? <DialogTitle>{title}</DialogTitle> : null}
                            {description ? <DialogDescription>{description}</DialogDescription> : null}
                        </DialogHeader>
                    ) : null}
                    {children}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>{trigger}</DrawerTrigger>
            <DrawerContent>
                <Container className="max-h-[75vh] overflow-y-scroll">
                    {title || description ? (
                        <DrawerHeader className="text-left">
                            {title ? <DrawerTitle>{title}</DrawerTitle> : null}
                            {description ? <DrawerDescription>{description}</DrawerDescription> : null}
                        </DrawerHeader>
                    ) : null}
                    {children}
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </Container>
            </DrawerContent>
        </Drawer>
    );
}
