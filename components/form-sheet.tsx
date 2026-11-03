"use client";

import { useEffect, useRef, useState } from "react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import { cn } from "@/lib/utils/ui";

type FormSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	trigger?: React.ReactNode;
	icon?: React.ReactNode;
	title: React.ReactNode;
	description?: React.ReactNode;
	/** The form. Its submit button lives in `footer`, linked with `form="<id>"`. */
	children: React.ReactNode;
	footer: React.ReactNode;
	/** A save is in flight: the sheet can't be closed until it settles. */
	busy?: boolean;
	/** For forms that track their own state; otherwise edits to the inner
	 *  <form> are detected automatically. */
	dirty?: boolean;
	className?: string;
};

const serialize = (form: HTMLFormElement | null | undefined) =>
	form
		? new URLSearchParams(
				new FormData(form) as unknown as Record<string, string>,
			).toString()
		: "";

/**
 * Create/edit surface: a side panel on desktop, a bottom drawer on phones.
 * An outside click, Escape, swipe or Cancel never silently throws away
 * edits; with unsaved changes it asks first.
 */
export function FormSheet({
	open,
	onOpenChange,
	trigger,
	icon,
	title,
	description,
	children,
	footer,
	busy = false,
	dirty,
	className,
}: FormSheetProps) {
	const isMobile = useIsMobile();
	const bodyRef = useRef<HTMLDivElement>(null);
	const snapshot = useRef<string | null>(null);
	const [trackedDirty, setTrackedDirty] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);

	// Remember what the form looked like when it opened, so reverting an
	// edit makes it clean again.
	useEffect(() => {
		if (!open) return;
		snapshot.current = null;
		const frame = requestAnimationFrame(() => {
			snapshot.current = serialize(bodyRef.current?.querySelector("form"));
			setTrackedDirty(false);
		});
		return () => cancelAnimationFrame(frame);
	}, [open]);

	// Compared a frame later: controlled fields (phone, pickers) write their
	// hidden <input> on React's re-render, after the event that triggered it.
	const track = () => {
		requestAnimationFrame(() => {
			if (snapshot.current === null) return;
			const form = bodyRef.current?.querySelector("form");
			setTrackedDirty(serialize(form) !== snapshot.current);
		});
	};

	const isDirty = dirty ?? trackedDirty;
	const locked = isDirty || busy;

	const requestClose = () => {
		if (busy) return;
		if (isDirty) setConfirmOpen(true);
		else onOpenChange(false);
	};

	return (
		<>
			<Drawer
				open={open}
				onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}
				// While locked the drawer ignores outside clicks, Escape and swipes;
				// the handlers below turn those attempts into the discard prompt.
				dismissible={!locked}
				direction={isMobile ? "bottom" : "right"}
			>
				{trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
				<DrawerContent
					className={className}
					onPointerDownOutside={() => {
						if (locked) requestClose();
					}}
					onEscapeKeyDown={(event) => {
						if (!locked) return;
						event.preventDefault();
						requestClose();
					}}
				>
					<DrawerHeader className="flex-row items-center gap-4 text-left">
						{icon ? (
							<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
								{icon}
							</div>
						) : null}
						<div className="min-w-0 space-y-1">
							<DrawerTitle>{title}</DrawerTitle>
							{description ? (
								<DrawerDescription>{description}</DrawerDescription>
							) : null}
						</div>
					</DrawerHeader>

					<div
						ref={bodyRef}
						onInput={track}
						onChange={track}
						data-vaul-no-drag
						className="min-h-0 flex-1 overflow-y-auto px-6 pb-4"
					>
						{children}
					</div>

					<DrawerFooter
						className={cn(
							"flex-row justify-end border-t bg-card/95 py-4",
							"pb-[max(1rem,env(safe-area-inset-bottom))]",
						)}
					>
						<Button
							type="button"
							variant="ghost"
							onClick={requestClose}
							disabled={busy}
							className="h-11 rounded-xl"
						>
							Cancel
						</Button>
						{footer}
					</DrawerFooter>
				</DrawerContent>
			</Drawer>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent className="rounded-3xl">
					<AlertDialogHeader>
						<AlertDialogTitle>Discard changes?</AlertDialogTitle>
						<AlertDialogDescription>
							What you typed in this form hasn&apos;t been saved and will be lost.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">Keep editing</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							className="rounded-xl"
							onClick={() => {
								setConfirmOpen(false);
								onOpenChange(false);
							}}
						>
							Discard
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
