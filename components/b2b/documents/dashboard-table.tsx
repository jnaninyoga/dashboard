"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
import { DocumentWithRelations } from "@/lib/types/b2b";

import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
	ArrowDown2,
	ArrowUp2,
	Category,
	DocumentText,
	ReceiptText,
} from "iconsax-reactjs";

import { DocumentFilters } from "./filters";
import { DocumentStatusBadge } from "./status-badge";

interface DocumentDashboardTableProps {
	documents: DocumentWithRelations[];
}

export function DocumentDashboardTable({
	documents,
}: DocumentDashboardTableProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnVisibility, setColumnVisibility] = useState({});
	const router = useRouter();

	const columns: ColumnDef<DocumentWithRelations>[] = [
		{
			accessorKey: "type",
			header: "Type",
			enableHiding: false,
			cell: ({ row }) => (
				<span className="text-[10px] font-bold tracking-wider uppercase opacity-40">
					{row.original.type}
				</span>
			),
		},
		{
			accessorKey: "documentNumber",
			header: "Document",
			enableHiding: false,
			cell: ({ row }) => {
				const doc = row.original;
				return (
					<Link
						href={`/b2b/documents/${doc.id}`}
						className="flex items-center gap-3"
					>
						<div className="bg-secondary/40 text-secondary-3 group-hover:bg-primary/10 group-hover:text-primary group-hover:zen-glow-teal flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all group-hover:scale-110">
							{doc.type === "invoice" ? (
								<ReceiptText size={20} variant="Bulk" />
							) : (
								<DocumentText size={20} variant="Bulk" />
							)}
						</div>
						<div className="flex min-w-0 flex-col">
							<span className="text-foreground truncate text-sm font-bold tracking-tight">
								{doc.documentNumber}
							</span>
							<span className="text-muted-foreground/60 truncate text-[10px] leading-none font-medium">
								{format(new Date(doc.issueDate), "MMM dd, yyyy")}
							</span>
						</div>
					</Link>
				);
			},
		},
		{
			id: "partner",
			accessorFn: (row) => row.partner?.companyName,
			header: "Partner",
			enableHiding: false,
			cell: ({ row }) => {
				const doc = row.original;
				const contactName = doc.contact?.fullName;
				const companyName = doc.partner?.companyName;

				return (
					<Link
						href={`/b2b/partners/${doc.partnerId}`}
						className="group/partner flex min-w-0 flex-col"
					>
						<span className="text-foreground group-hover/partner:text-primary truncate text-sm transition-colors">
							{contactName ? (
								<>
									<span className="font-bold">{contactName}</span> @ {companyName}
								</>
							) : (
								<span className="font-bold">{companyName}</span>
							)}
						</span>
					</Link>
				);
			},
		},
		{
			accessorKey: "status",
			header: "Status",
			enableHiding: false,
			cell: ({ row }) => <DocumentStatusBadge status={row.original.status} />,
		},
		{
			id: "backorder",
			header: "Backorder",
			accessorFn: (row) => (row.type === "invoice" && row.parentDocumentId ? "Yes" : "No"),
			cell: ({ row }) => {
				const isBackorder = row.original.type === "invoice" && !!row.original.parentDocumentId;
				return isBackorder ? (
					<span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold tracking-widest text-purple-600 uppercase">
						Yes
					</span>
				) : (
					<span className="text-muted-foreground text-xs">-</span>
				);
			},
		},
		{
			id: "totalPayments",
			header: "Total Payments",
			accessorFn: (row) =>
				row.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
			cell: ({ row }) => {
				const totalPayments =
					row.original.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
				return (
					<span className="text-muted-foreground text-sm font-semibold tabular-nums">
						{totalPayments.toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}{" "}
						MAD
					</span>
				);
			},
		},
		{
			id: "totalAmountDue",
			header: "Amount Due",
			accessorFn: (row) => {
				const totalPayments =
					row.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
				return Number(row.totalAmount) - totalPayments;
			},
			cell: ({ row }) => {
				const totalAmount = Number(row.original.totalAmount);
				const totalPayments =
					row.original.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
				const amountDue = Math.max(0, totalAmount - totalPayments);
				
				return (
					<span className="text-sm font-bold text-orange-500 tabular-nums">
						{amountDue.toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}{" "}
						MAD
					</span>
				);
			},
		},
		{
			accessorKey: "totalAmount",
			header: () => <div className="text-right">Total Amount</div>,
			enableHiding: false,
			cell: ({ row }) => {
				return (
					<div className="text-primary text-right text-sm font-black tabular-nums">
						{parseFloat(row.original.totalAmount).toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}{" "}
						MAD
					</div>
				);
			},
		},

	];

	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data: documents,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		onColumnVisibilityChange: setColumnVisibility,
		state: {
			sorting,
			columnVisibility,
		},
	});

	return (
		<div className="animate-slide-up flex flex-col gap-4 delay-150">
			<div className="flex flex-col gap-4 md:flex-row md:items-center">
				<DocumentFilters />
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="ml-auto flex items-center gap-2">
							<Category size={16} />
							Columns
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{table
							.getAllColumns()
							.filter((column) => column.getCanHide())
							.map((column) => {
								return (
									<DropdownMenuCheckboxItem
										key={column.id}
										className="capitalize"
										checked={column.getIsVisible()}
										onCheckedChange={(value) => column.toggleVisibility(!!value)}
									>
										{column.id.replace(/([A-Z])/g, " $1").trim()}
									</DropdownMenuCheckboxItem>
								);
							})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<Table containerClassName="overflow-x-auto border-secondary/20">
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								key={headerGroup.id}
								className="border-b-secondary/20 transition-colors hover:bg-transparent"
							>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead
											key={header.id}
											className="px-4 whitespace-nowrap first:pl-6 last:pr-6"
										>
											{header.isPlaceholder ? null : (
												<div
													className={
														header.column.getCanSort()
															? "flex cursor-pointer items-center gap-2 select-none"
															: ""
													}
													onClick={header.column.getToggleSortingHandler()}
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
													{{
														asc: <ArrowUp2 size={14} />,
														desc: <ArrowDown2 size={14} />,
													}[header.column.getIsSorted() as string] ?? null}
												</div>
											)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody className="divide-secondary/15 divide-y">
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className="hover:bg-primary/5 group cursor-pointer border-none transition-colors"
									onClick={() => router.push(`/b2b/documents/${row.original.id}`)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className="px-4 py-3 whitespace-nowrap first:pl-6 last:pr-6"
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="text-muted-foreground h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>

			<div className="flex items-center justify-between pt-2">
				<div className="text-muted-foreground pl-2 text-sm font-medium">
					Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of {table.getFilteredRowModel().rows.length} entries
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}
