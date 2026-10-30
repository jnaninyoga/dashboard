"use client";

import { createContext, useContext, useRef, useState } from "react";
import Link from "next/link";

import { NewSessionDialog } from "@/components/schedule/sessions/new-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CalendarAdd, CardAdd, DocumentText1, type Icon, UserAdd } from "iconsax-reactjs";

type QuickActions = { openNewSession: () => void };

const QuickActionsContext = createContext<QuickActions | null>(null);

/**
 * Holds what the quick actions open, above the sidebar: on a phone the menu
 * closes as she picks an action, and the session sheet must outlive it.
 */
export function QuickActionsProvider({ children }: { children: React.ReactNode }) {
	const [newSessionOpen, setNewSessionOpen] = useState(false);
	return (
		<QuickActionsContext.Provider value={{ openNewSession: () => setNewSessionOpen(true) }}>
			{children}
			<NewSessionDialog open={newSessionOpen} onOpenChange={setNewSessionOpen} />
		</QuickActionsContext.Provider>
	);
}

export function useQuickActions() {
	const context = useContext(QuickActionsContext);
	if (!context) throw new Error("useQuickActions needs a QuickActionsProvider");
	return context;
}

function ActionItem({
	icon: ItemIcon,
	title,
	hint,
	href,
	onSelect,
}: {
	icon: Icon;
	title: string;
	hint: string;
	href?: string;
	onSelect?: () => void;
}) {
	const content = (
		<>
			<span className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-full">
				<ItemIcon size={20} variant="Bulk" className="text-primary size-5" />
			</span>
			<span className="flex min-w-0 flex-col">
				<span className="text-foreground font-medium">{title}</span>
				<span className="text-muted-foreground text-xs">{hint}</span>
			</span>
		</>
	);
	const className = "gap-3 rounded-xl px-2.5 py-2";
	return href ? (
		<DropdownMenuItem asChild className={className} onSelect={onSelect}>
			<Link href={href}>{content}</Link>
		</DropdownMenuItem>
	) : (
		<DropdownMenuItem className={className} onSelect={onSelect}>
			{content}
		</DropdownMenuItem>
	);
}

/** The four things she starts most often, for a "New" menu. */
export function QuickActionItems({ onChoose }: { onChoose?: () => void }) {
	const { openNewSession } = useQuickActions();
	return (
		<>
			<ActionItem
				icon={CalendarAdd}
				title="New session"
				hint="A class on the schedule"
				onSelect={() => {
					onChoose?.();
					openNewSession();
				}}
			/>
			<ActionItem icon={UserAdd} title="Add client" hint="A new student" href="/clients/add" onSelect={onChoose} />
			<ActionItem icon={CardAdd} title="Sell a card" hint="Pick the client, then Wallet" href="/clients" onSelect={onChoose} />
			<ActionItem
				icon={DocumentText1}
				title="New quotation"
				hint="For a hotel or company"
				href="/b2b/documents/new"
				onSelect={onChoose}
			/>
		</>
	);
}

/**
 * The "New" menu around any trigger (the sidebar's button, the phone bar's
 * +). Once an action is chosen the menu doesn't hand focus back to its
 * trigger: the session sheet it opens needs it (Escape, screen readers).
 */
export function QuickActionsMenu({
	children,
	side,
	align = "start",
	onChoose,
}: {
	children: React.ReactElement;
	side: "top" | "right" | "bottom";
	align?: "start" | "center" | "end";
	onChoose?: () => void;
}) {
	const chosen = useRef(false);
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
			<DropdownMenuContent
				side={side}
				align={align}
				sideOffset={side === "top" ? 14 : 8}
				collisionPadding={16}
				className="w-72 rounded-2xl p-1.5"
				onCloseAutoFocus={(event) => {
					if (!chosen.current) return;
					chosen.current = false;
					event.preventDefault();
				}}
			>
				<QuickActionItems
					onChoose={() => {
						chosen.current = true;
						onChoose?.();
					}}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
