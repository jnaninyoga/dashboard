import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getMembershipProducts } from "@/actions/memberships";
import { MembershipActions, CreateMembershipDialog } from "@/components/settings/membership-actions";

export default async function MembershipSettingsPage() {
	const products = await getMembershipProducts();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Membership Products</h1>
					<p className="text-muted-foreground">
						Manage your class passes and membership types.
					</p>
				</div>
                <CreateMembershipDialog />
			</div>

			<div className="border rounded-lg">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Price</TableHead>
							<TableHead>Duration</TableHead>
							<TableHead>Credits</TableHead>
							<TableHead className="w-[70px]"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{products.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
									No active products found.
								</TableCell>
							</TableRow>
						) : (
							products.map((product) => (
								<TableRow key={product.id}>
									<TableCell className="font-medium">{product.name}</TableCell>
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
		</div>
	);
}
