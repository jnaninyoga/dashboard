
import {
	getClientByIdAction,
	getGoogleContactPhotoAction,
} from "@/actions/clients";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	CreditCard,
	Tag,
    Briefcase,
    Pencil,
} from "lucide-react";
import Link from "next/link";
import { ClientActions } from "@/components/clients/client-actions";
import { ClientProfileTabs } from "@/components/clients/client-profile-tabs";
import { getMembershipProductsAction } from "@/actions/wallets";

// Next.js 15 params
type Params = Promise<{ id: string }>;

export default async function ClientProfilePage(props: { params: Params }) {
	const params = await props.params;
	const { id } = params;

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
		<div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
			{/* Header */}
			<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Avatar className="h-20 w-20 border-2 border-primary/10">
						<AvatarImage src={photoUrl || undefined} alt={client.fullName} />
						<AvatarFallback className="text-2xl">
							{client.fullName.charAt(0)}
						</AvatarFallback>
					</Avatar>
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							{client.fullName}
						</h1>
						<div className="flex flex-wrap items-center gap-2 mt-1">
							<Badge variant="outline" className="capitalize">
								{client.category?.name || "Uncategorized"}
							</Badge>
							{client.gender && (
								<Badge variant="secondary" className="capitalize">
									{client.gender}
								</Badge>
							)}
							{client.profession && (
								<span className="text-sm text-muted-foreground flex items-center gap-1">
									<Briefcase className="h-3 w-3" />
									{client.profession}
								</span>
							)}
						</div>
                        
                        {/* Status Badges */}
                        <div className="flex items-center gap-2 mt-3">
                            <Badge 
                                className={`text-sm px-3 py-1 ${totalCredits > 2 ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                <Tag className="w-3 h-3 mr-1" />
                                {totalCredits} Credits
                            </Badge>
                            
                            {activeProductName && (
                                <Badge variant="outline" className="text-sm px-3 py-1 border-primary/20 bg-primary/5 text-primary">
                                    <CreditCard className="w-3 h-3 mr-1" />
                                    {activeProductName}
                                </Badge>
                            )}
                        </div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Link href={`/clients/${client.id}/edit`}>
						<Button variant="outline">
							<Pencil className="mr-2 h-4 w-4" />
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
		</div>
	);
}
