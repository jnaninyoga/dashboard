import {
	CreateMembershipDialog,
	MembershipActions,
} from "@/components/clients/memberships/actions";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getMembershipProducts } from "@/lib/actions/clients/memberships";

export default async function MembershipSettingsPage() {
	const products = await getMembershipProducts();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">
						Membership Products
					</h1>
					<p className="text-md text-muted-foreground">
						Manage your class passes and membership types.
					</p>
				</div>
				<CreateMembershipDialog />
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Name</TableHead>
						<TableHead>Price</TableHead>
						<TableHead>Duration</TableHead>
						<TableHead>Credits</TableHead>
						<TableHead className="w-[70px]"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{products.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={5}
								className="text-muted-foreground h-24 text-center"
							>
								No active products found.
							</TableCell>
						</TableRow>
					) : (
						products.map((product) => (
							<TableRow key={product.id}>
								<TableCell className="pl-6 font-medium">
									{product.name}
								</TableCell>
								<TableCell>{product.basePrice} MAD</TableCell>
								<TableCell>{product.durationMonths} Months</TableCell>
								<TableCell>{product.defaultCredits}</TableCell>
								<TableCell>
									<MembershipActions product={product} />
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
