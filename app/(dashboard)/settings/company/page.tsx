import { getBusinessProfileAction } from "@/actions/business-profile";
import { CompanyProfileForm } from "@/components/business-profile/company-form";

export default async function CompanySettingsPage() {
	const profile = await getBusinessProfileAction();

	return (
		<div className="flex flex-col gap-8">
			<header className="animate-slide-up space-y-1.5">
				<h1 className="font-heading text-foreground text-3xl font-bold tracking-tight md:text-4xl">
					Business Profile
				</h1>
				<p className="text-muted-foreground text-sm font-medium">
					Manage your studio branding, legal identifiers, and document settings.
				</p>
			</header>

			<CompanyProfileForm initialData={profile} />
		</div>
	);
}
