import { getClientCategories } from "@/actions/settings";
import { CategoryList } from "@/components/settings/category-list";

export default async function CategorySettingsPage() {
    const categories = await getClientCategories();

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Category Settings</h1>
				<p className="text-muted-foreground">
					Manage client categories and their associated discounts.
				</p>
			</div>

            <CategoryList initialCategories={categories} />
		</div>
	);
}
