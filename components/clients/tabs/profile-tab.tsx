
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Mail,
	Phone,
	MapPin,
	Calendar,
	User,
	FileText,
} from "lucide-react";

// Use a loose type for now, or import strictly if possible. 
// We expect the client object from DB.
interface ProfileTabProps {
	client: any; // TODO: Strict typing with relations
}

export function ProfileTab({ client }: ProfileTabProps) {
	const intakeData = (client.intakeData as Record<string, string>) || {};

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

						<div className="grid grid-cols-2 gap-4 text-sm pt-2">
							<div className="flex flex-col">
								<span className="text-muted-foreground text-xs uppercase tracking-wider">
									Referral
								</span>
								<span className="font-medium capitalize">
									{client.referralSource?.replace("_", " ") || "N/A"}
								</span>
							</div>
							<div className="flex flex-col">
								<span className="text-muted-foreground text-xs uppercase tracking-wider">
									Client Since
								</span>
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

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Health & Wellness Profile</CardTitle>
					</CardHeader>
					<CardContent>
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
	);
}
