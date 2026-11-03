"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

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

export type ConfirmOptions = {
	title: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	/** Irreversible or data-losing actions get the red button. */
	destructive?: boolean;
};

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/**
 * In-app replacement for window.confirm(): `if (!(await confirm({...})))
 * return;`. Native confirm blocks the page, can't be styled and looks
 * different on every phone.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
	const [options, setOptions] = useState<ConfirmOptions | null>(null);
	const resolver = useRef<((ok: boolean) => void) | null>(null);

	const confirm = useCallback<Confirm>((next) => {
		resolver.current?.(false);
		setOptions(next);
		return new Promise<boolean>((resolve) => {
			resolver.current = resolve;
		});
	}, []);

	const settle = (ok: boolean) => {
		resolver.current?.(ok);
		resolver.current = null;
		setOptions(null);
	};

	return (
		<ConfirmContext.Provider value={confirm}>
			{children}
			<AlertDialog
				open={options !== null}
				onOpenChange={(open) => {
					if (!open) settle(false);
				}}
			>
				<AlertDialogContent className="rounded-3xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{options?.title}</AlertDialogTitle>
						{options?.description ? (
							<AlertDialogDescription>{options.description}</AlertDialogDescription>
						) : null}
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{options?.cancelLabel ?? "Cancel"}
						</AlertDialogCancel>
						<AlertDialogAction
							variant={options?.destructive ? "destructive" : "default"}
							className="rounded-xl"
							onClick={() => settle(true)}
						>
							{options?.confirmLabel ?? "Confirm"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</ConfirmContext.Provider>
	);
}

export function useConfirm(): Confirm {
	const confirm = useContext(ConfirmContext);
	if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
	return confirm;
}
