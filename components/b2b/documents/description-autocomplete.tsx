"use client";

import { useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { type B2BPricingTier } from "@/lib/types/b2b";

import { HamburgerMenu } from "iconsax-reactjs";

interface DescriptionAutocompleteProps {
	value: string;
	onChange: (val: string) => void;
	onSelectTier: (tier: B2BPricingTier) => void;
	pricingTiers: B2BPricingTier[];
	disabled?: boolean;
	placeholder?: string;
}

/**
 * Single-line description input wired to the partner pricing tiers. The
 * burger trigger and the input's onFocus handler can't fight each other:
 * - onFocus only OPENS (never closes), so re-focusing after Radix's outside-
 *   click close doesn't immediately re-open during the same gesture.
 * - The burger uses onMouseDown preventDefault so clicking it never steals
 *   focus from the input, and tabIndex=-1 keeps it out of the tab order.
 * - PopoverTrigger handles the open/close transition transactionally so
 *   toggling is consistent regardless of focus state.
 */
export function DescriptionAutocomplete({
	value,
	onChange,
	onSelectTier,
	pricingTiers,
	disabled,
	placeholder = "Description…",
}: DescriptionAutocompleteProps) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<div ref={containerRef} className="relative w-full">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						size="icon"
						variant="ghost"
						tabIndex={-1}
						disabled={disabled}
						onMouseDown={(e) => e.preventDefault()}
						className="text-muted-foreground/60 hover:bg-secondary/40 hover:text-foreground absolute top-1/2 left-1 z-10 size-6 -translate-y-1/2 rounded-md"
					>
						<HamburgerMenu size={14} variant="Bulk" />
					</Button>
				</PopoverTrigger>
				<PopoverAnchor asChild>
					<Input
						value={value}
						onFocus={() => {
							if (!open) setOpen(true);
						}}
						onChange={(e) => {
							onChange(e.target.value);
							if (!open) setOpen(true);
						}}
						disabled={disabled}
						className="bg-card h-8 border pl-9 text-sm font-medium"
						placeholder={placeholder}
					/>
				</PopoverAnchor>
				<PopoverContent
					align="start"
					className="border p-0"
					style={{ width: "var(--radix-popover-anchor-width)" }}
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<Command className="bg-card">
						<CommandList className="max-h-48">
							<CommandEmpty>No results.</CommandEmpty>
							<CommandGroup>
								{pricingTiers
									.filter((t) =>
										t.name.toLowerCase().includes(value.toLowerCase()),
									)
									.map((tier) => (
										<CommandItem
											key={tier.id}
											value={tier.name}
											onSelect={() => {
												onSelectTier(tier);
												setOpen(false);
											}}
											className="hover:bg-primary/5 data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary flex cursor-pointer items-center justify-between px-3 py-2 transition-colors"
										>
											<span className="text-xs font-bold tracking-tight">
												{tier.name}
											</span>
											<Badge
												variant="outline"
												className="bg-accent/20 text-primary border-primary/10 ml-2 font-mono text-[10px] font-black"
											>
												{tier.price.toLocaleString()} MAD
											</Badge>
										</CommandItem>
									))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
