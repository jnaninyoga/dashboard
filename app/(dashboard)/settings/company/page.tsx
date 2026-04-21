import { getBusinessProfileAction } from "@/actions/business-profile";
import { CompanyProfileForm } from "@/components/business-profile/company-form";
import { SaveProfileButton } from "@/components/business-profile/save-button";
import { createClient } from "@/services/supabase/server";

export default async function CompanySettingsPage() {
	const profile = await getBusinessProfileAction();
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	const currentUserName = user?.user_metadata?.full_name || user?.email || "";

	return (
		<CompanyProfileForm initialData={profile} currentUserName={currentUserName}>
			<div className="animate-slide-up flex flex-col justify-between gap-4 pb-8 md:flex-row md:items-center">
				<header className="space-y-1.5">
					<h1 className="font-heading text-foreground text-3xl font-bold tracking-tight md:text-4xl">
						Business Profile
					</h1>
					<p className="text-muted-foreground text-sm font-medium">
						Manage studio branding and settings. Changes reflect instantly on documents.
					</p>
				</header>
				<SaveProfileButton />
			</div>
		</CompanyProfileForm>
	);
}
