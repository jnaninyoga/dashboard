import {
	getClientByIdAction,
	getGoogleContactPhotoAction,
} from "@/actions/clients";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Mail,
	Phone,
	MapPin,
	Calendar,
	Briefcase,
	User,
	FileText,
	Pencil,
} from "lucide-react";
import Link from "next/link";
import { ClientActions } from "@/components/clients/client-actions";

// Next.js 15 params
type Params = Promise<{ id: string }>;

export default async function ClientProfilePage(props: { params: Params }) {
	const params = await props.params;
	const { id } = params;

	const { client, error } = await getClientByIdAction(id);

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

	// Prepare Intake Data Sections
	const intakeData = (client.intakeData as Record<string, string>) || {};

	// Helper to render health section if data exists
	const renderHealthSection = (title: string, keys: string[]) => {
		const hasData = keys.some((k) => intakeData[k]);
		if (!hasData) return null;

		return (
			<div className="mb-4">
				<h4 className="mb-2 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
					{title}
				</h4>
				<div className="grid gap-2 text-sm">
					{keys.map((key) => {
						if (!intakeData[key]) return null;
						// Format key to label (e.g. "currentPain" -> "Current Pain")
						const label = key
							.replace(/([A-Z])/g, " $1")
							.replace(/^./, (str) => str.toUpperCase());
						return (
							<div
								key={key}
								className="flex flex-col sm:flex-row sm:justify-between border-b pb-2 last:border-0"
							>
								<span className="font-medium">{label}</span>
								<span className="text-muted-foreground text-right">
									{intakeData[key]}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		);
	};

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
								{client.category}
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

			<div className="grid gap-6 md:grid-cols-3">
				{/* Left Column: Contact & Metadata */}
				<div className="space-y-6 md:col-span-1">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<User className="h-5 w-5" />
								Contact Details
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center gap-3">
								<Phone className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">{client.phone}</span>
							</div>
							{client.email && (
								<div className="flex items-center gap-3">
									<Mail className="h-4 w-4 text-muted-foreground" />
									<a
										href={`mailto:${client.email}`}
										className="text-sm hover:underline hover:text-primary"
									>
										{client.email}
									</a>
								</div>
							)}
							{client.address && (
								<div className="flex items-start gap-3">
									<MapPin className="h-4 w-4 text-muted-foreground mt-1" />
									<span className="text-sm">{client.address}</span>
								</div>
							)}
							<div className="flex items-center gap-3">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">Born: {client.birthDate}</span>
							</div>
							
							<Separator className="my-2" />
							
							{/* Metadata Merged */}
							<div className="grid grid-cols-2 gap-4 text-sm pt-2">
								<div className="flex flex-col">
									<span className="text-muted-foreground text-xs uppercase tracking-wider">Referral</span>
									<span className="font-medium capitalize">
										{client.referralSource?.replace("_", " ") || "N/A"}
									</span>
								</div>
								<div className="flex flex-col">
									<span className="text-muted-foreground text-xs uppercase tracking-wider">Client Since</span>
									<span className="font-medium">
										{new Date(client.createdAt).toLocaleDateString()}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right Column: Health & Notes */}
				<div className="space-y-6 md:col-span-2">
					{/* Consultation Notes */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg flex items-center gap-2">
								<FileText className="h-5 w-5" />
								Consultation
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h4 className="font-semibold text-sm mb-1">
									Reason for Consultation
								</h4>
								<p className="text-sm text-muted-foreground">
									{client.consultationReason || "No specific reason recorded."}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Health & Wellness */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								Health & Wellness Profile
							</CardTitle>
						</CardHeader>
						<CardContent>
							{/* Based on keys commonly used in our Health Template */}
							{renderHealthSection("Physical Health", [
								"medicalHistory",
								"surgeries",
								"injuries",
								"medications",
								"currentPain",
							])}
							{renderHealthSection("Wellness & Lifestyle", [
								"stressLevels",
								"sleepQuality",
								"nutrition",
								"exercise",
								"occupation",
								"emotionalHealth",
							])}

							{Object.keys(intakeData).length === 0 && (
								<p className="text-sm text-muted-foreground italic">
									No health data recorded.
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
