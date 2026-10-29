"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";

import { EntityCardGrid } from "@/components/entity-card";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/ui";

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown2, ArrowLeft2, ArrowRight2, ArrowUp2, Category } from "iconsax-reactjs";

declare module "@tanstack/react-table" {
	// The declaration must repeat the library's type parameters to merge with it.
	// eslint-disable-next-line unused-imports/no-unused-vars
	interface ColumnMeta<TData, TValue> {
		/** Classes for the column's header and cells (width, alignment). */
		className?: string;
	}
}

type DataTableProps<TData, TValue> = {
	data: TData[];
	columns: ColumnDef<TData, TValue>[];
	/** Shown instead of the table when there are no rows. */
	empty: React.ReactNode;
	/** Where a row (or its phone card) leads when tapped. */
	getRowHref?: (row: TData) => string;
	/** How one row looks on phones. Without it, phones get the table. */
	renderCard?: (row: TData) => React.ReactNode;
	/** The card draws its own frame and handles its own taps (links, buttons). */
	cardIsSelfContained?: boolean;
	/** Below which width the cards replace the table: phones only, or until the table has room. */
	cardsBelow?: "md" | "xl";
	/** Filters/search shown above the list. */
	toolbar?: React.ReactNode;
	/** Lets the operator hide optional columns on desktop. */
	columnToggle?: boolean;
	initialSorting?: SortingState;
	pageSize?: number;
	/** What the rows are, for the count line ("12 documents"). */
	noun?: { one: string; many: string };
};

// A tap on a link, button or menu inside a row does its own thing; only taps
// on the row itself open it.
const fromInteractive = (target: EventTarget | null) =>
	target instanceof Element &&
	!!target.closest("a, button, input, select, textarea, [role=menuitem], [data-no-row-click]");

/**
 * The one list component: a table on desktop, cards on phones, the same
 * empty state, sorting and paging everywhere.
 */
const CARDS_ONLY_BELOW = { md: "md:hidden", xl: "xl:hidden" } as const;
const TABLE_FROM = { md: "hidden md:block", xl: "hidden xl:block" } as const;

