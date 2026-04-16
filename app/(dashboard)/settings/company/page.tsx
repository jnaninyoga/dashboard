import { getBusinessProfileAction } from "@/actions/business-profile";
import { CompanyProfileForm } from "@/components/business-profile/company-form";

export default async function CompanySettingsPage() {
	const profile = await getBusinessProfileAction();

	return (
		<div className="flex flex-col gap-6">
			<header className="space-y-1">
				<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">
					Business Profile
				</h1>
				<p className="text-muted-foreground text-md">
				</p>
			</header>

			<CompanyProfileForm initialData={profile} />
		</div>
	);
}
