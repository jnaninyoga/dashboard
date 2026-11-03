import { phoneLine } from "@/components/b2b/documents/phone-line";
import { LoadingScreen, SkeletonLine } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils/ui";

/** DocumentSection: its heading on the page, then what it holds. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="space-y-3">
			<div className="flex min-h-10 items-center">
				<SkeletonLine className={cn("text-lg", title)} />
			</div>
			{children}
		</div>
	);
}

// An issued document (app/(dashboard)/b2b/documents/(detail)/[id]/page.tsx):
// the way back, its card with the amount, its actions, its lines and
// totals, its notes. A new quotation shows this too while its form loads.
export default function Loading() {
	return (
		<LoadingScreen label="Loading the document">
			{/* "Back to Documents" */}
			<SkeletonLine className="w-36 text-sm" />

			<div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-secondary/20 bg-card p-6 shadow-sm sm:p-8 md:flex-row">
				<div className="flex flex-col gap-6">
					<div className="flex items-center gap-4">
						<Skeleton className="size-14 shrink-0 rounded-2xl" />
						<div className="min-w-0 space-y-1">
							{/* Its number, the status beside it or under it when there's no room. */}
							<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
								<SkeletonLine className="w-44 text-2xl sm:w-52 sm:text-3xl" />
								<Skeleton className="h-7 w-24 rounded-lg" />
							</div>
							<SkeletonLine className="w-16 text-xs" />
						</div>
					</div>
					{/* Partner, issued on, due. */}
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{["w-32", "w-28", "w-28"].map((value, i) => (
							<div key={i} className="flex items-center gap-3">
								<Skeleton className="size-10 shrink-0 rounded-xl" />
								<div className="flex min-w-0 flex-col">
									<SkeletonLine className="w-14 text-[10px]" />
									<SkeletonLine className={cn("text-sm", value)} />
								</div>
							</div>
						))}
					</div>
				</div>
				{/* HeroAmount, on the right from md. */}
				<div className="flex flex-col justify-end md:items-end">
					<SkeletonLine className="w-20 text-[10px]" />
					<SkeletonLine className="w-48 text-4xl" />
					<SkeletonLine className="w-28 text-sm" />
				</div>
			</div>

			{/* The action ribbon: PDF, the next step, a quiet one. */}
			<div className="flex flex-wrap items-center justify-end gap-3">
				<div className="flex h-9 w-36 items-center justify-center rounded-xl border border-secondary-2 bg-muted shadow-sm dark:bg-input/30">
					<SkeletonLine className="w-24 text-sm" />
				</div>
				<Skeleton className="h-9 w-40 rounded-xl" />
				<div className="flex h-9 w-28 items-center justify-center">
					<SkeletonLine className="w-20 text-sm" />
				</div>
			</div>

			<Section title="w-24">
				<div className="space-y-6">
					{/* The real table parts: a stack per line on a phone (phoneLine), columns from sm. */}
					<div aria-hidden>
						<Table className={phoneLine.table}>
							<TableHeader className={phoneLine.head}>
								<TableRow className="border-b hover:bg-transparent">
									<TableHead className="px-6">
										<SkeletonLine className="w-20" />
									</TableHead>
									<TableHead className="w-24 px-2">
										<SkeletonLine className="mx-auto w-7" />
									</TableHead>
									<TableHead className="w-32 px-2">
										<SkeletonLine className="ml-auto w-16" />
									</TableHead>
									<TableHead className="w-40 px-2 pr-8">
										<SkeletonLine className="ml-auto w-10" />
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody className={cn("divide-y divide-secondary/15", phoneLine.body)}>
								{["w-56", "w-44", "w-64"].map((description, i) => (
									<TableRow
										key={i}
										className="border-none hover:bg-transparent max-sm:flex max-sm:flex-wrap max-sm:items-baseline max-sm:gap-x-2 max-sm:gap-y-1 max-sm:px-4 max-sm:py-3"
									>
										<TableCell className="px-6 py-4 max-sm:basis-full max-sm:p-0">
											<SkeletonLine className={cn("max-sm:w-3/4", description)} />
										</TableCell>
										<TableCell className="leading-none max-sm:p-0">
											<SkeletonLine className="mx-auto w-14 max-sm:mx-0" />
										</TableCell>
										<TableCell className="leading-none max-sm:p-0">
											<SkeletonLine className="ml-auto w-20 max-sm:ml-0" />
										</TableCell>
										<TableCell className="pr-8 max-sm:ml-auto max-sm:p-0">
											<SkeletonLine className="ml-auto w-20" />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* DocumentTotals */}
					<div className="flex w-full justify-end">
						<div className="w-full sm:max-w-xs">
							<div className="flex w-full flex-col gap-2.5 rounded-2xl border bg-card p-4 shadow-sm">
								<div className="flex items-center justify-between gap-4">
									<SkeletonLine className="w-16 text-sm" />
									<SkeletonLine className="w-24 text-lg" />
								</div>
								<div className="flex items-center justify-between gap-4">
									<SkeletonLine className="w-14 text-sm" />
									<SkeletonLine className="w-20 text-lg" />
								</div>
								<div className="h-px w-full shrink-0 bg-border" />
								<div className="flex items-center justify-between gap-4">
									<SkeletonLine className="w-10" />
									<SkeletonLine className="w-36 text-3xl" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</Section>

			{/* Notes, as an issued document shows them: read only, no toolbar. */}
			<Section title="w-14">
				<div className="overflow-hidden rounded-2xl border bg-card p-8 shadow-sm">
					<SkeletonLine className="w-2/3 text-sm leading-relaxed" />
					<SkeletonLine className="w-1/2 text-sm leading-relaxed" />
				</div>
			</Section>
		</LoadingScreen>
	);
}