export function DataTable<TData, TValue>({
	data,
	columns,
	empty,
	getRowHref,
	renderCard,
	cardIsSelfContained = false,
	cardsBelow = "md",
	toolbar,
	columnToggle = false,
	initialSorting = [],
	pageSize = 20,
	noun = { one: "item", many: "items" },
}: DataTableProps<TData, TValue>) {
	const router = useRouter();
	const [sorting, setSorting] = useState<SortingState>(initialSorting);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		onColumnVisibilityChange: setColumnVisibility,
		initialState: { pagination: { pageSize } },
		state: { sorting, columnVisibility },
	});

	const open = (row: TData) => (event: React.MouseEvent) => {
		if (!getRowHref || fromInteractive(event.target)) return;
		router.push(getRowHref(row));
	};

	const rows = table.getRowModel().rows;
	const total = data.length;
	const { pageIndex } = table.getState().pagination;
	const first = pageIndex * pageSize + 1;
	const last = Math.min((pageIndex + 1) * pageSize, total);

	const toggle = columnToggle ? (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="hidden h-10 items-center gap-2 rounded-xl md:ml-auto md:flex">
					<Category size={16} />
					Columns
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{table
					.getAllColumns()
					.filter((column) => column.getCanHide())
					.map((column) => (
						<DropdownMenuCheckboxItem
							key={column.id}
							checked={column.getIsVisible()}
							onCheckedChange={(value) => column.toggleVisibility(!!value)}
						>
							{typeof column.columnDef.header === "string"
								? column.columnDef.header
								: column.id}
						</DropdownMenuCheckboxItem>
					))}
			</DropdownMenuContent>
		</DropdownMenu>
	) : null;

	return (
		<div className="animate-slide-up flex flex-col gap-4">
			{toolbar || toggle ? (
				<div className="flex flex-col gap-3 md:flex-row md:items-center">
					{toolbar}
					{toggle}
				</div>
			) : null}

			{total === 0 ? (
				empty
			) : (
				<>
					{/* Self-contained cards (EntityCard) get the card grid, aligned across
					    rows; others one per row. grid-cols-1 lets cards shrink to the
					    screen; an implicit grid column grows to the widest card. */}
					{renderCard && cardIsSelfContained ? (
						<div className={CARDS_ONLY_BELOW[cardsBelow]}>
							<EntityCardGrid>
								{rows.map((row) => (
									<Fragment key={row.id}>{renderCard(row.original)}</Fragment>
								))}
							</EntityCardGrid>
						</div>
					) : renderCard ? (
						<ul className={cn("grid grid-cols-1 gap-3", CARDS_ONLY_BELOW[cardsBelow])}>
							{rows.map((row) => (
								<li
									key={row.id}
									onClick={open(row.original)}
									className={cn(
										"bg-card border-secondary/20 min-w-0 rounded-3xl border p-4 shadow-sm transition-all",
										getRowHref && "active:bg-primary/5 cursor-pointer",
									)}
								>
									{renderCard(row.original)}
								</li>
							))}
						</ul>
					) : null}

					{/* Desktop (and phones when there is no card layout) */}
					<div className={cn(renderCard && TABLE_FROM[cardsBelow])}>
						<Table containerClassName="overflow-x-auto border-secondary/20">
							<TableHeader>
								{table.getHeaderGroups().map((group) => (
									<TableRow key={group.id} className="border-b-secondary/20 hover:bg-transparent">
										{group.headers.map((header) => {
											const sorted = header.column.getIsSorted();
											return (
												<TableHead
													key={header.id}
													aria-sort={
														sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
													}
													className={cn(
														"px-3 whitespace-nowrap first:pl-5 last:pr-5",
														header.column.columnDef.meta?.className,
													)}
												>
													{header.isPlaceholder ? null : header.column.getCanSort() ? (
														<button
															type="button"
															onClick={header.column.getToggleSortingHandler()}
															className="hover:text-foreground -mx-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors"
														>
															{flexRender(header.column.columnDef.header, header.getContext())}
															{sorted === "asc" ? (
																<ArrowUp2 size={14} />
															) : sorted === "desc" ? (
																<ArrowDown2 size={14} />
															) : null}
														</button>
													) : (
														flexRender(header.column.columnDef.header, header.getContext())
													)}
												</TableHead>
											);
										})}
									</TableRow>
								))}
							</TableHeader>
							<TableBody className="divide-secondary/15 divide-y">
								{rows.map((row) => (
									<TableRow
										key={row.id}
										onClick={open(row.original)}
										className={cn(
											"group border-none transition-colors",
											getRowHref ? "hover:bg-primary/5 cursor-pointer" : "hover:bg-transparent",
										)}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className={cn(
													"px-3 py-3 whitespace-nowrap first:pl-5 last:pr-5",
													cell.column.columnDef.meta?.className,
												)}
											>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					<div className="flex items-center justify-between gap-3 px-1">
						<p className="text-muted-foreground text-sm font-medium">
							{table.getPageCount() > 1
								? `${first}–${last} of ${total} ${noun.many}`
								: `${total} ${total === 1 ? noun.one : noun.many}`}
						</p>
						{table.getPageCount() > 1 ? (
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="icon"
									aria-label="Previous page"
									onClick={() => table.previousPage()}
									disabled={!table.getCanPreviousPage()}
									className="size-10 rounded-xl"
								>
									<ArrowLeft2 size={18} />
								</Button>
								<Button
									variant="outline"
									size="icon"
									aria-label="Next page"
									onClick={() => table.nextPage()}
									disabled={!table.getCanNextPage()}
									className="size-10 rounded-xl"
								>
									<ArrowRight2 size={18} />
								</Button>
							</div>
						) : null}
					</div>
				</>
			)}
		</div>
	);
}
