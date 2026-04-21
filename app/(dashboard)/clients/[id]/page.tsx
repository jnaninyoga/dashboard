import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getGoogleContactPhotoAction } from "@/lib/actions/clients/mutations";
import { getClientByIdAction } from "@/lib/actions/clients/queries";
import { getMembershipProductsAction } from "@/lib/actions/clients/wallets";
import { ClientActions } from "@/components/clients/actions";
import { ClientProfileTabs } from "@/components/clients/profile-tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
	Briefcase,
	Card,
	Edit2,
	Tag,
} from "iconsax-reactjs";

// Next.js 15 params
type Params = Promise<{ id: string }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
	const params = await props.params;
	const { client } = await getClientByIdAction(params.id);
	
	return {
		title: client ? `${client.fullName} | Client Profile` : "Client Profile",
		robots: {
			index: false,
			follow: false,
		},
	};
}

export default async function ClientProfilePage(props: { params: Params }) {
	const params = await props.params;
	const { id } = params;

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
			<ProfileContent id={id} />
		</div>
	);
}

async function ProfileContent({ id }: { id: string }) {
	// Parallel data fetching
	const clientPromise = getClientByIdAction(id);
	const productsPromise = getMembershipProductsAction();

	const [{ client, error }, { products }] = await Promise.all([
		clientPromise,
		productsPromise,
	]);

	if (error || !client) {
		return notFound();
	}

	// Fetch Google Photo (Read-Through Cache)
	let photoUrl = client.photoUrl;
	if (!photoUrl && client.googleContactResourceName) {
		const photoRes = await getGoogleContactPhotoAction(
			client.googleContactResourceName,
			client.id, // Trigger cache update
		);
		if (photoRes.success && photoRes.url) {
			photoUrl = photoRes.url;
		}
	}

    // Calculate Header Stats
    const wallets = client.wallets || [];
    const totalCredits = wallets
        .filter((w) => w.status === "active")
        .reduce((sum, w) => sum + w.remainingCredits, 0);
    
    const activeWallet = wallets.find(w => w.status === 'active'); // Just take first active for now
    const activeProductName = activeWallet?.product?.name;

	return (
		<>
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
				<div className="flex items-center gap-4">
					<Avatar className="border-primary/10 h-20 w-20 border-2">
						<AvatarImage src={photoUrl || undefined} alt={client.fullName} />
						<AvatarFallback className="text-2xl">
							{client.fullName.charAt(0)}
						</AvatarFallback>
					</Avatar>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							{client.fullName}
						</h1>
						<div className="mt-1 flex flex-wrap items-center gap-2">
							<Badge variant="outline" className="capitalize">
								{client.category?.name || "Uncategorized"}
							</Badge>
							{client.gender ? (
								<Badge variant="secondary" className="capitalize">
									{client.gender}
								</Badge>
							) : null}
							{client.profession ? (
								<span className="text-muted-foreground flex items-center gap-1 text-sm">
									<Briefcase className="h-3 w-3" variant="Outline" />
									{client.profession}
								</span>
							) : null}
						</div>
                        
                        {/* Status Badges */}
                        <div className="mt-3 flex items-center gap-2">
                            <Badge 
                                className={`px-3 py-1 text-sm ${totalCredits > 2 ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                <Tag className="mr-1 h-3 w-3" variant="Bulk" />
                                {totalCredits} Credits
                            </Badge>
                            
                            {activeProductName ? (
                                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary px-3 py-1 text-sm">
                                    <Card className="mr-1 h-3 w-3" variant="Outline" />
                                    {activeProductName}
                                </Badge>
                            ) : null}
                        </div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Link href={`/clients/${client.id}/edit`}>
						<Button variant="outline">
							<Edit2 className="mr-2 h-4 w-4" variant="Outline" />
							Edit Profile
						</Button>
					</Link>
					<ClientActions client={client} showEdit={false} />
				</div>
			</div>

			<Separator />

			{/* Tabs Layout */}
			<ClientProfileTabs 
                client={client} 
                products={products || []} 
            />
		</>
	);
}
