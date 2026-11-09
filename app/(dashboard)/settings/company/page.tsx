import { CompanyProfileForm } from "@/components/business-profile/company-form";
import { SaveProfileButton } from "@/components/business-profile/save-button";
import { getBusinessProfileAction } from "@/lib/actions/business-profile";
import { requireUser } from "@/lib/auth/require-user";
import { getUserProfile } from "@/lib/utils/user";

export default async function CompanySettingsPage() {
	const profile = await getBusinessProfileAction();
	const user = await requireUser();

	const currentUserName = getUserProfile(user).fullName;

	return (
		<CompanyProfileForm initialData={profile} currentUserName={currentUserName}>
			<div className="flex animate-slide-up flex-col justify-between gap-4 pb-8 md:flex-row md:items-center">
				<header className="space-y-1.5">
					<h1 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
						Business Profile
					</h1>
					<p className="text-sm font-medium text-muted-foreground">
						Manage studio branding and settings. Changes reflect instantly on documents.
					</p>
				</header>
				<SaveProfileButton />
			</div>
		</CompanyProfileForm>
	);
}
