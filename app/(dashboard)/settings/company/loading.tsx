import { LoadingScreen, SkeletonField, SkeletonLine, SkeletonPageHeader } from "@/components/skeletons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/ui";

/** A card's heading in the form: the icon's tile, its name and what it's for. */
function Heading({ title, description }: { title: string; description: string }) {
	return (
		<div className="flex items-center gap-4">
			<Skeleton className="size-11 shrink-0 rounded-2xl" />
			<div className="min-w-0">
				<SkeletonLine className={cn("text-xl leading-none", title)} />
				<SkeletonLine className={cn("text-sm", description)} />
			</div>
		</div>
	);
}

/** FormInput: its small uppercase label over the field. */
function Field({ label, field = "h-9", className }: { label: string; field?: string; className?: string }) {
	return (
		<div className={cn("space-y-2.5", className)}>
			<SkeletonLine className={cn("ml-1 text-[10px] leading-none", label)} />
			<SkeletonField className={field} bar="w-2/5" />
		</div>
	);
}

/** An image's drop zone (AssetUploader), its picture still to come. */
function Asset({ label, aspect }: { label: string; aspect: string }) {
	return (
		<div className="space-y-3">
			<SkeletonLine className={cn("ml-1 text-xs leading-none", label)} />
			<div
				className={cn(
					"flex items-center justify-center rounded-3xl border-2 border-dashed border-secondary-2/40 bg-secondary/20",
					aspect,
				)}
			>
				<Skeleton className="size-16 rounded-2xl" />
			</div>
		</div>
	);
}

// The business profile (app/(dashboard)/settings/company/page.tsx and
// components/business-profile/company-form.tsx): identity, legal numbers
// and the images beside them, then what the PDFs carry.
export default function Loading() {
	return (
		<LoadingScreen label="Loading the business profile" className="gap-10 pb-20">
			<SkeletonPageHeader
				className="pb-8"
				title="w-60 md:w-72"
				description={["w-[36rem] text-sm max-md:w-full", "w-3/5 text-sm md:hidden"]}
				action="max-md:w-full md:w-54"
			/>

			<div className="grid gap-8 lg:grid-cols-3">
				<div className="space-y-8 lg:col-span-2">
					<Card className="overflow-hidden">
						<CardHeader>
							<Heading title="w-36" description="w-60" />
						</CardHeader>
						<CardContent className="grid gap-6">
							<div className="grid grid-cols-1 grid-rows-4 gap-2 md:grid-cols-2 md:grid-rows-2">
								<Field label="w-24" />
								<Field label="w-24" />
								<Field label="w-24" />
								{/* The phone's field and the address are taller (h-14). */}
								<Field label="w-24" field="h-14" />
								<Field label="w-24" field="h-14" className="md:col-span-2" />
							</div>
						</CardContent>
					</Card>

					<Card className="overflow-hidden">
						<CardHeader>
							<Heading title="w-40" description="w-72" />
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-4">
								{Array.from({ length: 4 }, (_, i) => (
									<div key={i} className="flex items-center gap-4">
										<SkeletonField className="flex-1" bar="w-1/3" />
										<SkeletonField className="flex-2" bar="w-1/2" />
										{/* The remove button's room. */}
										<span className="size-9 shrink-0" />
									</div>
								))}
							</div>
							{/* "Add Legal Identifier" */}
							<div className="flex h-12 w-full items-center justify-center rounded-2xl border border-dashed border-primary/10 bg-primary/2">
								<SkeletonLine className="w-40 text-sm" />
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					<Card className="h-full overflow-hidden">
						<CardHeader className="flex flex-row items-center justify-between">
							<div className="min-w-0">
								<SkeletonLine className="w-32 text-xl leading-none" />
								<SkeletonLine className="w-44 text-sm" />
							</div>
							<Skeleton className="size-5 shrink-0 rounded-full" />
						</CardHeader>
						<CardContent className="space-y-6">
							<Asset label="w-24" aspect="aspect-square" />
							<Asset label="w-44" aspect="aspect-video" />
						</CardContent>
					</Card>
				</div>
			</div>

			<Card className="overflow-hidden">
				<CardHeader className="flex flex-row items-center justify-between">
					<Heading title="w-56" description="w-64" />
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Bank details on the PDFs: the switch, then the editor. */}
					<div className="flex flex-col justify-between gap-4 border-b border-secondary/10 pb-6 sm:flex-row sm:items-center">
						<div className="space-y-1">
							<div className="ml-1 flex h-4 items-center">
								<SkeletonLine className="w-52 text-xs leading-none" />
							</div>
							<SkeletonLine className="ml-1 w-80 text-[10px] leading-none" />
							<SkeletonLine className="ml-1 w-32 text-[10px] leading-none sm:hidden" />
						</div>
						<div className="flex items-center gap-3 rounded-2xl border border-secondary-2/40 bg-secondary/50 px-4 py-2">
							<SkeletonLine className="w-12 text-[10px] leading-none" />
							<Skeleton className="h-[1.15rem] w-8 rounded-full" />
						</div>
					</div>
					{/* MarkdownEditor: its toolbar, then the page to write on. */}
					<div className="mt-2 p-1">
						<div className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
							<div className="flex items-center gap-1 border-b border-secondary-2/40 bg-secondary/70 p-2">
								{Array.from({ length: 5 }, (_, i) => (
									<div key={i} className="flex size-9 items-center justify-center">
										<Skeleton className="size-4.5 rounded-sm" />
									</div>
								))}
								{/* Write / Preview: words from sm, icons alone on a phone. */}
								<Skeleton className="ml-auto h-9 w-38 rounded-xl max-sm:w-20" />
							</div>
							<div className="min-h-40 px-6 py-5 text-sm leading-relaxed">
								<SkeletonLine className="w-56" />
								<SkeletonLine className="w-48" />
								<SkeletonLine className="w-72" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</LoadingScreen>
	);
}
