"use client";

import { useState, useTransition } from "react";

import { deleteContactAction } from "@/actions/b2b-partners";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Contact } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Call, More, Sms, Star, Trash, User } from "iconsax-reactjs";

export function ContactList({ contacts }: { contacts: Contact[] }) {
	if (!contacts.length) {
		return (
			<Card className="border-foreground/10 group flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-20 text-center shadow-none">
				<Avatar className="bg-secondary/45 border-secondary-3/30 h-16 w-16 border shadow-xs">
					<AvatarFallback className="bg-transparent">
						<User className="text-secondary-3/60 h-8 w-8" variant="Outline" />
					</AvatarFallback>
				</Avatar>
				<h3 className="text-foreground font-heading font-bold">No contacts</h3>
				<p className="text-muted-foreground/80 text-sm">
					Add a collaborator to manage this partner.
				</p>
			</Card>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{contacts.map((contact) => (
				<ContactItem key={contact.id} contact={contact} />
			))}
		</div>
	);
}

function ContactItem({ contact }: { contact: Contact }) {
	const [isPending, startTransition] = useTransition();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const handleDelete = async () => {
		startTransition(async () => {
			const res = await deleteContactAction(contact.id);
			if (res.error) {
				console.error(res.error);
			} else {
				setShowDeleteDialog(false);
			}
		});
	};

	return (
		<>
			<div
				className={cn(
					"group animate-slide-bottom bg-white border-foreground/10 relative flex items-center justify-between gap-4 rounded-3xl border p-3 pr-4 transition-all",
					contact.isPrimary
						? "hover:border-primary/50 hover:zen-glow-teal"
						: "hover:border-secondary-3/50 hover:zen-glow-blush",
				)}
			>
				{contact.isPrimary ? (
					<div className="absolute top-5 right-5 -z-10 opacity-0 group-hover:opacity-100 group-hover:-top-3.5 group-hover:z-10 transition-all">
						<Badge
							variant="outline"
							className="border-foreground/10 bg-primary text-primary-foreground rounded-full px-2 py-0 text-[10px] font-bold tracking-widest uppercase shadow-none"
						>
							Primary
						</Badge>
					</div>
				) : null}

				<div className="flex shrink-0 items-center gap-4">
					<Avatar
						className={cn(
							"h-12 w-12 rounded-full border transition-all",
							contact.isPrimary
								? "border-primary/20 bg-primary/10 text-primary"
								: "bg-secondary/10 text-muted-foreground border-transparent",
						)}
					>
						<AvatarFallback className="rounded-full bg-transparent">
							{contact.isPrimary ? (
								<Star size={20} variant="Bold" />
							) : (
								<User size={20} variant="Bulk" />
							)}
						</AvatarFallback>
					</Avatar>
				</div>

				<div className="flex min-w-0 flex-1 flex-col justify-center">
					<div className="font-heading group-hover:text-primary text-foreground truncate text-base font-bold transition-colors">
						{contact.fullName}
					</div>

					<div className="text-secondary-foreground truncate text-[10px] font-bold tracking-widest uppercase opacity-60">
						{contact.role || "Contact"}
					</div>
				</div>

				<div className="flex shrink-0 items-center justify-end gap-1">
					<div className="text-muted-foreground flex items-center gap-1 transition-all">
						{contact.phone ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<a
										href={`tel:${contact.phone}`}
										className="bg-secondary/40 text-secondary-3 group-hover:bg-secondary/70 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
									>
										<Call size={16} variant="Bulk" />
									</a>
								</TooltipTrigger>
								<TooltipContent side="top">
									Call {contact.fullName}
								</TooltipContent>
							</Tooltip>
						) : null}
						{contact.email ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<a
										href={`mailto:${contact.email}`}
										className="bg-secondary/40 text-secondary-3 group-hover:bg-secondary/70 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
									>
										<Sms size={16} variant="Bulk" />
									</a>
								</TooltipTrigger>
								<TooltipContent side="top">
									Email {contact.fullName}
								</TooltipContent>
							</Tooltip>
						) : null}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="bg-sidebar text-secondary-foreground group-hover:bg-background flex h-8 w-8 items-center justify-center rounded-full transition-colors"
								>
									<More size={16} className="rotate-90" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="border-foreground/10 rounded-xl w-44"
							>
								<DropdownMenuItem className="cursor-pointer p-2.5 text-xs font-bold tracking-wide uppercase">
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setShowDeleteDialog(true)}
									className="text-destructive focus:bg-destructive/5 focus:text-destructive cursor-pointer p-2.5 text-xs font-bold tracking-wide uppercase focus:[&_svg]:text-destructive"
								>
									<Trash className="mr-2 h-4 w-4" variant="Outline" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle className="font-heading text-xl font-bold">
							Are you absolutely sure?
						</AlertDialogTitle>
						<AlertDialogDescription className="text-muted-foreground leading-relaxed">
							This will permanently delete <strong>{contact.fullName}</strong>{" "}
							from this partner&apos;s contact list.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-2">
						<AlertDialogCancel className="bg-secondary/50 hover:bg-secondary rounded-xl border-0 font-bold">
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleDelete();
							}}
							disabled={isPending}
							className="bg-destructive hover:bg-destructive/90 shadow-destructive/20 rounded-xl font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
						>
							{isPending ? "Deleting..." : "Delete Contact"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
