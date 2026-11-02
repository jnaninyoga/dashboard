"use client";

import { useId, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { suggestPrices } from "@/lib/domain/billing/price-list";
import { productLabel, type ProductUnit } from "@/lib/domain/price-list/product";
import { type Product } from "@/lib/types";
import { formatMoney } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/ui";

import { HamburgerMenu } from "iconsax-reactjs";

interface DescriptionAutocompleteProps {
	value: string;
	onChange: (val: string) => void;
	/** A service taken from her price list. */
	onPick: (service: Product, label: string) => void;
	/** Her services for partners. */
	services: Product[];
	disabled?: boolean;
	placeholder?: string;
	/** Extra attributes for the input (an aria-label, data-* to focus it, key handling). */
	inputProps?: Omit<React.ComponentProps<"input">, "value" | "onChange" | "disabled" | "placeholder"> & {
		[data: `data-${string}`]: string | number | undefined;
	};
	/** Classes for the input. */
	inputClassName?: string;
}

/**
 * A line's description, with her price list as suggestions (a combobox).
 * - It suggests what matches the words typed so far, each price once; on an
 *   empty line it offers the whole list, and the ☰ button opens it anytime.
 * - ↑ ↓ move through the suggestions, Enter takes the highlighted one, Esc
 *   closes them. With nothing highlighted, Enter does what the line does
 *   (moves on), so a description of her own is never replaced by accident.
 * - Taking a suggestion fills the description ("Famille (3–5 pax)"), the
 *   price, and the service the line sells.
 */
export function DescriptionAutocomplete({
	value,
	onChange,
	onPick,
	services,
	disabled,
	placeholder = "Description…",
	inputProps,
	inputClassName,
}: DescriptionAutocompleteProps) {
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(-1);
	const listId = useId();
	const options = useMemo(
		() => suggestPrices(services.map((service) => ({ service, id: service.id, label: productLabel(service), price: service.price })), value),
		[services, value],
	);
	const shown = open && !disabled && options.length > 0;

	const close = () => {
		setOpen(false);
		setActive(-1);
	};
	const pick = (option: (typeof options)[number]) => {
		close();
		onPick(option.service, option.label);
	};

	return (
		<Popover open={shown} onOpenChange={(next) => (next ? setOpen(true) : close())}>
			<PopoverAnchor asChild>
				<div className="relative w-full">
					<button
						type="button"
						tabIndex={-1}
						aria-label="Show your prices"
						disabled={disabled}
						// Keeps the focus in the description while the list opens.
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => (shown ? close() : setOpen(true))}
						className="text-muted-foreground/60 hover:bg-secondary/40 hover:text-foreground absolute top-1/2 left-1 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-md"
					>
						<HamburgerMenu size={14} variant="Bulk" />
					</button>
					<Input
						{...inputProps}
						role="combobox"
						aria-expanded={shown}
						aria-controls={shown ? listId : undefined}
						aria-autocomplete="list"
						aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
						autoComplete="off"
						value={value}
						onChange={(event) => {
							onChange(event.target.value);
							setOpen(true);
							setActive(-1);
						}}
						onFocus={(event) => {
							inputProps?.onFocus?.(event);
							// An empty line offers the whole price list.
							if (!value) setOpen(true);
						}}
						onBlur={(event) => {
							inputProps?.onBlur?.(event);
							close();
						}}
						onKeyDown={(event) => {
							if (shown) {
								if (event.key === "ArrowDown" || event.key === "ArrowUp") {
									event.preventDefault();
									const step = event.key === "ArrowDown" ? 1 : -1;
									setActive((i) => (i + step + options.length) % options.length);
									return;
								}
								if (event.key === "Enter" && active >= 0) {
									event.preventDefault();
									pick(options[active]);
									return;
								}
								if (event.key === "Escape") {
									event.preventDefault();
									close();
									return;
								}
							} else if (event.key === "ArrowDown" && options.length) {
								event.preventDefault();
								setOpen(true);
								setActive(0);
								return;
							}
							if (event.key === "Enter") close();
							inputProps?.onKeyDown?.(event);
						}}
						disabled={disabled}
						placeholder={placeholder}
						className={cn("bg-card h-8 border pl-9 text-sm font-medium", inputClassName)}
					/>
				</div>
			</PopoverAnchor>
			<PopoverContent
				align="start"
				sideOffset={6}
				className="p-1"
				style={{ width: "var(--radix-popover-anchor-width)" }}
				onOpenAutoFocus={(event) => event.preventDefault()}
				onCloseAutoFocus={(event) => event.preventDefault()}
			>
				<ul id={listId} role="listbox" aria-label="Your prices" className="max-h-60 overflow-y-auto">
					{options.map((option, index) => (
						<li
							key={option.id}
							id={`${listId}-${index}`}
							role="option"
							aria-selected={index === active}
							// Picking with the mouse keeps the focus in the description.
							onMouseDown={(event) => event.preventDefault()}
							onMouseEnter={() => setActive(index)}
							onClick={() => pick(option)}
							className={cn(
								"flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm",
								index === active ? "bg-primary/10 text-primary" : "text-foreground",
							)}
						>
							<span className="truncate font-medium">{option.label}</span>
							<span className="text-muted-foreground shrink-0 tabular-nums">
								{formatMoney(Number(option.price))}
								{option.service.unit ? <span className="text-muted-foreground/70"> / {option.service.unit}</span> : null}
							</span>
						</li>
					))}
				</ul>
			</PopoverContent>
		</Popover>
	);
}

/**
 * Under a line that sells a service: what its quantity counts, and where its
 * price came from (her price list, or the quotation it bills).
 */
export function LineUnitNote({ unit, fromQuote }: { unit?: ProductUnit | null; fromQuote?: boolean }) {
	if (!unit) return null;
	return (
		<p className="text-muted-foreground/80 mt-1 pl-9 text-[11px] leading-tight max-sm:pl-0">
			Per {unit}, {fromQuote ? "as quoted" : "from your price list"}
		</p>
	);
}
