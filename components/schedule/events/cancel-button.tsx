"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cancelEventAction } from "@/lib/actions/schedule/events";
import { notify, notifyActionError } from "@/lib/feedback/notify";

import { CloseCircle, Danger, Refresh } from "iconsax-reactjs";

export function CancelEventButton({
    eventId,
    eventTitle,
}: {
    eventId: string;
    eventTitle?: string | null;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleConfirm = () => {
        startTransition(async () => {
            const result = await cancelEventAction(eventId);
            if ("success" in result) {
                notify.success(
                    "Session cancelled.",
                    result.refunded
                        ? `${result.refunded} ${result.refunded === 1 ? "credit" : "credits"} given back to the clients who checked in.`
                        : undefined,
                );
                setOpen(false);
                router.refresh();
            } else {
                notifyActionError(result, "Failed to cancel session.");
            }
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Cancel session"
                    title="Cancel session"
                    className="size-8 rounded-full text-muted-foreground/70 backdrop-blur-sm transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                    <CloseCircle className="size-5" variant="Bulk" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-destructive/20 ring-1 ring-destructive/10">
                <div
                    aria-hidden
                    className="absolute top-0 left-0 h-1 w-full rounded-t-[inherit] bg-linear-to-r from-destructive/70 to-destructive"
                />
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2.5 text-destructive">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                            <Danger className="size-5 text-destructive" variant="Bulk" />
                        </span>
                        Cancel this session?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {eventTitle ? (
                            <>
                                <span className="font-heading text-lg text-foreground">
                                    {eventTitle}
                                </span>
                                <br />
                            </>
                        ) : null}
                        It leaves Google Calendar, so the time frees up and guests are told.
                        It stays in your history as cancelled, and everyone who checked in
                        gets their credit back. You can&apos;t undo this.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Keep session</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirm();
                        }}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Refresh className="mr-2 size-4 animate-spin" />
                        ) : null}
                        Yes, cancel it
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
