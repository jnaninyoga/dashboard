import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Sms as Mail,
	Call as Phone,
	Location as MapPin,
	Calendar,
	User,
	Briefcase,
	DocumentText as FileText,
} from "iconsax-reactjs";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons/whatsapp";

interface ProfileTabProps {
	client: any;
}

export function ProfileTab({ client }: ProfileTabProps) {
	return (
		<div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
			{/* Contact Info Card */}
			<Card>
				<CardHeader className="pb-4">
					<CardTitle className="text-xl flex items-center gap-2">
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
								className="group flex items-center ml-1 text-muted-foreground hover:text-[#25D366] transition-colors"
							>
								<WhatsAppIcon className="w-5 h-5 transition-colors" />
							</Link>
							<Link
								href={`tel:${client.phone}`}
								className="flex items-center gap-2 hover:text-primary transition-colors"
							>
								<Phone className="h-5 w-5 text-muted-foreground" />
								<span className="text-base">{client.phone}</span>
							</Link>
						</div>
						{client.email && (
							<div className="flex items-center gap-3">
								<Mail className="h-5 w-5 text-muted-foreground" />
								<a
									href={`mailto:${client.email}`}
									className="text-base hover:underline hover:text-primary"
								>
									{client.email}
								</a>
							</div>
						)}
						{client.address && (
							<div className="flex items-start gap-3">
								<MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
								<span className="text-base">{client.address}</span>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Personal Details Card */}
			<Card>
				<CardHeader className="pb-4">
					<CardTitle className="text-lg flex items-center gap-2">
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
						{client.profession && (
							<div className="flex items-center gap-3">
								<span className="text-muted-foreground w-20">Profession:</span>
								<span className="text-base capitalize">
									{client.profession}
								</span>
							</div>
						)}
						<Separator />
						<div className="grid grid-cols-2 gap-4 mt-2">
							<div className="flex flex-col">
								<span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
									Referral Source
								</span>
								<span className="font-medium capitalize">
									{client.referralSource?.replace("_", " ") || "N/A"}
								</span>
							</div>
							<div className="flex flex-col">
								<span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
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
					<CardTitle className="text-lg flex items-center gap-2">
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
