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

import { Refresh, Trash } from "iconsax-reactjs";
import { toast } from "sonner";

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
            if (result.success) {
                toast.success("Session cancelled.");
                setOpen(false);
                router.refresh();
            } else {
                toast.error(result.error ?? "Failed to cancel session.");
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
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 rounded-full transition-colors"
                >
                    <Trash className="h-4 w-4" variant="Bulk" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this session?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {eventTitle ? (
                            <>
                                <span className="font-heading text-foreground text-lg">
                                    {eventTitle}
                                </span>
                                <br />
                            </>
                        ) : null}
                        This will delete the event from Google Calendar. Any attendance
                        records already taken will be preserved. This cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Keep session</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirm();
                        }}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending ? (
                            <Refresh className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Yes, cancel it
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
