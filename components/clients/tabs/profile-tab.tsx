import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { type Client } from "@/drizzle/schema";

import {
	Calendar,
	Call as Phone,
	DocumentText as FileText,
	Location as MapPin,
	Sms as Mail,
	User,
	Whatsapp,
} from "iconsax-reactjs";

interface ProfileTabProps {
	client: Client;
}

export function ProfileTab({ client }: ProfileTabProps) {
	return (
		<div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
			{/* Contact Info Card */}
			<Card>
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-xl">
						<User className="h-6 w-6" />
						Contact Information
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3">
						<div className="flex items-center gap-3">
							<Link
								href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}`}
								target="_blank"
								className="group text-muted-foreground ml-1 flex items-center transition-colors hover:text-[#25D366]"
							>
								<Whatsapp
									className="h-5 w-5 transition-colors"
									variant="Bulk"
								/>
							</Link>
							<Link
								href={`tel:${client.phone}`}
								className="hover:text-primary flex items-center gap-2 transition-colors"
							>
								<Phone className="text-muted-foreground h-5 w-5" />
								<span className="text-base">{client.phone}</span>
							</Link>
						</div>
						{client.email ? (
							<div className="flex items-center gap-3">
								<Mail className="text-muted-foreground h-5 w-5" />
								<a
									href={`mailto:${client.email}`}
									className="hover:text-primary text-base hover:underline"
								>
									{client.email}
								</a>
							</div>
						) : null}
						{client.address ? (
							<div className="flex items-start gap-3">
								<MapPin className="text-muted-foreground mt-0.5 h-5 w-5" />
								<span className="text-base">{client.address}</span>
							</div>
						) : null}
					</div>
				</CardContent>
			</Card>

			{/* Personal Details Card */}
			<Card>
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Calendar className="h-5 w-5" />
						Personal Details
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3">
						<div className="flex items-center gap-3">
							<span className="text-muted-foreground w-20">Born:</span>
							<span className="text-base">{client.birthDate}</span>
						</div>
						{client.profession ? (
							<div className="flex items-center gap-3">
								<span className="text-muted-foreground w-20">Profession:</span>
								<span className="text-base capitalize">
									{client.profession}
								</span>
							</div>
						) : null}
						<Separator />
						<div className="mt-2 grid grid-cols-2 gap-4">
							<div className="flex flex-col">
								<span className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
									Referral Source
								</span>
								<span className="font-medium capitalize">
									{client.referralSource?.replace("_", " ") || "N/A"}
								</span>
							</div>
							<div className="flex flex-col">
								<span className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
									Client Since
								</span>
								<span className="font-medium">
									{new Date(client.createdAt).toLocaleDateString()}
								</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Consultation Reason Card */}
			<Card className="md:col-span-2">
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-lg">
						<FileText className="h-5 w-5" />
						Consultation Reason
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-base">
						{client.consultationReason || "No specific reason recorded."}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
