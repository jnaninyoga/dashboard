import {
	CreateMembershipDialog,
	MembershipActions,
} from "@/components/clients/memberships/actions";
import { Money } from "@/components/money";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getProducts } from "@/lib/actions/price-list";

export default async function MembershipSettingsPage() {
	const products = await getProducts("membership");

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">
						Memberships
					</h1>
					<p className="text-md text-muted-foreground">
						The cards you sell to clients: credits for their visits, for a number of months.
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
								<TableCell><Money amount={product.price} /></TableCell>
								<TableCell>{product.durationMonths} Months</TableCell>
								<TableCell>{product.credits}</TableCell>
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
