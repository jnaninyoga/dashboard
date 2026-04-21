import { CreateCategoryButton } from "@/components/clients/categories/create-button";
import { CategoryList } from "@/components/clients/categories/list";
import { getClientCategories } from "@/lib/actions/settings";

export default async function CategorySettingsPage() {
	const categories = await getClientCategories();

	return (
		<>
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<header className="space-y-1">
					<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">
						Category Settings
					</h1>
					<p className="text-md text-muted-foreground">
						Manage client categories and their associated discounts.
					</p>
				</header>
				<CreateCategoryButton />
			</div>

			<CategoryList initialCategories={categories} />
		</>
	);
}
