import { getClientCategories } from "@/actions/settings";
import { CategoryList } from "@/components/settings/category-list";
import { CreateCategoryButton } from "@/components/settings/create-category-button";

export default async function CategorySettingsPage() {
	const categories = await getClientCategories();

	return (
		<>
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<header className="space-y-1">
					<h1 className="text-3xl md:text-4xl font-heading font-medium tracking-tight text-foreground">
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
