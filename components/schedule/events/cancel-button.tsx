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

import { CloseCircle, Danger, Refresh } from "iconsax-reactjs";
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
                    className="text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full backdrop-blur-sm transition-colors"
                >
                    <CloseCircle className="h-5 w-5" variant="Bulk" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-destructive/20 ring-destructive/10 ring-1">
                <div
                    aria-hidden
                    className="from-destructive/70 to-destructive absolute top-0 left-0 h-1 w-full rounded-t-[inherit] bg-gradient-to-r"
                />
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive flex items-center gap-2.5">
                        <span className="bg-destructive/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                            <Danger className="text-destructive h-5 w-5" variant="Bulk" />
                        </span>
                        Cancel this session?
                    </AlertDialogTitle>
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
                        variant="destructive"
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirm();
                        }}
                        disabled={isPending}
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
